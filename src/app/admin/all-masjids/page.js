"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, X, Pencil } from "lucide-react";
import fetchFromApi from '../../../utils/fetchFromApi';

export default function Page() {
    // Dynamic data state
    const [masjids, setMasjids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [localityFilter, setLocalityFilter] = useState("All");
    const [addressFilter, setAddressFilter] = useState("All"); // colony
    const [searchQuery, setSearchQuery] = useState("");
    const [reloading, setReloading] = useState(false);

    const fetchMasjids = useCallback(async () => {
        try {
            setError(null);
            setReloading(true);
            const res = await fetchFromApi("/api/all-masjids");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load data");
            setMasjids(data.data || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
            setReloading(false);
        }
    }, []);

    useEffect(() => {
        fetchMasjids();
    }, [fetchMasjids]);

    const handleReset = () => {
        setLocalityFilter("All");
        setAddressFilter("All");
        setSearchQuery("");
    };

    const clearSearch = () => setSearchQuery("");
    const clearAddressFilter = () => setAddressFilter("All");
    const clearLocalityFilter = () => setLocalityFilter("All");

    // Build dynamic options
    const colonyOptions = [
        "All",
        ...Array.from(
            new Set(
                masjids
                    .map((m) => m.colony)
                    .filter((v) => v && v.trim().length > 0)
            )
        ),
    ];
    const localityOptions = [
        "All",
        ...Array.from(
            new Set(
                masjids
                    .map((m) => m.locality)
                    .filter((v) => v && v.trim().length > 0)
            )
        ),
    ];

    const filteredMasjids = masjids.filter((m) => {
        const matchesLocality =
            localityFilter === "All" || m.locality === localityFilter;
        const matchesColony =
            addressFilter === "All" || m.colony === addressFilter;
        const matchesSearch = (m.masjidName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesLocality && matchesColony && matchesSearch;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Masjid</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchMasjids}
                        disabled={reloading}
                        className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-100 disabled:opacity-60"
                        title="Refresh list"
                    >
                        <RefreshCw
                            size={16}
                            className={reloading ? "animate-spin" : ""}
                        />
                        {reloading ? "Refreshing" : "Refresh"}
                    </button>
                    <Link href="/admin/all-masjids/add">
                        <button className="bg-green-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Add Masjid Entry
                        </button>
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded">
                    {error}
                </div>
            )}
            {loading && (
                <div className="mb-4 p-3 bg-gray-100 border border-gray-300 text-gray-600 text-sm rounded">
                    Loading masjids...
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Masjid Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search masjid name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Clear search"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Colony Address
                        </label>
                        <div className="relative">
                            <select
                                value={addressFilter}
                                onChange={(e) =>
                                    setAddressFilter(e.target.value)
                                }
                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black appearance-none"
                            >
                                {colonyOptions.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            {addressFilter !== "All" && (
                                <button
                                    onClick={clearAddressFilter}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Clear address filter"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Locality
                        </label>
                        <div className="relative">
                            <select
                                value={localityFilter}
                                onChange={(e) =>
                                    setLocalityFilter(e.target.value)
                                }
                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black appearance-none"
                            >
                                {localityOptions.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                            {localityFilter !== "All" && (
                                <button
                                    onClick={clearLocalityFilter}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Clear locality filter"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleReset}
                            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            title="Reset all filters"
                        >
                            <RefreshCw size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="bg-yellow-600 text-white">
                    <div className="grid grid-cols-10 gap-4 px-6 py-4 font-medium">
                        <div className="col-span-2">Masjid</div>
                        <div className="col-span-2">Colony Address</div>
                        <div className="col-span-2">Locality</div>
                        <div>Role</div>
                        <div>Name</div>
                        <div>Mobile Number</div>
                        <div>Actions</div>
                    </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                    {!loading && filteredMasjids.length === 0 && (
                        <div className="px-6 py-6 text-sm text-gray-500">
                            No masjids found.
                        </div>
                    )}
                    {filteredMasjids.map((m) => (
                        <div
                            key={m.id}
                            className="grid grid-cols-10 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="col-span-2 flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-lg">🕌</span>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {m.masjidName}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-sm text-gray-900">
                                    {m.colony || "-"}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-sm text-gray-900">
                                    {m.locality || "-"}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-900">
                                    {m.role || "-"}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-900">
                                    {m.name || "-"}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-900">
                                    {m.mobile || "-"}
                                </div>
                            </div>
                            <div>
                                <Link
                                    href={`/admin/all-masjids/edit-jamatTime?id=${m.id}`}
                                >
                                    <button
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                        title="Edit Masjid"
                                    >
                                        <Pencil size={22} />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}