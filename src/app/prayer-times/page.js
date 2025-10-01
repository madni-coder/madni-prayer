"use client";
import React, { useEffect, useState, useRef } from "react";
import { Bell, BellOff, MapPin, Calendar, Moon } from "lucide-react";
import { FaAngleLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import cities from "./cities.json";

const initialPrayerTimes = [
    {
        name: "Fajr",
        time: "—",
        alert: true,
        color: "text-primary text-base md:text-md",
    },
    {
        name: "Sun Rise",
        time: "—",
        alert: false,
        color: "text-secondary text-base md:text-md",
    },
    {
        name: "Zuhr",
        time: "—",
        alert: true,
        color: "text-accent text-base md:text-md",
    },
    {
        name: "Asr (Hanafi)",
        time: "—",
        alert: true,
        color: "text-warning text-base md:text-md",
    },
    {
        name: "Maghrib",
        time: "—",
        alert: true,
        color: "text-success text-base md:text-md",
    },
    {
        name: "Isha (Hanafi)",
        time: "—",
        alert: true,
        color: "text-info text-base md:text-md",
    },
];

export default function PrayerTimesPage() {
    const router = useRouter();
    // Real-time clock state
    const [now, setNow] = useState(new Date());
    const [prayerTimes, setPrayerTimes] = React.useState(initialPrayerTimes);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState("");
    const [search, setSearch] = useState("");
    const modalRef = useRef();

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchPrayerTimesAndSetState = async () => {
            try {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, "0");
                const d = String(today.getDate()).padStart(2, "0");
                const dateStr = `${y}-${m}-${d}`;

                const res = await fetch(`/api/api-prayerTimes?date=${dateStr}`);
                const json = await res.json();

                if (!res.ok) {
                    console.error("Failed to fetch prayer times:", json);
                    return;
                }

                const timings = json.timings || {};

                // helper to find the best matching timing key for each displayed prayer
                const findTimingKey = (displayName) => {
                    const tokensMap = {
                        Fajr: ["fajr"],
                        "Sun Rise": ["sunrise", "sun rise", "sun"],
                        Zuhr: ["dhuhr", "zuhr", "zuhur"],
                        "Asr (Hanafi)": ["asr"],
                        Maghrib: ["maghrib"],
                        "Isha (Hanafi)": ["isha", "isya"],
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
                            time: apiVal || p.time,
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
        <div className="w-full h-screen flex flex-col items-center justify-center bg-base-200">
            <button
                className="flex items-center gap-2 mb-4 text-lg text-primary hover:text-green-600 font-semibold"
                onClick={() => router.push("/")}
                aria-label="Back to Home"
                style={{ alignSelf: "flex-start" }}
            >
                <FaAngleLeft /> Back
            </button>
            <section className="flex flex-col items-center justify-center w-full h-full min-h-[70vh] px-1 py-2 sm:px-2 sm:py-4 animate-fade-in bg-base-100">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2 sm:mb-3">
                    Prayer Times
                </h2>
                {/* Top Bar */}
                <div className="w-full max-w-2xl flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-0 mb-2">
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white">
                        <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>12, Rabi-ul-Awwal, 1447</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Fri 05 September 2025</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white">
                        <span>GMT: 5.5, Height: 964ft</span>
                    </div>
                    <div
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white cursor-pointer"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Bilaspur, Chhattisgarh 495001</span>
                    </div>
                </div>
                {/* Main Card */}
                <div className="relative glass-card p-2 sm:p-4 md:p-6 max-w-full sm:max-w-2xl w-full flex flex-col sm:flex-row gap-3 sm:gap-4 items-center bg-base-200 border border-base-300 shadow-md">
                    {/* Circular Countdown */}
                    <div className="flex flex-col items-center justify-center w-full sm:w-auto mb-2 sm:mb-0">
                        <div className="relative flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32">
                            <svg
                                className="absolute top-0 left-0"
                                width="80"
                                height="80"
                                viewBox="0 0 128 128"
                            >
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    stroke="#fbbf24"
                                    strokeWidth="5"
                                    fill="none"
                                    strokeDasharray={2 * Math.PI * 60}
                                    strokeDashoffset={2 * Math.PI * 60 * 0.7}
                                    className="transition-all"
                                    style={{ opacity: 0.5 }}
                                />
                            </svg>
                            <div className="flex flex-col items-center justify-center z-10">
                                <span className="text-warning font-semibold text-sm sm:text-base md:text-lg">
                                    {prayerTimes[3].name}
                                </span>
                                <span className="text-lg sm:text-xl md:text-2xl font-bold text-base-content">
                                    {formatTime(now)}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Prayer Times List */}
                    <div className="flex-1 w-full">
                        {prayerTimes.map((prayer) => (
                            <div
                                key={prayer.name}
                                className={`flex items-center justify-between px-3 py-3 rounded-lg mb-3 bg-base-100 border-l-4 ${
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
                                    className={`font-semibold text-base md:text-lg flex-1 truncate ${prayer.color}`}
                                >
                                    {prayer.name}
                                </span>
                                <span className="font-mono text-white md:text-lg text-base-content/90 ml-2 flex-shrink-0">
                                    {loading ? (
                                        <svg
                                            className="animate-spin h-5 w-5 text-primary"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8z"
                                            ></path>
                                        </svg>
                                    ) : (
                                        prayer.time
                                    )}
                                </span>
                                <span className="ml-2 flex-shrink-0">
                                    {prayer.alert ? (
                                        <Bell
                                            className="w-5 h-5 text-warning"
                                            title="Azan alert on"
                                        />
                                    ) : (
                                        <BellOff
                                            className="w-5 h-5 text-base-content/30"
                                            title="Azan alert off"
                                        />
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div
                        ref={modalRef}
                        className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-full max-w-md"
                    >
                        <h3 className="text-lg font-bold mb-4">
                            Select Location
                        </h3>
                        <button
                            className="mb-4 w-full px-4 py-3 bg-primary text-white rounded hover:bg-primary/80 text-base font-semibold"
                            onClick={() => {
                                if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            alert(
                                                `Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`
                                            );
                                        }
                                    );
                                }
                            }}
                        >
                            Get location
                        </button>
                        <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-gray-700"></div>
                            <span className="mx-3 text-gray-400 font-semibold">
                                OR
                            </span>
                            <div className="flex-grow border-t border-gray-700"></div>
                        </div>
                        <div className="mb-4">
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Search city..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-700 text-white rounded"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-primary text-white rounded"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
