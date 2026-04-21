"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Calendar, X } from "lucide-react";
import { FaPeriscope, FaAngleLeft, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import apiClient from "../../lib/apiClient";

const initialPrayerTimes = [
    {
        name: "Fajr",
        displayName: "",
        time: "—",
        alert: true,
        color: "text-primary text-base md:text-md",
    },
    {
        name: "Sun Rise",
        displayName: "",
        time: "—",
        alert: false,
        color: "text-error text-base md:text-md",
    },
    {
        name: "Zuhr",
        displayName: "",
        time: "—",
        alert: true,
        color: "text-accent text-base md:text-md",
    },
    {
        name: "Asr",
        displayName: "",
        time: "—",
        alert: true,
        color: "text-warning text-base md:text-md",
    },
    {
        name: "Maghrib",
        displayName: "",
        time: "—",
        alert: true,
        color: "text-white text-base md:text-md",
    },
    {
        name: "Isha",
        displayName: "",
        time: "—",
        alert: true,
        color: "text-info text-base md:text-md",
    },
];

// Helper to format time string to 12-hour format with AM/PM
function formatTo12Hour(timeStr) {
    if (!timeStr || timeStr === "—") return "—";
    // remove parenthesis and trailing text
    const cleaned = timeStr.replace(/\(.*?\)/, "").trim();
    const m = cleaned.match(/(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?/);
    if (!m) return timeStr;
    let hh = parseInt(m[1], 10);
    const mm = m[2];
    let ampm = m[3];
    if (!ampm) {
        ampm = hh >= 12 ? "PM" : "AM";
        if (hh === 0) hh = 12;
        else if (hh > 12) hh -= 12;
    } else {
        ampm = ampm.toUpperCase();
        if (hh === 0) hh = 12;
    }
    return `${hh}:${mm} ${ampm}`;
}

export default function PrayerTimesPage() {
    const router = useRouter();
    // Real-time clock state
    const [now, setNow] = useState(null);
    const [prayerTimes, setPrayerTimes] = React.useState(initialPrayerTimes);
    const [loading, setLoading] = useState(false);
    const [locationName, setLocationName] = useState("");
    // Date objects for each prayer time (for countdown calculations)
    const [prayerDateTimes, setPrayerDateTimes] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(null);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [citySearch, setCitySearch] = useState("");
    const [cityResults, setCityResults] = useState([]); // [{display_name, lat, lon}]
    const [citySearching, setCitySearching] = useState(false);
    const [selectedCityResult, setSelectedCityResult] = useState(null);
    const [suppressSearchAfterSelect, setSuppressSearchAfterSelect] =
        useState(false);
    const citySearchTimeoutRef = useRef(null);
    const LS_KEY = "prayer_saved_city";
    const LS_PRAYER_DATA_KEY = "prayer_times_data"; // For caching prayer times
    // prevent duplicate initial fetch (e.g., React 18 StrictMode)
    const initialFetchDoneRef = useRef(false);
    const locationSuccessRef = useRef(false); // true once a real location (GPS or cache) is loaded
    const [locationStatus, setLocationStatus] = useState("Detecting your location...");
    const [showGpsPrompt, setShowGpsPrompt] = useState(false);
    const [gpsError, setGpsError] = useState(null); // 1=permission denied, 2=GPS/location off
    const [modalLoading, setModalLoading] = useState(false); // loading inside location modal
    const [modalGpsError, setModalGpsError] = useState(null); // error inside location modal

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Parse a prayer time string like "04:39" or "4:39 PM" or "04:39 (IST)" into a Date object for referenceDate
    const parseTimeToDate = (timeStr, referenceDate) => {
        if (!timeStr || timeStr === "—") return null;
        // remove parenthesis and trailing text
        const cleaned = timeStr.replace(/\(.*?\)/, "").trim();
        const m = cleaned.match(/(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?/);
        if (!m) return null;
        let hh = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10);
        const ampm = m[3];

        const d = new Date(referenceDate);
        d.setSeconds(0, 0);
        if (ampm) {
            const isPm = /p/i.test(ampm);
            if (hh === 12) hh = isPm ? 12 : 0;
            else if (isPm) hh += 12;
        }
        d.setHours(hh, mm, 0, 0);
        return d;
    };

    // Build Date objects for each prayer time based on today
    useEffect(() => {
        if (!prayerTimes || prayerTimes.length === 0) return;
        const today = new Date();
        const dates = prayerTimes.map((p) => parseTimeToDate(p.time, today));

        // If any next prayer occurs earlier than previous, assume it is for the next day (handles Isha->Fajr)
        for (let i = 1; i < dates.length; i++) {
            if (dates[i] && dates[i - 1] && dates[i] < dates[i - 1]) {
                // add a day to this and subsequent dates until order is increasing
                for (let j = i; j < dates.length; j++) {
                    if (dates[j])
                        dates[j] = new Date(
                            dates[j].getTime() + 24 * 60 * 60 * 1000
                        );
                }
                break;
            }
        }

        setPrayerDateTimes(dates);
    }, [prayerTimes]);

    // Compute current prayer and seconds left until next prayer whenever 'now' or prayerDateTimes changes
    useEffect(() => {
        if (!prayerDateTimes || prayerDateTimes.length === 0) return;

        const nowMs = now.getTime();
        // Find index i such that prayerDateTimes[i] <= now < prayerDateTimes[i+1]
        let idx = -1;
        for (let i = 0; i < prayerDateTimes.length; i++) {
            const start = prayerDateTimes[i];
            if (!start) continue;
            const next = prayerDateTimes[(i + 1) % prayerDateTimes.length];
            let nextDate = next;
            if (
                i === prayerDateTimes.length - 1 &&
                nextDate &&
                nextDate <= start
            ) {
                // next is on next day
                nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
            }
            if (
                start &&
                nowMs >= start.getTime() &&
                nextDate &&
                nowMs < nextDate.getTime()
            ) {
                idx = i;
                const left = Math.max(
                    0,
                    Math.floor((nextDate.getTime() - nowMs) / 1000)
                );
                setCurrentIdx(i);
                setTimeLeftSeconds(left);
                return;
            }
        }

        // if not found, determine next upcoming prayer
        let upcomingIdx = -1;
        for (let i = 0; i < prayerDateTimes.length; i++) {
            const dt = prayerDateTimes[i];
            if (!dt) continue;
            if (dt.getTime() > nowMs) {
                upcomingIdx = i;
                break;
            }
        }
        if (upcomingIdx === -1) {
            // next is first prayer on next day
            const first = prayerDateTimes[0];
            if (first) {
                const left = Math.max(
                    0,
                    Math.floor(
                        (first.getTime() + 24 * 60 * 60 * 1000 - nowMs) / 1000
                    )
                );
                setCurrentIdx(prayerDateTimes.length - 1);
                setTimeLeftSeconds(left);
            }
        } else {
            const left = Math.max(
                0,
                Math.floor(
                    (prayerDateTimes[upcomingIdx].getTime() - nowMs) / 1000
                )
            );
            setCurrentIdx(
                (upcomingIdx - 1 + prayerDateTimes.length) %
                prayerDateTimes.length
            );
            setTimeLeftSeconds(left);
        }
    }, [now, prayerDateTimes]);

    const formatDuration = (secs) => {
        if (secs == null) return "";
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        // Always show hours, even if 0
        return `${String(h).padStart(2, "0")}:${String(m).padStart(
            2,
            "0"
        )}:${String(s).padStart(2, "0")}`;
    };

    useEffect(() => {
        if (initialFetchDoneRef.current) return; // guard against second invocation
        initialFetchDoneRef.current = true;

        const fetchPrayerTimesAndSetState = async (lat = null, lon = null, displayName = "") => {
            try {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, "0");
                const d = String(today.getDate()).padStart(2, "0");
                const dateStr = `${y}-${m}-${d}`;

                // Use Bilaspur as default if no coordinates provided
                const finalLat = lat || DEFAULT_BILASPUR.lat;
                const finalLon = lon || DEFAULT_BILASPUR.lon;
                const apiUrl = `/api/api-prayerTimes?lat=${finalLat}&lon=${finalLon}&date=${dateStr}`;

                const { data: json } = await apiClient.get(apiUrl);

                // try to extract a sensible location name from the API response
                const loc = displayName ||
                    json?.location?.name ||
                    json?.meta?.timezone ||
                    (json?.data &&
                        json.data.location &&
                        json.data.location.name) ||
                    json?.city ||
                    json?.address ||
                    "";
                setLocationName(loc);
                locationSuccessRef.current = true;

                const timings = json.timings || {};

                // Save prayer data to localStorage for offline access
                try {
                    const prayerDataToCache = {
                        timings,
                        location: loc,
                        date: dateStr,
                        lat: finalLat,
                        lon: finalLon
                    };
                    localStorage.setItem(LS_PRAYER_DATA_KEY, JSON.stringify(prayerDataToCache));
                } catch (e) {
                    console.warn("Could not cache prayer data", e);
                }

                // helper to find the best matching timing key for each displayed prayer
                const findTimingKey = (displayName) => {
                    const tokensMap = {
                        Fajr: ["fajr"],
                        "Sun Rise": ["sunrise", "sun rise", "sun"],
                        Zuhr: ["dhuhr", "zuhr", "zuhur"],
                        Asr: ["asr"],
                        Maghrib: ["maghrib"],
                        Isha: ["isha", "isya"],
                    };

                    const candidates = Object.keys(timings || {});
                    const tokens = tokensMap[displayName] || [
                        displayName.toLowerCase(),
                    ];

                    for (const token of tokens) {
                        const found = candidates.find((k) =>
                            k.toLowerCase().includes(token)
                        );
                        if (found) return found;
                    }

                    // fallback: try an exact key match ignoring case
                    const exact = candidates.find(
                        (k) => k.toLowerCase() === displayName.toLowerCase()
                    );
                    return exact || null;
                };

                const cleaned = (val) =>
                    typeof val === "string"
                        ? val.replace(/\s*\(.*?\)/, "").trim()
                        : val;

                setPrayerTimes((prev) =>
                    prev.map((p) => {
                        const key = findTimingKey(p.name);
                        const apiVal = key ? cleaned(timings[key]) : null;
                        return {
                            ...p,
                            time: apiVal ? formatTo12Hour(apiVal) : p.time,
                            // only show a displayName once we have an API value
                            displayName: apiVal ? p.name : "",
                        };
                    })
                );

                // Save the selected city to localStorage
                if (loc) {
                    try {
                        const saved = {
                            lat: String(finalLat),
                            lon: String(finalLon),
                            display_name: loc,
                        };
                        localStorage.setItem(LS_KEY, JSON.stringify(saved));
                    } catch (e) {
                        console.warn("Could not persist saved city", e);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching prayer times:", err);

                // On network error, try to load cached data from localStorage
                try {
                    const cachedData = localStorage.getItem(LS_PRAYER_DATA_KEY);
                    if (cachedData) {
                        const cached = JSON.parse(cachedData);
                        setLocationName(cached.location || "Cached Location");
                        const timings = cached.timings || {};

                        const findTimingKey = (displayName) => {
                            const tokensMap = {
                                Fajr: ["fajr"],
                                "Sun Rise": ["sunrise", "sun rise", "sun"],
                                Zuhr: ["dhuhr", "zuhr", "zuhur"],
                                Asr: ["asr"],
                                Maghrib: ["maghrib"],
                                Isha: ["isha", "isya"],
                            };
                            const candidates = Object.keys(timings || {});
                            const tokens = tokensMap[displayName] || [displayName.toLowerCase()];
                            for (const token of tokens) {
                                const found = candidates.find((k) => k.toLowerCase().includes(token));
                                if (found) return found;
                            }
                            const exact = candidates.find((k) => k.toLowerCase() === displayName.toLowerCase());
                            return exact || null;
                        };

                        const cleaned = (val) =>
                            typeof val === "string" ? val.replace(/\s*\(.*?\)/, "").trim() : val;

                        setPrayerTimes((prev) =>
                            prev.map((p) => {
                                const key = findTimingKey(p.name);
                                const apiVal = key ? cleaned(timings[key]) : null;
                                return {
                                    ...p,
                                    time: apiVal ? formatTo12Hour(apiVal) : p.time,
                                    displayName: apiVal ? p.name : "",
                                };
                            })
                        );
                    }
                } catch (cacheErr) {
                    console.warn("Could not load cached prayer data", cacheErr);
                }
            } finally {
                setLoading(false);
            }
        };

        // First, try to load from localStorage cache (works offline)
        try {
            const cachedData = localStorage.getItem(LS_PRAYER_DATA_KEY);
            if (cachedData) {
                const cached = JSON.parse(cachedData);
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, "0");
                const d = String(today.getDate()).padStart(2, "0");
                const todayStr = `${y}-${m}-${d}`;

                // If cached data is for today, use it immediately (works offline)
                if (cached.date === todayStr) {
                    setLocationName(cached.location || "Bilaspur, Chhattisgarh");
                    locationSuccessRef.current = true;
                    const timings = cached.timings || {};

                    const findTimingKey = (displayName) => {
                        const tokensMap = {
                            Fajr: ["fajr"],
                            "Sun Rise": ["sunrise", "sun rise", "sun"],
                            Zuhr: ["dhuhr", "zuhr", "zuhur"],
                            Asr: ["asr"],
                            Maghrib: ["maghrib"],
                            Isha: ["isha", "isya"],
                        };
                        const candidates = Object.keys(timings || {});
                        const tokens = tokensMap[displayName] || [displayName.toLowerCase()];
                        for (const token of tokens) {
                            const found = candidates.find((k) => k.toLowerCase().includes(token));
                            if (found) return found;
                        }
                        const exact = candidates.find((k) => k.toLowerCase() === displayName.toLowerCase());
                        return exact || null;
                    };

                    const cleaned = (val) =>
                        typeof val === "string" ? val.replace(/\s*\(.*?\)/, "").trim() : val;

                    setPrayerTimes((prev) =>
                        prev.map((p) => {
                            const key = findTimingKey(p.name);
                            const apiVal = key ? cleaned(timings[key]) : null;
                            return {
                                ...p,
                                time: apiVal ? formatTo12Hour(apiVal) : p.time,
                                displayName: apiVal ? p.name : "",
                            };
                        })
                    );
                    setLoading(false);
                }
            }
        } catch (e) {
            console.warn("Error reading cached prayer data", e);
        }

        // Always clear any previously saved city so auto-detection runs fresh every time
        try {
            localStorage.removeItem(LS_KEY);
        } catch (e) {
            console.warn("Could not clear saved city", e);
        }

        // Auto-detect location on every page load; show GPS prompt if denied or unavailable
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            setLocationStatus("Detecting your location...");
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    setLocationStatus("Fetching Your Current City...");
                    let displayName = "";
                    try {
                        const geoRes = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
                        );
                        const addr = geoRes?.data?.address || {};
                        const city =
                            addr.city ||
                            addr.town ||
                            addr.village ||
                            addr.municipality ||
                            addr.state_district ||
                            addr.state ||
                            "";
                        const district =
                            addr.district ||
                            addr.county ||
                            addr.state_district ||
                            addr.suburb ||
                            "";
                        const state = addr.state || addr.region || "";
                        const parts = [];
                        if (city) parts.push(city);
                        if (district && district !== city) parts.push(district);
                        if (state && state !== city && state !== district) parts.push(state);
                        displayName = parts.join(", ");
                    } catch (e) {
                        // silent — proceed without reverse geocode
                    }
                    fetchPrayerTimesAndSetState(lat, lon, displayName);
                },
                (err) => {
                    // err.code 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE(GPS off), 3=TIMEOUT
                    if (!locationSuccessRef.current) {
                        setGpsError(err.code || 1);
                        setShowGpsPrompt(true);
                    }
                    setLoading(false);
                },
                { timeout: 3000, maximumAge: 0 }
            );
        } else {
            // Geolocation API not available at all
            if (!locationSuccessRef.current) {
                setGpsError(2);
                setShowGpsPrompt(true);
            }
            setLoading(false);
        }
    }, []);

    // Add handler for geolocation-based prayer times
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by your browser.");
            return;
        }
        setModalLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                let city = "";
                let formattedDisplay = "";
                try {
                    const geoRes = await axios.get(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
                    );
                    const geoJson = geoRes?.data;
                    const addr = geoJson?.address || {};
                    city =
                        addr.city ||
                        addr.town ||
                        addr.village ||
                        addr.municipality ||
                        addr.state_district ||
                        addr.state ||
                        "";
                    const district =
                        addr.district ||
                        addr.county ||
                        addr.state_district ||
                        addr.suburb ||
                        addr.block ||
                        "";
                    const state = addr.state || addr.region || "";
                    const parts = [];
                    if (city) parts.push(city);
                    if (district && district !== city) parts.push(district);
                    if (state && state !== city && state !== district)
                        parts.push(state);
                    formattedDisplay = parts.join(", ");
                } catch (e) {
                    // silent
                }
                try {
                    const today = new Date();
                    const y = today.getFullYear();
                    const m = String(today.getMonth() + 1).padStart(2, "0");
                    const d = String(today.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    const { data: json } = await apiClient.get(
                        `/api/api-prayerTimes?lat=${lat}&lon=${lon}&date=${dateStr}`
                    );
                    const fallbackLoc =
                        formattedDisplay ||
                        city ||
                        json?.location?.name ||
                        json?.meta?.timezone ||
                        (json?.data &&
                            json.data.location &&
                            json.data.location.name) ||
                        json?.city ||
                        json?.address ||
                        "";
                    setLocationName(fallbackLoc);
                    const timings = json.timings || {};
                    const findTimingKey = (displayName) => {
                        const tokensMap = {
                            Fajr: ["fajr"],
                            "Sun Rise": ["sunrise", "sun rise", "sun"],
                            Zuhr: ["dhuhr", "zuhr", "zuhur"],
                            Asr: ["asr"],
                            Maghrib: ["maghrib"],
                            Isha: ["isha", "isya"],
                        };
                        const candidates = Object.keys(timings || {});
                        const tokens = tokensMap[displayName] || [
                            displayName.toLowerCase(),
                        ];
                        for (const token of tokens) {
                            const found = candidates.find((k) =>
                                k.toLowerCase().includes(token)
                            );
                            if (found) return found;
                        }
                        const exact = candidates.find(
                            (k) => k.toLowerCase() === displayName.toLowerCase()
                        );
                        return exact || null;
                    };
                    const cleaned = (val) =>
                        typeof val === "string"
                            ? val.replace(/\s*\(.*?\)/, "").trim()
                            : val;
                    setPrayerTimes((prev) =>
                        prev.map((p) => {
                            const key = findTimingKey(p.name);
                            const apiVal = key ? cleaned(timings[key]) : null;
                            return {
                                ...p,
                                time: apiVal ? formatTo12Hour(apiVal) : p.time,
                                displayName: apiVal ? p.name : "",
                            };
                        })
                    );

                    // Save the geolocation-based city to localStorage
                    try {
                        const saved = {
                            lat: String(lat),
                            lon: String(lon),
                            display_name: fallbackLoc,
                        };
                        localStorage.setItem(LS_KEY, JSON.stringify(saved));
                    } catch (e) {
                        console.warn("Could not persist saved city", e);
                    }

                    // Also cache the prayer data for offline access
                    try {
                        const prayerDataToCache = {
                            timings,
                            location: fallbackLoc,
                            date: dateStr,
                            lat: String(lat),
                            lon: String(lon)
                        };
                        localStorage.setItem(LS_PRAYER_DATA_KEY, JSON.stringify(prayerDataToCache));
                    } catch (e) {
                        console.warn("Could not cache prayer data", e);
                    }

                    setShowLocationModal(false);
                    setModalLoading(false);
                } catch (err) {
                    console.warn("Error fetching prayer times for your location.");
                    setModalLoading(false);
                }
            },
            (err) => {
                console.warn("Unable to retrieve your location.");
                setModalLoading(false);
                setModalGpsError(err.code || 2);
            }
        );
    };

    // NEW: Fetch prayer times by coordinates (used for selected city from search)
    const fetchPrayerTimesByCoords = async (lat, lon, fullDisplayName) => {
        try {
            setLoading(true);
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, "0");
            const d = String(today.getDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${d}`;
            const { data: json } = await apiClient.get(
                `/api/api-prayerTimes?lat=${lat}&lon=${lon}&date=${dateStr}`
            );
            setLocationName(
                fullDisplayName || json?.location?.name || json?.city || ""
            );
            const timings = json.timings || {};
            const findTimingKey = (displayName) => {
                const tokensMap = {
                    Fajr: ["fajr"],
                    "Sun Rise": ["sunrise", "sun rise", "sun"],
                    Zuhr: ["dhuhr", "zuhr", "zuhur"],
                    Asr: ["asr"],
                    Maghrib: ["maghrib"],
                    Isha: ["isha", "isya"],
                };
                const candidates = Object.keys(timings || {});
                const tokens = tokensMap[displayName] || [
                    displayName.toLowerCase(),
                ];
                for (const token of tokens) {
                    const found = candidates.find((k) =>
                        k.toLowerCase().includes(token)
                    );
                    if (found) return found;
                }
                const exact = candidates.find(
                    (k) => k.toLowerCase() === displayName.toLowerCase()
                );
                return exact || null;
            };
            const cleaned = (val) =>
                typeof val === "string"
                    ? val.replace(/\s*\(.*?\)/, "").trim()
                    : val;
            setPrayerTimes((prev) =>
                prev.map((p) => {
                    const key = findTimingKey(p.name);
                    const apiVal = key ? cleaned(timings[key]) : null;
                    return {
                        ...p,
                        time: apiVal ? formatTo12Hour(apiVal) : p.time,
                        displayName: apiVal ? p.name : "",
                    };
                })
            );
            // persist saved city (overwrite any previous)
            const finalDisplayName = fullDisplayName || json?.location?.name || json?.city || "";
            try {
                const saved = {
                    lat: String(lat),
                    lon: String(lon),
                    display_name: finalDisplayName,
                };
                localStorage.setItem(LS_KEY, JSON.stringify(saved));
            } catch (e) {
                // localStorage may be unavailable or quota exceeded; ignore
                console.warn("Could not persist saved city", e);
            }

            // Also cache the prayer data for offline access
            try {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, "0");
                const d = String(today.getDate()).padStart(2, "0");
                const dateStr = `${y}-${m}-${d}`;

                const prayerDataToCache = {
                    timings,
                    location: finalDisplayName,
                    date: dateStr,
                    lat: String(lat),
                    lon: String(lon)
                };
                localStorage.setItem(LS_PRAYER_DATA_KEY, JSON.stringify(prayerDataToCache));
            } catch (e) {
                console.warn("Could not cache prayer data", e);
            }
            setShowLocationModal(false);
            setLoading(false);
        } catch (e) {
            console.error("City fetch error", e);
            setLoading(false);
            console.warn("Error fetching prayer times for selected city.");
        }
    };
    // Removed: This logic is now handled in the initial fetch useEffect above
    // Prefill search box with current location when opening modal if empty
    // REPLACED: keep the search input empty by default and clear previous results/selection
    useEffect(() => {
        if (showLocationModal) {
            // keep input empty by default
            setCitySearch("");
            // clear any previous results / selection so dropdown won't show
            setSelectedCityResult(null);
            setCityResults([]);
            setCitySearching(false);
        } else {
            // reset transient modal state when it's closed
            setSelectedCityResult(null);
            setCityResults([]);
            setCitySearching(false);
        }
    }, [showLocationModal]);

    // NEW: Debounced search for Indian cities using Nominatim
    useEffect(() => {
        if (!showLocationModal) return; // only search while modal open
        if (citySearchTimeoutRef.current) {
            clearTimeout(citySearchTimeoutRef.current);
        }
        if (!citySearch || citySearch.trim().length < 2) {
            setCityResults([]);
            setSelectedCityResult(null);
            return;
        }

        // If user has selected a suggestion and we populated the input
        // with that exact short name, suppress re-running the search so
        // the dropdown doesn't re-render again until user types.
        if (
            suppressSearchAfterSelect &&
            selectedCityResult &&
            citySearch.trim() === selectedCityResult.display_name.split(",")[0]
        ) {
            // ensure results are hidden and not searching
            setCityResults([]);
            setCitySearching(false);
            return;
        }

        citySearchTimeoutRef.current = setTimeout(async () => {
            try {
                setCitySearching(true);
                const q = encodeURIComponent(citySearch.trim());
                const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=in&addressdetails=1&q=${q}`;
                const { data } = await axios.get(url, {
                    headers: {
                        "Accept-Language": "en",
                        "User-Agent":
                            "prayer-times-app/1.0 (+https://yourdomain.example)",
                    },
                });
                // Show all results from API instead of filtering
                setCityResults(data || []);
            } catch (e) {
                console.error(e);
                setCityResults([]);
            } finally {
                setCitySearching(false);
            }
        }, 450); // debounce 450ms
        return () => clearTimeout(citySearchTimeoutRef.current);
    }, [
        citySearch,
        showLocationModal,
        suppressSearchAfterSelect,
        selectedCityResult,
    ]);

    // NEW: handler when selecting a city suggestion
    const handleSelectCity = (result) => {
        // mark selection, populate the short name into input,
        // hide dropdown and suppress further automatic search for that text
        setSelectedCityResult(result);
        setCitySearch(result.display_name.split(",")[0]);
        setCityResults([]); // hide the list immediately
        setSuppressSearchAfterSelect(true);
    };

    // Format time as HH:MM:SS AM/PM
    const formatTime = (date) =>
        date
            .toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            })
            .replace(/^0/, "");

    return (
        <div className="w-full min-h-screen bg-base-200">



            {/* Header Section */}
            <div className="w-full bg-base-100 border-b border-base-300 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 md:py-4">

                    {/* GPS warning banner — shown above back button */}
                    {showGpsPrompt && (
                        <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg bg-warning/10 border border-warning">
                            <div className="flex items-center gap-2 min-w-0">
                                <FaMapMarkerAlt className="text-warning shrink-0 w-4 h-4" />
                                <p className="text-warning text-l font-medium leading-tight">
                                    {gpsError === 1
                                        ? "Please Turn On Location"
                                        : "GPS is off — enable it for accurate prayer times"}
                                </p>
                            </div>
                            <button
                                className="shrink-0 bg-warning text-warning-content text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-warning/80 transition-colors"
                                onClick={() => {
                                    setShowGpsPrompt(false);
                                    setGpsError(null);
                                    setLoading(true);
                                    setLocationStatus("Detecting your location...");
                                    navigator.geolocation.getCurrentPosition(
                                        async (pos) => {
                                            const lat = pos.coords.latitude;
                                            const lon = pos.coords.longitude;
                                            setLocationStatus("Fetching prayer times...");
                                            let displayName = "";
                                            try {
                                                const geoRes = await axios.get(
                                                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
                                                );
                                                const addr = geoRes?.data?.address || {};
                                                const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.state || "";
                                                const district = addr.district || addr.county || addr.state_district || addr.suburb || "";
                                                const state = addr.state || addr.region || "";
                                                const parts = [];
                                                if (city) parts.push(city);
                                                if (district && district !== city) parts.push(district);
                                                if (state && state !== city && state !== district) parts.push(state);
                                                displayName = parts.join(", ");
                                            } catch (e) { /* silent */ }
                                            const today = new Date();
                                            const y = today.getFullYear();
                                            const m = String(today.getMonth() + 1).padStart(2, "0");
                                            const d = String(today.getDate()).padStart(2, "0");
                                            const dateStr = `${y}-${m}-${d}`;
                                            try {
                                                const { data: json } = await apiClient.get(`/api/api-prayerTimes?lat=${lat}&lon=${lon}&date=${dateStr}`);
                                                const loc = displayName || json?.location?.name || json?.meta?.timezone || json?.city || "";
                                                setLocationName(loc);
                                                const timings = json.timings || {};
                                                const tkMap = { Fajr: ["fajr"], "Sun Rise": ["sunrise", "sun rise", "sun"], Zuhr: ["dhuhr", "zuhr", "zuhur"], Asr: ["asr"], Maghrib: ["maghrib"], Isha: ["isha", "isya"] };
                                                const findKey = (n) => { const cands = Object.keys(timings); for (const t of (tkMap[n] || [n.toLowerCase()])) { const f = cands.find(k => k.toLowerCase().includes(t)); if (f) return f; } return cands.find(k => k.toLowerCase() === n.toLowerCase()) || null; };
                                                const cleaned = (v) => typeof v === "string" ? v.replace(/\s*\(.*?\)/, "").trim() : v;
                                                setPrayerTimes(prev => prev.map(p => { const key = findKey(p.name); const av = key ? cleaned(timings[key]) : null; return { ...p, time: av ? formatTo12Hour(av) : p.time, displayName: av ? p.name : "" }; }));
                                                try { localStorage.setItem(LS_KEY, JSON.stringify({ lat: String(lat), lon: String(lon), display_name: loc })); } catch (e) { }
                                                try { localStorage.setItem(LS_PRAYER_DATA_KEY, JSON.stringify({ timings, location: loc, date: dateStr, lat: String(lat), lon: String(lon) })); } catch (e) { }
                                            } catch (e) { console.error(e); }
                                            setLoading(false);
                                        },
                                        (err) => {
                                            setGpsError(err.code || 1);
                                            setLoading(false);
                                            setShowGpsPrompt(true);
                                        },
                                        { timeout: 10000, maximumAge: 0 }
                                    );
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    <button
                        className="flex items-center gap-1.5 text-primary hover:text-green-500 font-medium transition-colors mb-2 md:mb-3"
                        onClick={() => router.push("/")}
                        aria-label="Back to Home"
                    >
                        <FaAngleLeft className="w-4 h-4" />
                        <span className="text-sm md:text-base">Back</span>
                    </button>

                    <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-primary mb-4 md:mb-6 text-center">
                        Prayer Times
                    </h1>

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        {/* Date Card */}
                        <div className="bg-base-200 rounded-lg p-3 md:p-4 flex items-center gap-3 border border-base-300">
                            <div className="p-2 md:p-2.5 bg-primary/10 rounded-lg">
                                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm md:text-base text-base-content font-bold">
                                    {now ? now.toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                    }) : "—"}
                                </p>
                                <p className="text-xs text-white">
                                    {now ? now.toLocaleDateString("en-US", {
                                        year: "numeric",
                                    }) : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Time Card */}
                        <div className="bg-base-200 rounded-lg p-3 md:p-4 flex items-center gap-3 border border-base-300">
                            <div className="p-2 md:p-2.5 bg-green-500/10 rounded-lg">
                                <FaClock className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-large mb-0.5">Current Time</p>
                                <p className="text-sm md:text-base text-base-content font-bold font-mono tabular-nums whitespace-nowrap">
                                    {now ? formatTime(now) : "—"}
                                </p>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">

                    {/* Countdown Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-base-100 rounded-xl shadow-lg p-3 md:p-6 border border-base-300 lg:sticky lg:top-6">

                            <div className="flex flex-col items-center justify-center">
                                <div className="relative w-36 h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 mb-2 md:mb-4">
                                    <svg
                                        className="absolute top-0 left-0 w-full h-full transform -rotate-90"
                                        viewBox="0 0 180 180"
                                    >
                                        {(() => {
                                            const circumference = 2 * Math.PI * 80;
                                            const idx = currentIdx;
                                            const start = prayerDateTimes[idx];
                                            let next = prayerDateTimes[(idx + 1) % prayerDateTimes.length];
                                            if (next && start && next <= start) {
                                                next = new Date(next.getTime() + 24 * 60 * 60 * 1000);
                                            }
                                            const duration = start && next
                                                ? Math.max(1, Math.floor((next.getTime() - start.getTime()) / 1000))
                                                : null;
                                            const progress = duration && timeLeftSeconds != null
                                                ? Math.max(0, Math.min(1, 1 - timeLeftSeconds / duration))
                                                : 0;
                                            const offset = circumference * (1 - progress);

                                            return (
                                                <>
                                                    <circle
                                                        cx="90"
                                                        cy="90"
                                                        r="80"
                                                        stroke="currentColor"
                                                        className="text-base-300"
                                                        strokeWidth="8"
                                                        fill="none"
                                                    />
                                                    <circle
                                                        cx="90"
                                                        cy="90"
                                                        r="80"
                                                        stroke="currentColor"
                                                        className="text-warning"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        strokeDasharray={circumference}
                                                        strokeDashoffset={offset}
                                                        strokeLinecap="round"
                                                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                                                    />
                                                </>
                                            );
                                        })()}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-warning font-semibold text-sm md:text-lg mb-1 md:mb-2">
                                            {prayerTimes[currentIdx]?.displayName || "Loading"}
                                        </span>
                                        <span className="text-xl md:text-3xl lg:text-4xl font-bold text-base-content">
                                            {timeLeftSeconds != null
                                                ? formatDuration(timeLeftSeconds)
                                                : "--:--:--"}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xxl md:text-sm text-bold text-white text-center">
                                    Time remaining
                                </p>

                                {/* Location Button */}
                                <button
                                    className="mt-4 w-full bg-base-200 hover:bg-base-300 rounded-lg p-3 flex items-center justify-center gap-2 border border-base-300 transition-colors"
                                    onClick={() => setShowLocationModal(true)}
                                >
                                    <FaMapMarkerAlt className="w-4 h-4 text-warning" />
                                    <div className="flex flex-col items-start">
                                        {loading ? (
                                            <span className="text-xs text-base-content/60 animate-pulse">{locationStatus}</span>
                                        ) : locationName ? (
                                            <span className="text-sm font-semibold text-base-content underline">
                                                {locationName.split(",")[0]}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-base-content/40">Tap to select location</span>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Prayer Times List */}
                    <div className="lg:col-span-2">
                        <div className="bg-base-100 rounded-xl shadow-lg p-3 md:p-6 border border-base-300">

                            <div className="space-y-2 md:space-y-3">
                                {prayerTimes.map((prayer, index) => (
                                    <div
                                        key={prayer.name}
                                        className={`group relative flex items-center justify-between p-2.5 md:p-4 rounded-lg transition-all border-2 ${currentIdx === index
                                            ? "bg-primary/10 border-primary shadow-md scale-[1.02]"
                                            : "bg-base-200 border-transparent hover:border-base-300"
                                            }`}
                                    >
                                        {/* Color indicator */}
                                        <div
                                            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${prayer.name === "Fajr"
                                                ? "bg-primary"
                                                : prayer.name === "Sun Rise"
                                                    ? "bg-error"
                                                    : prayer.name === "Zuhr"
                                                        ? "bg-accent"
                                                        : prayer.name === "Asr"
                                                            ? "bg-warning"
                                                            : prayer.name === "Maghrib"
                                                                ? "bg-purple-500"
                                                                : "bg-info"
                                                }`}
                                        />

                                        <div className="flex items-center gap-2 md:gap-4 flex-1 ml-2 md:ml-3">
                                            <div className="flex-1">
                                                <h3 className={`font-semibold text-sm md:text-lg ${currentIdx === index ? "text-primary" : "text-base-content"
                                                    }`}>
                                                    {prayer.displayName || prayer.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2 md:gap-3">
                                                <span className="font-mono text-base md:text-xl font-bold text-base-content">
                                                    {formatTo12Hour(prayer.time)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-base-300">
                            <h3 className="text-xl font-bold text-base-content">
                                Select Location
                            </h3>
                            <button
                                className="p-2 hover:bg-base-200 rounded-lg transition-colors"
                                onClick={() => setShowLocationModal(false)}
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-base-content" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Get Location Button / Loader */}
                            {modalLoading ? (
                                <div className="w-full bg-green-500/10 border border-green-500/30 rounded-lg py-3 px-4 flex flex-col items-center gap-2">
                                    <div className="flex gap-1.5">
                                        {[0, 120, 240].map((delay) => (
                                            <span
                                                key={delay}
                                                className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                                                style={{ animationDelay: `${delay}ms` }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-green-500 text-xs font-medium animate-pulse">Detecting your location...</p>
                                </div>
                            ) : (
                                <button
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    onClick={() => { setModalGpsError(null); handleGetLocation(); }}
                                >
                                    <FaMapMarkerAlt className="w-4 h-4" />
                                    Use My Current Location
                                </button>
                            )}

                            {/* Inline GPS error */}
                            {modalGpsError && !modalLoading && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning">
                                    <FaMapMarkerAlt className="text-warning w-3.5 h-3.5 shrink-0" />
                                    <p className="text-warning text-xs font-medium">
                                        {modalGpsError === 1
                                            ? "Please enable GPS and try again"
                                            : "Please enable GPS and try again"}
                                    </p>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-base-300" />
                                <span className="text-sm text-base-content/50 font-medium">OR</span>
                                <div className="flex-1 h-px bg-base-300" />
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-base-200 border border-base-300 rounded-lg px-4 py-3 text-base-content placeholder-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="Search for a city..."
                                    value={citySearch}
                                    onChange={(e) => {
                                        setCitySearch(e.target.value);
                                        if (selectedCityResult) setSelectedCityResult(null);
                                        if (suppressSearchAfterSelect) setSuppressSearchAfterSelect(false);
                                    }}
                                />
                                {citySearch && (
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-base-300 rounded-lg transition-colors"
                                        aria-label="Clear search"
                                        onClick={() => {
                                            setCitySearch("");
                                            setSelectedCityResult(null);
                                            setSuppressSearchAfterSelect(false);
                                        }}
                                    >
                                        <X className="w-4 h-4 text-base-content/50" />
                                    </button>
                                )}
                            </div>

                            {/* Search Results */}
                            {citySearching && (
                                <div className="text-sm text-base-content/50 py-2 text-center">
                                    Searching cities...
                                </div>
                            )}

                            {!citySearching && cityResults.length > 0 && (
                                <div className="max-h-64 overflow-y-auto rounded-lg border border-base-300 bg-base-200">
                                    {cityResults.map((r) => (
                                        <button
                                            key={r.place_id}
                                            className={`w-full text-left px-4 py-3 hover:bg-base-300 transition-colors border-b border-base-300 last:border-b-0 ${selectedCityResult?.place_id === r.place_id
                                                ? "bg-primary/10 border-l-4 border-l-primary"
                                                : ""
                                                }`}
                                            onClick={() => handleSelectCity(r)}
                                        >
                                            <div className="font-medium text-base-content">
                                                {r.display_name.split(",")[0]}
                                            </div>
                                            <div className="text-sm text-base-content/60 mt-0.5">
                                                {r.display_name.split(",").slice(1, 3).join(",").trim()}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {citySearch && !citySearching && cityResults.length === 0 && !selectedCityResult && (
                                <div className="text-sm text-base-content/50 py-4 text-center">
                                    No cities found. Try a different search.
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-base-300">
                            <button
                                className="px-6 py-2.5 rounded-lg font-medium text-base-content hover:bg-base-200 transition-colors"
                                onClick={() => setShowLocationModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${selectedCityResult
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "bg-base-300 text-base-content/40 cursor-not-allowed"
                                    }`}
                                disabled={!selectedCityResult}
                                onClick={() => {
                                    if (!selectedCityResult) return;
                                    fetchPrayerTimesByCoords(
                                        selectedCityResult.lat,
                                        selectedCityResult.lon,
                                        selectedCityResult.display_name
                                    );
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
