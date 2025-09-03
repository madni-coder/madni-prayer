"use client";
import React, { useState, useEffect } from "react";
import masjidList from "./list.json";
import Link from "next/link";

// Extract addresses and names from the JSON list
const locations = masjidList.map((m) => m.Address);
const masjids = masjidList.map((m) => m.Name || m.name); // Fix: support both Name and name

// These times are editable in the UI table below
const jamatTimesInitial = [
    { name: "Fajr", time: "04:29 AM", color: "border-blue-500" },
    { name: "Zuhr", time: "12:04 PM", color: "border-red-500" },
    { name: "Asar", time: "04:35 PM", color: "border-yellow-500" },
    { name: "Maghrib", time: "06:26 PM", color: "border-pink-500" },
    { name: "Isha", time: "07:40 PM", color: "border-indigo-500" },
];

function DigitalClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);
    const pad = (n) => n.toString().padStart(2, "0");
    let hours = time.getHours();
    const minutes = pad(time.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    hours = pad(hours);

    return (
        <div className="flex flex-col items-center mb-2">
            <span className="text-lg font-semibold text-gray-700">
                Current Time
            </span>
            <div className="flex items-end gap-2 mt-1">
                <span
                    className="text-3xl font-mono font-bold text-primary bg-gray-900 px-4 py-2 rounded-lg shadow border-2 border-primary"
                    style={{
                        fontFamily: "'Orbitron', 'Fira Mono', monospace",
                        letterSpacing: "0.08em",
                    }}
                >
                    {hours}:{minutes}
                </span>
                <span className="text-lg font-bold text-primary ml-1 mb-1 select-none">
                    {ampm}
                </span>
            </div>
        </div>
    );
}

export default function AdminJamatTimesPage() {
    const [selectedLocation, setSelectedLocation] = useState("");
    const [selectedMasjid, setSelectedMasjid] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [jamatTimes, setJamatTimes] = useState(() =>
        jamatTimesInitial.map((jt) => ({ ...jt }))
    );
    const [editIndex, setEditIndex] = useState(null);
    const [editTime, setEditTime] = useState("");

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Sidebar for desktop, Drawer for mobile */}
            {/* Mobile drawer button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 bg-primary text-black rounded-full p-2 shadow"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
            >
                <svg
                    width="28"
                    height="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            {/* Overlay for mobile drawer */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* Sidebar */}
            <aside
                className={`
                    fixed z-50 top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col py-8 px-4
                    transition-transform duration-200
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    md:static md:translate-x-0 md:flex md:w-64 md:min-h-screen
                `}
                style={{ minHeight: "100vh" }}
            >
                {/* Close button for mobile */}
                <div className="flex items-center justify-between mb-8 md:mb-8">
                    <span className="font-bold text-lg text-primary block text-black">
                        Admin Panel
                    </span>
                    <button
                        className="md:hidden text-gray-500 hover:text-primary"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <svg
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="flex flex-col gap-2">
                    <Link
                        href="/admin/jamat-time"
                        className="px-4 py-2 rounded hover:bg-primary hover:text-white transition-colors font-medium text-black"
                        onClick={() => setSidebarOpen(false)}
                    >
                        Jamat Times
                    </Link>
                    <Link
                        href="/admin/rewards"
                        className="px-4 py-2 rounded hover:bg-primary hover:text-white transition-colors font-medium text-black"
                        onClick={() => setSidebarOpen(false)}
                    >
                        Rewards
                    </Link>
                    <Link
                        href="/admin/notice"
                        className="px-4 py-2 rounded hover:bg-primary hover:text-white transition-colors font-medium text-black"
                        onClick={() => setSidebarOpen(false)}
                    >
                        Notice
                    </Link>
                    <button
                        className="px-4 py-2 rounded hover:bg-error hover:text-white transition-colors font-medium text-left text-black"
                        // Add your logout logic here
                    >
                        Logout
                    </button>
                </nav>
            </aside>
            {/* Main content */}
            <main
                className="flex-1 flex flex-col"
                style={{
                    maxWidth: "100vw",
                    marginLeft: 0,
                    width: "calc(100vw - 16rem)", // 16rem = 256px = sidebar width
                }}
            >
                <section className="flex-1 p-4 sm:p-6 md:p-8 flex justify-start">
                    <div className="max-w-2xl w-full">
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <select
                                className="select select-bordered select-lg w-full sm:w-1/2 text-black bg-white"
                                value={selectedLocation}
                                onChange={(e) =>
                                    setSelectedLocation(e.target.value)
                                }
                            >
                                <option value="">Select Location</option>
                                {locations.map((address) => (
                                    <option key={address} value={address}>
                                        {address}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="select select-bordered select-lg w-full sm:w-1/2 text-black bg-white"
                                value={selectedMasjid}
                                onChange={(e) =>
                                    setSelectedMasjid(e.target.value)
                                }
                            >
                                <option value="">Select Masjid</option>
                                {masjids.map((masjid) => (
                                    <option key={masjid} value={masjid}>
                                        {masjid}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6 overflow-x-auto">
                            <h2 className="text-xl font-semibold mb-4 text-black">
                                Jamat Times
                            </h2>
                            <div className="w-full overflow-x-auto">
                                <table className="min-w-full table-auto text-sm text-black">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-2 sm:px-4 py-2 text-left text-black">
                                                Prayer
                                            </th>
                                            <th className="px-2 sm:px-4 py-2 text-left text-black">
                                                Time
                                            </th>
                                            <th className="px-2 sm:px-4 py-2 text-left text-black">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jamatTimes.map((prayer, idx) => (
                                            <tr
                                                key={idx}
                                                className="border-b last:border-b-0"
                                            >
                                                <td className="px-2 sm:px-4 py-2 font-medium text-black">
                                                    {prayer.name}
                                                </td>
                                                <td className="px-2 sm:px-4 py-2 font-mono text-black">
                                                    {editIndex === idx ? (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-xs w-16 bg-yellow-100 border border-yellow-400 text-black"
                                                                value={
                                                                    // Only HH:MM part for editing
                                                                    editTime.split(
                                                                        " "
                                                                    )[0] || ""
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    // Keep only HH:MM, preserve AM/PM
                                                                    const ampm =
                                                                        (
                                                                            editTime.split(
                                                                                " "
                                                                            )[1] ||
                                                                            "AM"
                                                                        ).toUpperCase();
                                                                    setEditTime(
                                                                        e.target.value
                                                                            .replace(
                                                                                /[^0-9:]/g,
                                                                                ""
                                                                            )
                                                                            .slice(
                                                                                0,
                                                                                5
                                                                            ) +
                                                                            " " +
                                                                            ampm
                                                                    );
                                                                }}
                                                                autoFocus
                                                                placeholder="HH:MM"
                                                                maxLength={5}
                                                            />
                                                            <span className="ml-1 px-2 py-1 rounded bg-gray-200 text-xs font-bold select-none">
                                                                {(
                                                                    editTime.split(
                                                                        " "
                                                                    )[1] || "AM"
                                                                ).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    ) : // Only show HH:MM AM/PM (remove seconds if present)
                                                    prayer.time.length > 5 ? (
                                                        prayer.time.slice(
                                                            0,
                                                            5
                                                        ) +
                                                        " " +
                                                        prayer.time.slice(-2)
                                                    ) : (
                                                        prayer.time
                                                    )}
                                                </td>
                                                <td className="px-2 sm:px-4 py-2 flex flex-col sm:flex-row gap-2">
                                                    {editIndex === idx ? (
                                                        <>
                                                            <button
                                                                className="btn btn-xs btn-success mr-0 sm:mr-2 text-black"
                                                                onClick={() => {
                                                                    const updated =
                                                                        [
                                                                            ...jamatTimes,
                                                                        ];
                                                                    updated[
                                                                        idx
                                                                    ] = {
                                                                        ...updated[
                                                                            idx
                                                                        ],
                                                                        time: editTime,
                                                                    };
                                                                    setJamatTimes(
                                                                        updated
                                                                    );
                                                                    setEditIndex(
                                                                        null
                                                                    );
                                                                    setEditTime(
                                                                        ""
                                                                    );
                                                                }}
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                className="btn btn-xs btn-error text-black"
                                                                onClick={() => {
                                                                    setEditIndex(
                                                                        null
                                                                    );
                                                                    setEditTime(
                                                                        ""
                                                                    );
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            className="btn btn-xs btn-primary mr-0 sm:mr-2 text-black"
                                                            onClick={() => {
                                                                console.log(
                                                                    "Edit clicked for",
                                                                    prayer.name,
                                                                    idx
                                                                ); // Debug
                                                                setEditIndex(
                                                                    idx
                                                                );
                                                                setEditTime(
                                                                    prayer.time
                                                                );
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button className="btn btn-success w-full sm:w-auto text-black">
                                    Add New Jamat Time
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
