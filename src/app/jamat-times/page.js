"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Save, Check } from "lucide-react";
import { FaAngleLeft, FaMosque, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import fetchFromApi from "../../utils/fetchFromApi";

function DigitalClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);
    const pad = (n) => n.toString().padStart(2, "0");
    let hours = time.getHours();
    const minutes = pad(time.getMinutes());
    const seconds = pad(time.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    hours = pad(hours);

    return (
        <div className="flex flex-col items-center mb-4">
            <span className="mt-1 text-xl text-amber-100 tracking-widest">
                Current Time
            </span>
            <br />
            <div className="flex items-end gap-2">
                <span
                    className="text-4xl md:text-5xl font-mono font-extrabold text-primary bg-black/80 px-6 py-3 rounded-xl shadow-lg border-4 border-primary"
                    style={{
                        fontFamily: "'Orbitron', 'Fira Mono', monospace",
                        letterSpacing: "0.08em",
                        boxShadow: "0 4px 24px #0004, 0 1px 0 #fff2",
                    }}
                >
                    {hours}:{minutes}:{seconds}
                </span>
                <span className="text-xl md:text-xl font-bold text-primary ml-1 mb-2 select-none">
                    {ampm}
                </span>
            </div>
        </div>
    );
}

export default function JamatTimesPage() {
    const router = useRouter();
    const [masjids, setMasjids] = useState([]);
    const [selectedMasjid, setSelectedMasjid] = useState("");
    const [selectedMasjidData, setSelectedMasjidData] = useState(null);
    const [selectedColony, setSelectedColony] = useState("");
    const [masjidSuggestionsVisible, setMasjidSuggestionsVisible] =
        useState(false);
    const [filteredMasjids, setFilteredMasjids] = useState([]);
    const [masjidHighlight, setMasjidHighlight] = useState(-1);
    const [colonySuggestionsVisible, setColonySuggestionsVisible] =
        useState(false);
    const [filteredColonies, setFilteredColonies] = useState([]);
    const [colonyHighlight, setColonyHighlight] = useState(-1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [autoLocating, setAutoLocating] = useState(false);
    const [userCoords, setUserCoords] = useState(null);
    const [mapEmbedUrl, setMapEmbedUrl] = useState(null);
    const [savedMasjid, setSavedMasjid] = useState(null);
    const [hasLoadedSavedMasjid, setHasLoadedSavedMasjid] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success"); // success or error

    useEffect(() => {
        loadSavedMasjid();
        fetchMasjids();
    }, []);

    // Auto-populate selected masjid when saved data is loaded (only once on initial load)
    useEffect(() => {
        if (savedMasjid && !hasLoadedSavedMasjid) {
            setSelectedMasjid(savedMasjid.masjidName || "");
            setSelectedColony(savedMasjid.colony || "");
            setSelectedMasjidData(savedMasjid);
            setHasLoadedSavedMasjid(true);
        }
    }, [savedMasjid, hasLoadedSavedMasjid]);

    const handleAutoLocate = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setAutoLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setUserCoords({ lat, lng });
                const embed = `https://www.google.com/maps?q=masjid&ll=${lat},${lng}&z=15&output=embed`;
                setMapEmbedUrl(embed);
                setAutoLocating(false);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setAutoLocating(false);
                alert(
                    "Unable to retrieve your location. Please enable location services and try again."
                );
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const fetchMasjids = async () => {
        try {
            setLoading(true);
            const response = await fetchFromApi("/api/all-masjids");
            const result = await response.json();

            if (response.ok) {
                setMasjids(result.data);
            } else {
                setError(result.error || "Failed to fetch masjids");
            }
        } catch (err) {
            setError("Network error occurred");
            console.error("Error fetching masjids:", err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = "success") => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => {
            setShowNotification(false);
        }, 4000); // Auto-hide after 4 seconds
    };

    const loadSavedMasjid = () => {
        try {
            const saved = localStorage.getItem("savedMasjidData");
            console.log("📖 Loading saved masjid from localStorage:", saved);
            if (saved) {
                const parsedData = JSON.parse(saved);
                console.log("✅ Parsed saved masjid data:", parsedData);
                setSavedMasjid(parsedData);
            } else {
                console.log("ℹ️ No saved masjid found in localStorage");
            }
        } catch (err) {
            console.error("❌ Error loading saved masjid:", err);
        }
    };

    const saveMasjidToLocalStorage = () => {
        if (!selectedMasjidData) return;

        const dataToSave = {
            masjidName: selectedMasjidData.masjidName,
            colony: selectedMasjidData.colony,
            locality: selectedMasjidData.locality || "",
            fazar: selectedMasjidData.fazar,
            zuhar: selectedMasjidData.zuhar,
            asar: selectedMasjidData.asar,
            maghrib: selectedMasjidData.maghrib,
            isha: selectedMasjidData.isha,
            juma: selectedMasjidData.juma,
            pasteMapUrl: selectedMasjidData.pasteMapUrl || "",
            savedAt: new Date().toISOString(),
        };

        try {
            localStorage.setItem("savedMasjidData", JSON.stringify(dataToSave));
            console.log("💾 Masjid saved to localStorage:", dataToSave);
            setSavedMasjid(dataToSave);
            showToast("✅ Masjid saved successfully!");
        } catch (err) {
            console.error("❌ Error saving masjid:", err);
            showToast("❌ Failed to save masjid. Please try again.", "error");
        }
    };

    const handleMasjidChange = (e) => {
        const masjidName = e.target.value;
        setSelectedMasjid(masjidName);
        const filtered = masjids.filter((m) =>
            m.masjidName.toLowerCase().includes(masjidName.toLowerCase())
        );
        setFilteredMasjids(filtered);
        setMasjidSuggestionsVisible(
            masjidName.trim().length > 0 && filtered.length > 0
        );
        setMasjidHighlight(-1);

        const exact = masjids.find((m) => m.masjidName === masjidName);
        if (exact) {
            setSelectedMasjidData(exact);
            setSelectedColony(exact.colony || "");
        } else {
            setSelectedMasjidData(null);
        }
    };

    const selectMasjid = (masjid) => {
        setSelectedMasjid(masjid.masjidName);
        setSelectedMasjidData(masjid);
        setSelectedColony(masjid.colony || "");
        setMasjidSuggestionsVisible(false);
        setFilteredMasjids([]);
        setMasjidHighlight(-1);
    };

    const handleMasjidKeyDown = (e) => {
        if (!masjidSuggestionsVisible) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setMasjidHighlight((i) =>
                Math.min(i + 1, filteredMasjids.length - 1)
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setMasjidHighlight((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const sel = filteredMasjids[masjidHighlight] || filteredMasjids[0];
            if (sel) selectMasjid(sel);
        } else if (e.key === "Escape") {
            setMasjidSuggestionsVisible(false);
        }
    };

    // clear helpers for the small X buttons
    const clearMasjid = (e) => {
        e.preventDefault();
        setSelectedMasjid("");
        setSelectedMasjidData(null);
        setFilteredMasjids([]);
        setMasjidSuggestionsVisible(false);
        setMasjidHighlight(-1);
        // Clear colony as well
        setSelectedColony("");
        setFilteredColonies([]);
        setColonySuggestionsVisible(false);
        setColonyHighlight(-1);
    };
    const clearColony = (e) => {
        e.preventDefault();
        setSelectedColony("");
        setFilteredColonies([]);
        setColonySuggestionsVisible(false);
        setColonyHighlight(-1);
        // Clear masjid as well
        setSelectedMasjid("");
        setSelectedMasjidData(null);
        setFilteredMasjids([]);
        setMasjidSuggestionsVisible(false);
        setMasjidHighlight(-1);
    };

    const colonies = [
        ...new Set(masjids.map((m) => m.colony || "").filter(Boolean)),
    ];

    // derived exact-match flags to avoid showing dropdown when an exact item is selected
    const selectedMasjidExact = masjids.some(
        (m) => m.masjidName === selectedMasjid
    );
    const selectedColonyExact = colonies.includes(selectedColony);

    // dropdown flags
    // keep the ">= 4" check as requested, but allow showing the dropdown even when there are no matches
    // so we can display a themed "No Match Found" message
    const showMasjidDropdown =
        masjidSuggestionsVisible ||
        (selectedMasjid.trim().length >= 4 && !selectedMasjidExact);
    const showColonyDropdown =
        colonySuggestionsVisible ||
        (selectedColony.trim().length >= 4 && !selectedColonyExact);

    const selectColony = (colony) => {
        setSelectedColony(colony);
        const masjidsInColony = masjids.filter((m) => m.colony === colony);
        if (masjidsInColony.length > 0) {
            setSelectedMasjid(masjidsInColony[0].masjidName);
            setSelectedMasjidData(masjidsInColony[0]);
        } else {
            setSelectedMasjid("");
            setSelectedMasjidData(null);
        }
        setFilteredColonies([]);
        setColonySuggestionsVisible(false);
        setColonyHighlight(-1);
    };

    const handleColonyChange = (e) => {
        const colony = e.target.value;
        setSelectedColony(colony);
        const filtered = colonies.filter(
            (c) => c && c.toLowerCase().includes(colony.toLowerCase())
        );
        setFilteredColonies(filtered);
        setColonySuggestionsVisible(
            colony.trim().length > 0 && filtered.length > 0
        );
        setColonyHighlight(-1);

        const exact = colonies.find((c) => c === colony);
        if (exact) {
            const masjidsInColony = masjids.filter((m) => m.colony === colony);
            if (masjidsInColony.length > 0) {
                setSelectedMasjid(masjidsInColony[0].masjidName);
                setSelectedMasjidData(masjidsInColony[0]);
            }
        }
    };

    const handleColonyKeyDown = (e) => {
        if (!colonySuggestionsVisible) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setColonyHighlight((i) =>
                Math.min(i + 1, filteredColonies.length - 1)
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setColonyHighlight((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const sel =
                filteredColonies[colonyHighlight] || filteredColonies[0];
            if (sel) selectColony(sel);
        } else if (e.key === "Escape") {
            setColonySuggestionsVisible(false);
        }
    };

    const getMapUrl = () => {
        if (!selectedMasjidData) return "";
        // Only return the stored map URL from API data
        return selectedMasjidData.pasteMapUrl || "";
    };

    const handleLink = async () => {
        const httpUrl = getMapUrl();
        if (!httpUrl) {
            showToast("Location is not added for this masjid.", "error");
            return;
        }

        // Build a text query for deep links
        const placeQuery = encodeURIComponent(
            `${selectedMasjidData?.masjidName || ""} ${
                selectedMasjidData?.colony || ""
            } ${selectedMasjidData?.locality || ""}`.trim()
        );

        try {
            const isTauri = process.env.NEXT_PUBLIC_TAURI_BUILD;

            if (isTauri) {
                // Use a runtime dynamic import wrapper to avoid bundlers trying to resolve
                // optional Tauri packages during web builds (which causes Module not found).
                const dynamicImport = (path) =>
                    new Function("p", "return import(p)")(path);

                let openUrl;
                try {
                    const opener = await dynamicImport(
                        "@tauri-apps/plugin-opener"
                    );
                    openUrl = opener.openUrl;
                } catch (err) {
                    // opener not available — fall back to web open later
                    openUrl = null;
                }

                let isiOS = false;
                let isAndroid = false;
                try {
                    const os = await dynamicImport("@tauri-apps/plugin-os");
                    const platform = await os.platform();
                    isiOS = platform === "ios";
                    isAndroid = platform === "android";
                } catch (_) {
                    // plugin-os unavailable — ignore and fall back to generic behavior
                }

                if (openUrl) {
                    if (isiOS) {
                        const iosGmaps = `comgooglemaps://?q=${placeQuery}`;
                        try {
                            await openUrl(iosGmaps);
                            return;
                        } catch (_) {
                            // Fall through to HTTPS
                        }
                    } else if (isAndroid) {
                        const androidGeo = `geo:0,0?q=${placeQuery}`;
                        try {
                            await openUrl(androidGeo);
                            return;
                        } catch (_) {
                            try {
                                await openUrl(
                                    `google.navigation:q=${placeQuery}`
                                );
                                return;
                            } catch (_) {}
                        }
                    }

                    try {
                        await openUrl(httpUrl);
                        return;
                    } catch (_) {
                        // fall back to window.open below
                    }
                }
            }

            window.open(httpUrl, "_blank", "noopener,noreferrer");
        } catch (e) {
            console.error("Failed to open map via opener:", e);
            try {
                window.open(httpUrl, "_blank", "noopener,noreferrer");
            } catch (err) {
                console.error("Fallback open failed:", err);
                showToast("Unable to open the map on this device.", "error");
            }
        }
    };

    const getJamatTimes = () => {
        if (!selectedMasjidData) return [];
        return [
            {
                name: "Fajr",
                time: selectedMasjidData.fazar,
                color: "border-blue-500",
            },
            {
                name: "Zuhr",
                time: selectedMasjidData.zuhar,
                color: "border-red-500",
            },
            {
                name: "Asar",
                time: selectedMasjidData.asar,
                color: "border-yellow-500",
            },
            {
                name: "Maghrib",
                time: selectedMasjidData.maghrib,
                color: "border-pink-500",
            },
            {
                name: "Isha",
                time: selectedMasjidData.isha,
                color: "border-indigo-500",
            },
            {
                name: "Juma Khutba",
                time: selectedMasjidData.juma,
                color: "border-green-500",
            },
        ];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="alert alert-error">
                    <span>Error: {error}</span>
                    <button className="btn btn-sm" onClick={fetchMasjids}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 pb-12">
            <button
                className="flex items-center gap-2 mb-4 text-lg text-primary hover:text-green-600 font-semibold"
                onClick={() => router.push("/")}
                aria-label="Back to Home"
                style={{ alignSelf: "flex-start" }}
            >
                <FaAngleLeft /> Back
            </button>

            <div className="sticky top-0 left-0 w-full z-10 flex justify-center bg-base-200/80 backdrop-blur-sm py-2">
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                    <DigitalClock />
                </div>
            </div>

            <div className="bg-white backdrop-blur-sm p-3 md:p-4 rounded-lg shadow-sm max-w-2xl mx-4 sm:mx-auto">
                <h2 className="text-base md:text-lg font-extrabold text-primary text-center leading-tight">
                    Currently this app shows Jama&apos;t Times of Bilaspur Dist
                    (C.G) Only
                </h2>
            </div>

            <div className="w-full max-w-md mt-8 mb-12 p-4">
                <div className="flex justify-start mb-8 ml-8">
                    <button
                        onClick={handleAutoLocate}
                        disabled={autoLocating}
                        className="btn btn-outline btn-primary btn-xxl transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-primary-content"
                    >
                        {autoLocating ? (
                            <>
                                <span className="loading loading-spinner loading-sm mr-2"></span>
                                LOCATING...
                            </>
                        ) : (
                            <>
                                <MapPin className="w-5 h-5 mr-2" />
                                See Nearby Masjid
                            </>
                        )}
                    </button>
                </div>

                {mapEmbedUrl && (
                    <div className="mx-4 mb-6 rounded-lg overflow-hidden border border-primary/20">
                        <iframe
                            title="Embedded Map"
                            src={mapEmbedUrl}
                            className="w-full"
                            style={{ height: 300, border: 0 }}
                            loading="lazy"
                        />
                    </div>
                )}

                <div className="flex flex-col gap-2 mb-6 ml-4 mr-4">
                    {/* Masjid search */}
                    <div className="w-full">
                        <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                            🕌 Search By Masjid Name
                        </h3>
                        <div className="relative group">
                            <input
                                className="input input-primary input-lg w-full pr-10"
                                value={selectedMasjid}
                                onChange={handleMasjidChange}
                                onKeyDown={handleMasjidKeyDown}
                                onFocus={() => {
                                    if (
                                        selectedMasjid.trim().length > 0 &&
                                        filteredMasjids.length > 0
                                    )
                                        setMasjidSuggestionsVisible(true);
                                }}
                                onBlur={() =>
                                    setTimeout(
                                        () =>
                                            setMasjidSuggestionsVisible(false),
                                        150
                                    )
                                }
                                placeholder="Search For Masjid"
                                aria-autocomplete="list"
                            />
                            {selectedMasjid.length > 0 && (
                                <button
                                    type="button"
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={clearMasjid}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 transform text-primary bg-primary/10 hover:bg-primary/20 rounded-full p-1 z-60 opacity-0 pointer-events-none transition-opacity duration-150 ease-in-out group-hover:opacity-100 group-focus-within:opacity-100 group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
                                    aria-label="Clear masjid"
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                            )}

                            {showMasjidDropdown && (
                                <ul className="absolute left-0 right-0 mt-1 z-50 max-h-44 overflow-auto bg-base-100 border border-primary/20 rounded-md shadow-lg">
                                    {filteredMasjids.length > 0 ? (
                                        filteredMasjids.map((m, idx) => (
                                            <li
                                                key={m.id}
                                                className={`px-3 py-2 cursor-pointer hover:bg-primary/10 ${
                                                    idx === masjidHighlight
                                                        ? "bg-primary/10"
                                                        : ""
                                                }`}
                                                onMouseDown={(ev) =>
                                                    ev.preventDefault()
                                                }
                                                onClick={() => selectMasjid(m)}
                                            >
                                                <div className="font-semibold text-primary">
                                                    {m.masjidName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {m.colony}
                                                    {m.locality
                                                        ? `, ${m.locality}`
                                                        : ""}
                                                </div>
                                            </li>
                                        ))
                                    ) : selectedMasjid.trim().length >= 4 ? (
                                        <li
                                            key="no-match"
                                            className="px-3 py-2 text-center text-sm text-primary opacity-80 cursor-default"
                                        >
                                            No Match Found
                                        </li>
                                    ) : null}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* OR separator */}
                    <div className="flex items-center justify-center py-2">
                        <div className="flex items-center gap-4 w-full">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/30"></div>
                            <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                                <span className="text-sm font-bold text-primary tracking-wider">
                                    OR
                                </span>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/30"></div>
                        </div>
                    </div>

                    {/* Colony search */}
                    <div className="w-full">
                        <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                            🏘️ Search By Colony Name
                        </h3>
                        <div className="relative group">
                            <input
                                className="input input-primary input-lg w-full pr-10"
                                value={selectedColony}
                                onChange={handleColonyChange}
                                onKeyDown={handleColonyKeyDown}
                                onFocus={() => {
                                    if (
                                        selectedColony.trim().length > 0 &&
                                        filteredColonies.length > 0
                                    )
                                        setColonySuggestionsVisible(true);
                                }}
                                onBlur={() =>
                                    setTimeout(
                                        () =>
                                            setColonySuggestionsVisible(false),
                                        150
                                    )
                                }
                                placeholder="Search by colony"
                                aria-autocomplete="list"
                            />

                            {selectedColony.length > 0 && (
                                <button
                                    type="button"
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={clearColony}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 transform text-primary bg-primary/10 hover:bg-primary/20 rounded-full p-1 z-60 opacity-0 pointer-events-none transition-opacity duration-150 ease-in-out group-hover:opacity-100 group-focus-within:opacity-100 group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
                                    aria-label="Clear colony"
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                            )}

                            {showColonyDropdown && (
                                <ul className="absolute left-0 right-0 mt-1 z-50 max-h-44 overflow-auto bg-base-100 border border-primary/20 rounded-md shadow-lg">
                                    {filteredColonies.length > 0 ? (
                                        filteredColonies.map((c, idx) => (
                                            <li
                                                key={c}
                                                className={`px-3 py-2 cursor-pointer hover:bg-primary/10 ${
                                                    idx === colonyHighlight
                                                        ? "bg-primary/10"
                                                        : ""
                                                }`}
                                                onMouseDown={(ev) =>
                                                    ev.preventDefault()
                                                }
                                                onClick={() => selectColony(c)}
                                            >
                                                <div className="font-semibold text-primary">
                                                    {c}
                                                </div>
                                            </li>
                                        ))
                                    ) : selectedColony.trim().length >= 4 ? (
                                        <li
                                            key="no-match"
                                            className="px-3 py-2 text-center text-sm text-primary opacity-80 cursor-default"
                                        >
                                            No Match Found
                                        </li>
                                    ) : null}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold mb-2 text-center">
                    Jama&apos;t Time In
                </h1>

                {selectedMasjidData && (
                    <div className="text-center mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="text-xl font-semibold text-primary">
                            {selectedMasjidData.masjidName}
                        </div>
                        <div className="text-xl text-white-600 mt-1">
                            {selectedMasjidData.colony}
                            {selectedMasjidData.locality && (
                                <span>, {selectedMasjidData.locality}</span>
                            )}
                        </div>
                    </div>
                )}

                <div className="card bg-base-100 shadow-xl mb-8">
                    <div className="card-body p-6">
                        {selectedMasjidData ? (
                            getJamatTimes().map((prayer) => (
                                <div
                                    key={prayer.name}
                                    className={`flex justify-between items-center border-l-4 ${prayer.color} bg-base-200 rounded-lg px-4 py-3 mb-3 last:mb-0`}
                                >
                                    <span className="font-semibold text-base">
                                        {prayer.name}
                                    </span>
                                    <span className="font-mono text-lg">
                                        {prayer.time}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-6">
                                <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FaMosque
                                        className="w-10 h-10 text-primary"
                                        aria-hidden="true"
                                    />
                                </div>
                                <h3 className="text-2xl font-semibold text-center mb-3 text-primary">
                                    Select A Masjid To View Jama&apos;t Time
                                </h3>
                            </div>
                        )}
                    </div>
                </div>
                {selectedMasjidData && (
                    <div className="mt-6 mb-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
                            {savedMasjid?.masjidName ===
                                selectedMasjidData.masjidName &&
                            savedMasjid?.colony === selectedMasjidData.colony
                                ? ""
                                : "Save this masjid details permanently to view Jama'at times"}
                        </p>

                        {/* Save button (fixed: closed properly, removed stray ternary) */}
                        <button
                            type="button"
                            onClick={saveMasjidToLocalStorage}
                            disabled={
                                savedMasjid?.masjidName ===
                                    selectedMasjidData.masjidName &&
                                savedMasjid?.colony ===
                                    selectedMasjidData.colony
                            }
                            className={`group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform overflow-hidden ${
                                savedMasjid?.masjidName ===
                                    selectedMasjidData.masjidName &&
                                savedMasjid?.colony ===
                                    selectedMasjidData.colony
                                    ? "bg-green-500 text-white cursor-not-allowed opacity-80"
                                    : "bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-white hover:scale-105 hover:shadow-xl active:scale-95"
                            }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                            {savedMasjid?.masjidName ===
                                selectedMasjidData.masjidName &&
                            savedMasjid?.colony ===
                                selectedMasjidData.colony ? (
                                <Check className="w-6 h-6 relative z-10" />
                            ) : (
                                <Save className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                            )}

                            <span className="relative z-10">
                                {savedMasjid?.masjidName ===
                                    selectedMasjidData.masjidName &&
                                savedMasjid?.colony ===
                                    selectedMasjidData.colony
                                    ? "Already Saved"
                                    : "Save Masjid"}
                            </span>
                        </button>

                        {showNotification && (
                            <div
                                className="mt-6 mb-8 text-center"
                                style={{
                                    animation: "slideInBottom 0.3s ease-out",
                                }}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {notificationType === "success" ? (
                                        <Check className="w-6 h-6" />
                                    ) : (
                                        <FaTimes className="w-6 h-6" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium leading-relaxed">
                                        {notificationMessage}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowNotification(false)}
                                    className="flex-shrink-0 ml-2 hover:bg-white/20 rounded-full p-1 transition"
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes slideInBottom {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
