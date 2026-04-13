"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import apiClient from "../../../lib/apiClient";

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(15);

    useEffect(() => {
        // fetch registered users from the API using axios
        (async () => {
            try {
                const { data } = await apiClient.get("/api/auth/register");
                if (data?.error) {
                    setError(data.error);
                } else if (Array.isArray(data)) {
                    // endpoint may return an array of users directly
                    setUsers(data);
                } else {
                    setUsers(data?.users || []);
                }
            } catch (err) {
                setError(err?.response?.data?.error || err.message || "Failed to fetch");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // reset page when users change or when search query changes
    const [query, setQuery] = useState("");

    useEffect(() => {
        setCurrentPage(1);
    }, [users, query]);

    // ensure currentPage is within bounds when users or pageSize change
    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
        setCurrentPage((p) => Math.min(p, totalPages));
    }, [users, pageSize]);

    // filtered users based on search query (name or email)
    const filteredUsers = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => {
            const name = (u.fullName || u.name || "").toLowerCase();
            const email = (u.email || "").toLowerCase();
            return name.includes(q) || email.includes(q);
        });
    }, [users, query]);

    // pagination calculations in component scope (use filteredUsers)
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const start = (currentPage - 1) * pageSize;
    const pageItems = filteredUsers.slice(start, start + pageSize);
    const startItem = filteredUsers.length === 0 ? 0 : start + 1;
    const endItem = Math.min(start + pageSize, filteredUsers.length);

    // no theme/dark-mode handling here — page uses a light design with black text

    return (
        <div className="w-full mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-black">Registered Users</h1>
                <div className="flex items-center gap-3">
                    <div className="bg-info/10 border border-info rounded shadow-sm px-3 py-2 flex items-center gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or email"
                            className="bg-transparent outline-none text-sm w-64 text-black font-bold"
                            aria-label="Search users by name or email"
                        />
                        {query ? (
                            <button
                                onClick={() => setQuery("")}
                                className="text-sm text-black px-2 py-1 rounded "
                                aria-label="Clear search"
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="p-4 border-b border-transparent">
                    <p className="text-sm text-gray-700">A table of all registered users.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto w-full">
                        <colgroup>
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '26%' }} />
                            <col style={{ width: '36%' }} />
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '4%' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-info text-white rounded-t-lg">
                                <th className="px-3 py-3 text-left text-sm font-bold uppercase">S.No</th>
                                <th className="px-4 py-3 text-left text-sm font-bold uppercase">Gender</th>
                                <th className="px-6 py-3 text-left text-sm font-bold uppercase">Full Name</th>
                                <th className="px-6 py-3 text-left text-sm font-bold uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-bold uppercase">Address</th>
                                <th className="px-6 py-3 text-left text-sm font-bold uppercase">Area Masjid</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-700">Loading...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-600">{error}</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-700">No users found.</td>
                                </tr>
                            ) : (
                                pageItems.map((u, idx) => (
                                    <tr
                                        key={u.id || start + idx}
                                        className={`${idx % 2 === 0 ? "" : "bg-gray-50"} cursor-pointer`}
                                        onClick={() => {
                                            if (u && (u.id || u._id)) {
                                                router.push(`/admin/users/${u.id || u._id}`);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                if (u && (u.id || u._id)) router.push(`/admin/users/${u.id || u._id}`);
                                            }
                                        }}
                                    >
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-black">{start + idx + 1}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-black">{u.gender || 'Not Provided'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">{u.fullName || u.name || 'Not Provided'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{u.email || 'Not Provided'}</td>
                                        <td className="px-6 py-4 text-sm text-black whitespace-normal break-words">{u.address || 'Not Provided'}</td>
                                        <td className="px-6 py-4 text-sm text-black whitespace-normal break-words">{u.areaMasjid || 'Not Provided'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination - always visible (outside horizontal scroller) */}
                <div className="px-4 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">Showing {startItem} to {endItem} of {filteredUsers.length} entries</div>
                    <div className="flex items-center gap-2">

                        <button
                            className="px-3 py-1 bg-black border rounded disabled:opacity-50"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || filteredUsers.length === 0}
                        >
                            Prev
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-info text-white' : 'bg-black'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            className="px-3 py-1 bg-black border rounded disabled:opacity-50"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages || filteredUsers.length === 0}
                        >
                            Next
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}

