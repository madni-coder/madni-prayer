"use client";
import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { FaAngleLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import fetchFromApi from '../../utils/fetchFromApi';

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

    useEffect(() => {
        fetchMasjids();
    }, []);

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

    const colonies = [...new Set(masjids.map((m) => m.colony))];

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
        return (
            selectedMasjidData.mapUrl ||
            selectedMasjidData.map_url ||
            selectedMasjidData.map ||
            encodeURI(
                `https://www.google.com/maps/search/?api=1&query=${
                    selectedMasjidData.masjidName
                } ${selectedMasjidData.colony} ${
                    selectedMasjidData.locality || ""
                }`
            )
        );
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
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

            <div className="w-full max-w-md mt-8">
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
                        ></iframe>
                    </div>
                )}

                <div className="flex flex-col gap-2 mb-6 ml-4 mr-4">
                    <div className="w-full">
                        <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                            🕌 Search by Masjid
                        </h3>
                        <div className="relative">
                            <input
                                className="select select-primary select-lg w-full"
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
                            {masjidSuggestionsVisible &&
                                filteredMasjids.length > 0 && (
                                    <ul className="absolute left-0 right-0 mt-1 z-50 max-h-44 overflow-auto bg-base-100 border border-primary/20 rounded-md shadow-lg">
                                        {filteredMasjids.map((m, idx) => (
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
                                        ))}
                                    </ul>
                                )}
                        </div>
                    </div>

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

                    <div className="w-full">
                        <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                            🏘️ Search by Colony
                        </h3>
                        <div className="relative">
                            <input
                                className="select select-primary select-lg w-full"
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
                            {colonySuggestionsVisible &&
                                filteredColonies.length > 0 && (
                                    <ul className="absolute left-0 right-0 mt-1 z-50 max-h-44 overflow-auto bg-base-100 border border-primary/20 rounded-md shadow-lg">
                                        {filteredColonies.map((c, idx) => (
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
                                        ))}
                                    </ul>
                                )}
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold mb-2 text-center">
                    Jamat Time In
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

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body p-4">
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
                                    <MapPin className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-center mb-3 text-primary">
                                    Select a Masjid
                                </h3>
                                <p className="text-center text-white-1000 leading-relaxed max-w-sm text-xl">
                                    Please select a masjid to view jamat times
                                </p>
                                
                            </div>
                        )}
                    </div>
                </div>

                {selectedMasjidData && (
                    <div className="mt-4 mb-8 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                const url = getMapUrl();
                                if (url) {
                                    window.open(
                                        url,
                                        "_blank",
                                        "noopener,noreferrer"
                                    );
                                } else {
                                    alert("Map not available for this masjid.");
                                }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-md bg-primary/20 hover:bg-primary/30 text-primary transition font-semibold"
                        >
                            <MapPin className="w-5 h-5" />
                            <span>See This Masjid Location On Map</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
