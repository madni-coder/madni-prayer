"use client";
import { useState, useEffect } from "react";

export default function JamatTimesPage() {
    const [selectedColony, setSelectedColony] = useState("");
    const [selectedMasjid, setSelectedMasjid] = useState("");
    const [masjids, setMasjids] = useState([]);
    const [colonies, setColonies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMasjidData, setSelectedMasjidData] = useState(null);
    const [error, setError] = useState(null);

    // Fetch masjids from API
    useEffect(() => {
        const fetchMasjids = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch("/api/api-jamat");
                const result = await response.json();

                if (response.ok && result.data) {
                    setMasjids(result.data);
                    // Extract unique colonies
                    const uniqueColonies = [
                        ...new Set(result.data.map((m) => m.colony)),
                    ];
                    setColonies(uniqueColonies);
                } else {
                    setError("Failed to load masjids");
                }
            } catch (error) {
                console.error("Error fetching masjids:", error);
                setError("Failed to connect to server");
            } finally {
                setLoading(false);
            }
        };

        fetchMasjids();
    }, []);

    // Update jamat times when masjid is selected
    useEffect(() => {
        if (selectedMasjid) {
            const masjidData = masjids.find(
                (m) => m.masjidName === selectedMasjid
            );
            setSelectedMasjidData(masjidData);
        } else {
            setSelectedMasjidData(null);
        }
    }, [selectedMasjid, masjids]);

    // Convert 24-hour time to 12-hour format
    const convertTo12Hour = (time24) => {
        if (!time24 || time24 === "00:00") return "Not Set";
        const [hours, minutes] = time24.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    // Get jamat times based on selected masjid
    const getJamatTimes = () => {
        if (!selectedMasjidData) {
            return [
                {
                    name: "Fajr",
                    time: "Select a masjid",
                    color: "border-blue-500",
                },
                {
                    name: "Zuhr",
                    time: "Select a masjid",
                    color: "border-red-500",
                },
                {
                    name: "Asr",
                    time: "Select a masjid",
                    color: "border-yellow-500",
                },
                {
                    name: "Maghrib",
                    time: "Select a masjid",
                    color: "border-pink-500",
                },
                {
                    name: "Isha",
                    time: "Select a masjid",
                    color: "border-indigo-500",
                },
                {
                    name: "Juma",
                    time: "Select a masjid",
                    color: "border-green-500",
                },
            ];
        }

        return [
            {
                name: "Fajr",
                time: convertTo12Hour(selectedMasjidData.fazar),
                color: "border-blue-500",
            },
            {
                name: "Zuhr",
                time: convertTo12Hour(selectedMasjidData.zuhar),
                color: "border-red-500",
            },
            {
                name: "Asr",
                time: convertTo12Hour(selectedMasjidData.asar),
                color: "border-yellow-500",
            },
            {
                name: "Maghrib",
                time: convertTo12Hour(selectedMasjidData.maghrib),
                color: "border-pink-500",
            },
            {
                name: "Isha",
                time: convertTo12Hour(selectedMasjidData.isha),
                color: "border-indigo-500",
            },
            {
                name: "Juma",
                time: convertTo12Hour(selectedMasjidData.juma),
                color: "border-green-500",
            },
        ];
    };

    // Filter masjids by selected colony
    const getFilteredMasjids = () => {
        if (!selectedColony) return masjids;
        return masjids.filter((m) => m.colony === selectedColony);
    };

    // Handle colony change
    const handleColonyChange = (e) => {
        setSelectedColony(e.target.value);
        setSelectedMasjid(""); // Reset masjid selection when colony changes
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
            <div className="w-full max-w-md">
                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Dropdowns */}
                <div className="flex flex-col gap-4 mb-6">
                    <div>
                        <label className="label">
                            <span className="label-text font-semibold">
                                Masjid Name
                            </span>
                        </label>
                        <select
                            className="select select-primary w-full"
                            value={selectedMasjid}
                            onChange={(e) => setSelectedMasjid(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">
                                {loading
                                    ? "Loading..."
                                    : getFilteredMasjids().length === 0
                                    ? "No masjids found"
                                    : "Select Masjid"}
                            </option>
                            {getFilteredMasjids().map((masjid) => (
                                <option
                                    key={masjid.id}
                                    value={masjid.masjidName}
                                >
                                    {masjid.masjidName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">
                            <span className="label-text font-semibold">
                                Colony Address
                            </span>
                        </label>
                        <select
                            className="select select-primary w-full"
                            value={selectedColony}
                            onChange={handleColonyChange}
                            disabled={loading}
                        >
                            <option value="">
                                {loading
                                    ? "Loading..."
                                    : "Select Colony Address"}
                            </option>
                            {colonies.map((colony) => (
                                <option key={colony} value={colony}>
                                    {colony}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <h1 className="text-2xl font-bold mb-4 text-center">
                    Jamat Time In
                    {selectedMasjidData && (
                        <div className="text-lg font-semibold text-primary mt-2">
                            {selectedMasjidData.masjidName} -{" "}
                            {selectedMasjidData.colony}
                        </div>
                    )}
                </h1>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body p-4">
                        {getJamatTimes().map((prayer) => (
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
