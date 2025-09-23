"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RefreshCw, X } from "lucide-react";

export default function Page() {
    const searchParams = useSearchParams();
    const [masjids, setMasjids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [localityFilter, setLocalityFilter] = useState("All");
    const [addressFilter, setAddressFilter] = useState("All");
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Fetch masjids from API
    const fetchMasjids = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/api-jamat");
            const result = await response.json();

            if (response.ok) {
                // Transform API data to match expected structure
                const transformedData = result.data.map((item) => ({
                    id: item.id,
                    name: item.masjidName,
                    address: item.colony,
                    locality: item.locality,
                }));
                setMasjids(transformedData);
            } else {
                console.error("Failed to fetch masjids:", result.error);
            }
        } catch (error) {
            console.error("Error fetching masjids:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasjids();
    }, []);

    // Listen for refresh parameter changes
    useEffect(() => {
        const refreshParam = searchParams.get("refresh");
        if (refreshParam) {
            fetchMasjids();
        }
    }, [searchParams]);

    const handleReset = () => {
        setLocalityFilter("All");
        setAddressFilter("All");
        setSearchQuery("");
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const clearAddressFilter = () => {
        setAddressFilter("All");
    };

    const clearLocalityFilter = () => {
        setLocalityFilter("All");
    };

    const handleClearAll = () => {
        setShowClearConfirm(true);
    };

    const confirmClearAll = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/api-jamat?action=clear", {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                setMasjids([]);
                setShowClearConfirm(false);
                // Reset filters
                handleReset();
            } else {
                console.error("Failed to clear masjids:", result.error);
                alert("Failed to clear masjids. Please try again.");
            }
        } catch (error) {
            console.error("Error clearing masjids:", error);
            alert("Error clearing masjids. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const cancelClearAll = () => {
        setShowClearConfirm(false);
    };

    const filteredMasjids = masjids.filter((masjid) => {
        const matchesLocality =
            localityFilter === "All" || masjid.locality === localityFilter;
        const matchesAddress =
            addressFilter === "All" || masjid.address === addressFilter;
        const matchesSearch = masjid.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        return matchesLocality && matchesAddress && matchesSearch;
    });

    // Get unique values for filter options
    const uniqueLocalities = [...new Set(masjids.map((m) => m.locality))];
    const uniqueAddresses = [...new Set(masjids.map((m) => m.address))];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Masjid</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleClearAll}
                        disabled={loading || masjids.length === 0}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Clear All Masjids
                    </button>
                    <Link href="/admin/all-masjids/add">
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Add Masjid Entry
                        </button>
                    </Link>
                </div>
            </div>

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
                                <option value="All">All</option>
                                {uniqueAddresses.map((address) => (
                                    <option key={address} value={address}>
                                        {address}
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
                                <option value="All">All</option>
                                {uniqueLocalities.map((locality) => (
                                    <option key={locality} value={locality}>
                                        {locality}
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
                    <div className="grid grid-cols-6 gap-4 px-6 py-4 font-medium">
                        <div className="col-span-2">Masjid</div>
                        <div className="col-span-2">Colony Address</div>
                        <div className="col-span-2">Locality</div>
                    </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                    {loading ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                            <RefreshCw
                                className="animate-spin mx-auto mb-2"
                                size={24}
                            />
                            Loading masjids...
                        </div>
                    ) : filteredMasjids.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                            No masjids found.{" "}
                            {masjids.length === 0
                                ? "Add your first masjid!"
                                : "Try adjusting your filters."}
                        </div>
                    ) : (
                        filteredMasjids.map((masjid) => (
                            <div
                                key={masjid.id}
                                className="grid grid-cols-6 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                            >
                                {/* Masjid Info */}
                                <div className="col-span-2 flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-lg">🕌</span>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {masjid.name}
                                        </div>
                                    </div>
                                </div>

                                {/* Colony Address */}
                                <div className="col-span-2">
                                    <div className="text-sm text-gray-900">
                                        {masjid.address}
                                    </div>
                                </div>

                                {/* Locality */}
                                <div className="col-span-2">
                                    <div className="text-sm text-gray-900">
                                        {masjid.locality}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Clear All Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Clear All Masjids
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to clear all {masjids.length}{" "}
                            masjids? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelClearAll}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClearAll}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
