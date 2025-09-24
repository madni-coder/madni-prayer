"use client";
import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

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
    const [masjids, setMasjids] = useState([]);
    const [selectedMasjid, setSelectedMasjid] = useState("");
    const [selectedMasjidData, setSelectedMasjidData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMasjids();
    }, []);

    const fetchMasjids = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/all-masjids");
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

        if (masjidName) {
            const masjidData = masjids.find((m) => m.masjidName === masjidName);
            setSelectedMasjidData(masjidData);
        } else {
            setSelectedMasjidData(null);
        }
    };

    const colonies = [...new Set(masjids.map((m) => m.colony))];

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
            <div className="sticky top-0 left-0 w-full z-10 flex justify-center bg-base-200/80 backdrop-blur-sm py-2">
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                    <DigitalClock />
                </div>
            </div>

            <div className="w-full max-w-md mt-8">
                <div className="flex justify-start mb-8 ml-8">
                    <button className="btn btn-outline btn-primary btn-xxl transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-primary-content">
                        AUTO LOCATE
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 ml-4 mr-4">
                    <div className="flex-1">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Masjid Name
                            </span>
                        </label>
                        <select
                            className="select select-primary select-lg w-full"
                            value={selectedMasjid}
                            onChange={handleMasjidChange}
                        >
                            <option value="">Select Masjid</option>
                            {masjids.map((masjid) => (
                                <option
                                    key={masjid.id}
                                    value={masjid.masjidName}
                                >
                                    {masjid.masjidName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Colony Address
                            </span>
                        </label>
                        <select
                            className="select select-primary select-lg w-full"
                            value={selectedMasjidData?.colony || ""}
                            onChange={(e) => {
                                const colony = e.target.value;
                                const masjidsInColony = masjids.filter(
                                    (m) => m.colony === colony
                                );
                                if (masjidsInColony.length > 0) {
                                    setSelectedMasjid(
                                        masjidsInColony[0].masjidName
                                    );
                                    setSelectedMasjidData(masjidsInColony[0]);
                                }
                            }}
                        >
                            <option value="">Select Colony Address</option>
                            {colonies.map((colony) => (
                                <option key={colony} value={colony}>
                                    {colony}
                                </option>
                            ))}
                        </select>
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
                                <div className="mt-4 flex items-center gap-2 text-xl text-white-500">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                    <span>Choose from the dropdown above</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
