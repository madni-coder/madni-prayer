"use client";
import React, { useEffect, useState, useRef } from "react";
import { Bell, BellOff, Calendar, Moon, X } from "lucide-react";
import { FaAngleLeft, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import fetchFromApi from '../../utils/fetchFromApi';

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
        color: "text-secondary text-base md:text-md",
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
        color: "text-success text-base md:text-md",
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
    const [now, setNow] = useState(new Date());
    const [prayerTimes, setPrayerTimes] = React.useState(initialPrayerTimes);
    const [loading, setLoading] = useState(true);
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
    const citySearchTimeoutRef = useRef(null);
    // prevent duplicate initial fetch (e.g., React 18 StrictMode)
    const initialFetchDoneRef = useRef(false);

    useEffect(() => {
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
        const fetchPrayerTimesAndSetState = async () => {
            try {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, "0");
                const d = String(today.getDate()).padStart(2, "0");
                const dateStr = `${y}-${m}-${d}`;

                const res = await fetchFromApi(`/api/api-prayerTimes?date=${dateStr}`);
                const json = await res.json();

                if (!res.ok) {
                    console.error("Failed to fetch prayer times:", json);
                    return;
                }

                // try to extract a sensible location name from the API response
                const loc =
                    json?.location?.name ||
                    json?.meta?.timezone ||
                    (json?.data &&
                        json.data.location &&
                        json.data.location.name) ||
                    json?.city ||
                    json?.address ||
                    "";
                setLocationName(loc);

                const timings = json.timings || {};

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
                setLoading(false);
            } catch (err) {
                console.error("Error fetching prayer times:", err);
            }
        };

        fetchPrayerTimesAndSetState();
    }, []);

    // Add handler for geolocation-based prayer times
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                let city = "";
                let formattedDisplay = "";
                try {
                    const geoRes = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
                    );
                    if (geoRes.ok) {
                        const geoJson = await geoRes.json();
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
                    }
                } catch (e) {
                    // silent
                }
                try {
                    const today = new Date();
                    const y = today.getFullYear();
                    const m = String(today.getMonth() + 1).padStart(2, "0");
                    const d = String(today.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    const res = await fetchFromApi(
                        `/api/api-prayerTimes?lat=${lat}&lon=${lon}&date=${dateStr}`
                    );
                    const json = await res.json();
                    if (!res.ok) {
                        alert(
                            "Failed to fetch prayer times for your location."
                        );
                        setLoading(false);
                        return;
                    }
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
                    setShowLocationModal(false);
                    setLoading(false);
                } catch (err) {
                    alert("Error fetching prayer times for your location.");
                    setLoading(false);
                }
            },
            (err) => {
                alert("Unable to retrieve your location.");
                setLoading(false);
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
            const res = await fetchFromApi(
                `/api/api-prayerTimes?lat=${lat}&lon=${lon}&date=${dateStr}`
            );
            const json = await res.json();
            if (!res.ok) {
                setLoading(false);
                alert("Failed to fetch prayer times for selected city.");
                return;
            }
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
            setShowLocationModal(false);
            setLoading(false);
        } catch (e) {
            console.error("City fetch error", e);
            setLoading(false);
            alert("Error fetching prayer times for selected city.");
        }
    };

    // Prefill search box with current location when opening modal if empty
    useEffect(() => {
        if (showLocationModal) {
            if (!citySearch && locationName) {
                setCitySearch(locationName.split(",")[0]);
            }
        }
    }, [showLocationModal, locationName]);

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
        citySearchTimeoutRef.current = setTimeout(async () => {
            try {
                setCitySearching(true);
                const q = encodeURIComponent(citySearch.trim());
                const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=in&addressdetails=1&q=${q}`;
                const res = await fetch(url, {
                    headers: {
                        "Accept-Language": "en",
                        "User-Agent":
                        "prayer-times-app/1.0 (+https://yourdomain.example)",
                    },
                });
                if (!res.ok) throw new Error("City search failed");
                const data = await res.json();
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
    }, [citySearch, showLocationModal]);

    // NEW: handler when selecting a city suggestion
    const handleSelectCity = (result) => {
        setSelectedCityResult(result);
        setCitySearch(result.display_name.split(",")[0]);
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
        <div
            className="w-full min-h-screen flex flex-col items-center justify-start bg-base-200"
            style={{ paddingTop: 0, marginTop: 0 }}
        >
            <button
                className="flex items-center gap-2 text-lg text-primary hover:text-green-600 font-semibold md:text-xl lg:text-2xl md:mt-4 md:mb-2"
                onClick={() => router.push("/")}
                aria-label="Back to Home"
                style={{ alignSelf: "flex-start", marginTop: 0, paddingTop: 0 }}
            >
                <FaAngleLeft /> Back
            </button>
            <section
                className="flex flex-col items-center justify-start w-full px-0 py-0 sm:px-0 sm:py-0 md:px-8 md:py-4 lg:px-16 lg:py-8 animate-fade-in bg-base-100"
                style={{ marginTop: 0, paddingTop: 0 }}
            >
                <h2
                    className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-0 sm:mb-0 md:mb-2 lg:mb-4"
                    style={{ marginTop: 0, paddingTop: 0 }}
                >
                    Prayer Times
                </h2>
                {/* Top Bar */}
                <div className="w-full max-w-2xl flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-0 md:gap-4 mb-0 md:mb-2 lg:mb-4">
                    {/* Hijri date removed as requested */}
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-sm sm:text-sm md:text-base text-white">
                        <Calendar className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        <span>
                            {now.toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "long",
                                day: "2-digit",
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-sm sm:text-sm md:text-base text-white">
                        <FaClock className="w-4 h-4 mr-1 md:w-5 md:h-5" />
                        <span>Time: {formatTime(now)}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base text-white">
                        <FaMapMarkerAlt className="w-4 h-4 md:w-5 md:h-5" />
                        <button
                            className="underline hover:text-green-400 focus:outline-none text-left"
                            onClick={() => setShowLocationModal(true)}
                            style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                margin: 0,
                            }}
                            aria-label="Select Location"
                        >
                            {locationName ? (
                                <div className="text-left leading-tight">
                                    <div className="font-medium text-white md:text-base lg:text-lg">
                                        {locationName.split(",")[0]}
                                    </div>
                                    {locationName.split(",").length > 1 && (
                                        <div className="text-[10px] sm:text-xs md:text-sm text-gray-300 mt-0.5">
                                            {locationName
                                                .split(",")
                                                .slice(1, 3)
                                                .join(",")
                                                .trim()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                "Unknown location"
                            )}
                        </button>
                    </div>
                </div>
                {/* Location Modal */}
                {showLocationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                        <div className="bg-[#181c27] rounded-xl shadow-lg p-6 w-[350px] max-w-full md:w-[400px] lg:w-[480px] relative">
                            <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                                onClick={() => setShowLocationModal(false)}
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-white text-lg md:text-xl font-semibold mb-4">
                                Select Location
                            </h3>
                            <button
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded mb-4 transition-colors"
                                onClick={handleGetLocation}
                            >
                                Get location
                            </button>
                            <div className="flex items-center my-2">
                                <div className="flex-grow h-px bg-gray-600" />
                                <span className="mx-2 text-gray-400 text-xs md:text-sm">
                                    OR
                                </span>
                                <div className="flex-grow h-px bg-gray-600" />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-[#23283a] border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring focus:border-green-500 mb-2 md:text-base"
                                placeholder="Search city (e.g. Mumbai, Delhi)..."
                                value={citySearch}
                                onChange={(e) => {
                                    setCitySearch(e.target.value);
                                }}
                            />
                            {/* NEW: suggestion list */}
                            {citySearching && (
                                <div className="text-xs md:text-sm text-gray-400 mb-2">
                                    Searching...
                                </div>
                            )}
                            {!citySearching && cityResults.length > 0 && (
                                <ul className="max-h-60 overflow-auto mb-2 border border-gray-600 rounded-lg divide-y divide-gray-600 bg-[#1a1f2e] shadow-lg">
                                    {cityResults.map((r) => (
                                        <li
                                            key={`${r.place_id}`}
                                            className={`px-3 py-2.5 text-sm md:text-base cursor-pointer hover:bg-gray-600/50 transition-colors ${
                                                selectedCityResult &&
                                                selectedCityResult.place_id ===
                                                    r.place_id
                                                    ? "bg-green-500/20 border-l-2 border-green-500"
                                                    : ""
                                            } text-gray-200`}
                                            onClick={() => handleSelectCity(r)}
                                        >
                                            <div className="font-medium text-white md:text-base">
                                                {r.display_name.split(",")[0]}
                                            </div>
                                            <div className="text-xs md:text-sm text-gray-400 mt-0.5">
                                                {r.display_name
                                                    .split(",")
                                                    .slice(1, 3)
                                                    .join(",")
                                                    .trim()}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {citySearch &&
                                !citySearching &&
                                cityResults.length === 0 && (
                                    <div className="text-xs md:text-sm text-gray-500 mb-2">
                                        No matches found.
                                    </div>
                                )}
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    className="px-4 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    onClick={() => setShowLocationModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-green-500 text-white font-semibold hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
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
                                    {loading ? "Loading..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Main Card */}
                <div className="relative glass-card p-2 sm:p-4 md:p-8 lg:p-10 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-8 items-center md:items-center bg-base-200 border border-base-300 shadow-md overflow-visible md:pl-16 lg:pl-20">
                    {/* Circular Countdown */}
                    <div className="flex flex-col items-center justify-center w-full md:w-auto mb-2 md:mb-0 shrink-0 md:mr-4 lg:mr-6">
                        <div
                            className="relative flex items-center justify-center w-[140px] sm:w-[110px] md:w-[160px] lg:w-[200px] aspect-square"
                            style={{ minWidth: "100px", minHeight: "100px" }}
                        >
                            <svg
                                className="absolute top-0 left-0 w-full h-full"
                                viewBox="0 0 180 180"
                                style={{ display: "block" }}
                            >
                                {(() => {
                                    const circumference = 2 * Math.PI * 80; // radius 80
                                    const idx = currentIdx;
                                    const start = prayerDateTimes[idx];
                                    let next =
                                        prayerDateTimes[
                                            (idx + 1) % prayerDateTimes.length
                                        ];
                                    if (next && start && next <= start) {
                                        next = new Date(
                                            next.getTime() + 24 * 60 * 60 * 1000
                                        );
                                    }
                                    const duration =
                                        start && next
                                            ? Math.max(
                                                  1,
                                                  Math.floor(
                                                      (next.getTime() -
                                                          start.getTime()) /
                                                          1000
                                                  )
                                              )
                                            : null;
                                    const progress =
                                        duration && timeLeftSeconds != null
                                            ? Math.max(
                                                  0,
                                                  Math.min(
                                                      1,
                                                      1 -
                                                          timeLeftSeconds /
                                                              duration
                                                  )
                                              )
                                            : 0;
                                    const offset =
                                        circumference * (1 - progress);

                                    return (
                                        <>
                                            {/* white full background circle */}
                                            <circle
                                                cx="90"
                                                cy="90"
                                                r="80"
                                                stroke="#ffffff"
                                                strokeWidth="7"
                                                fill="none"
                                                style={{ opacity: 1 }}
                                            />
                                            {/* yellow progress arc */}
                                            <circle
                                                cx="90"
                                                cy="90"
                                                r="80"
                                                stroke="#fbbf24"
                                                strokeWidth="7"
                                                fill="none"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={offset}
                                                strokeLinecap="round"
                                                className="transition-all"
                                                style={{ opacity: 0.95 }}
                                            />
                                        </>
                                    );
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full">
                                <span
                                    className="text-warning font-semibold text-sm sm:text-sm md:text-lg lg:text-xl mb-1"
                                    style={{ lineHeight: 1 }}
                                >
                                    {prayerTimes[currentIdx]?.displayName ||
                                        "namaz time"}
                                </span>
                                <span
                                    className="text-lg sm:text-lg md:text-2xl lg:text-3xl font-bold text-base-content mt-1"
                                    style={{ lineHeight: 1.05 }}
                                >
                                    {timeLeftSeconds != null
                                        ? formatDuration(timeLeftSeconds)
                                        : "--:--"}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Prayer Times List */}
                    <div className="flex-1 w-full">
                        {prayerTimes.map((prayer) => (
                            <div
                                key={prayer.name}
                                className={`flex items-center justify-between px-3 py-3 md:px-6 md:py-4 rounded-lg mb-3 bg-base-100 border-l-4 ${
                                    prayer.name.startsWith("Fajr")
                                        ? "border-primary"
                                        : prayer.name.startsWith("Sun Rise")
                                        ? "border-secondary"
                                        : prayer.name.startsWith("Zuhr")
                                        ? "border-accent"
                                        : prayer.name.startsWith("Asr")
                                        ? "border-warning"
                                        : prayer.name.startsWith("Maghrib")
                                        ? "border-green-500"
                                        : prayer.name.startsWith("Isha")
                                        ? "border-blue-500"
                                        : "border-base-300"
                                } shadow-sm`}
                            >
                                <span
                                    className={`font-semibold text-base md:text-lg lg:text-xl flex-1 truncate ${prayer.color}`}
                                >
                                    {prayer.displayName || "—"}
                                </span>
                                <span className="font-mono text-white text-base md:text-lg lg:text-xl text-base-content/90 ml-2 flex-shrink-0">
                                    {formatTo12Hour(prayer.time)}
                                </span>
                                <span className="ml-2 flex-shrink-0">
                                    {prayer.alert ? (
                                        <Bell
                                            className="w-5 h-5 md:w-6 md:h-6 text-warning"
                                            title="Azan alert on"
                                        />
                                    ) : (
                                        <BellOff
                                            className="w-5 h-5 md:w-6 md:h-6 text-base-content/30"
                                            title="Azan alert off"
                                        />
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
