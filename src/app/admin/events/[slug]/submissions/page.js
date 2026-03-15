"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Users, CalendarRange, Clock, Download, Search, Inbox
} from "lucide-react";

// ─── Value Display ─────────────────────────────────────────────────────────────
function formatValue(val) {
    if (val === null || val === undefined || val === "") return <span className="text-gray-400 italic text-xs">—</span>;
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-gray-400 italic text-xs">—</span>;
        return (
            <div className="flex flex-wrap gap-1">
                {val.map((v, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                        {String(v)}
                    </span>
                ))}
            </div>
        );
    }
    if (typeof val === "object") {
        // e.g. address: { locality, city } or masjid object
        const parts = Object.entries(val)
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .map(([k, v]) => `${v}`);
        if (parts.length === 0) return <span className="text-gray-400 italic text-xs">—</span>;
        return parts.join(", ");
    }
    return String(val);
}

function formatDate(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("en-PK", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    } catch {
        return iso;
    }
}

// ─── Export CSV ────────────────────────────────────────────────────────────────
function exportCsv(columns, rows) {
    const escape = (v) => {
        const s = v === null || v === undefined ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
    };
    const header = ["#", "Submitted At", ...columns].map(escape).join(",");
    const body = rows.map((row, i) => {
        const cells = [i + 1, formatDate(row.submittedAt), ...columns.map(col => {
            const val = row.submittedData?.[col] ?? "";
            if (Array.isArray(val)) return val.join("; ");
            if (typeof val === "object" && val !== null) {
                return Object.values(val).filter(Boolean).join(", ");
            }
            return val;
        })];
        return cells.map(escape).join(",");
    });
    const csv = [header, ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SubmissionsPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [eventTitle, setEventTitle] = useState(slug);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!slug) return;
        const controller = new AbortController();

        import("axios").then(({ default: axios }) => {
            const opts = { signal: controller.signal };
            Promise.all([
                axios.get(`/api/admin/events/${slug}`, opts),
                axios.get(`/api/admin/events/${slug}/submissions`, opts),
            ])
                .then(([evRes, subRes]) => {
                    if (evRes.data?.event?.title) setEventTitle(evRes.data.event.title);
                    setSubmissions(subRes.data?.submissions || []);
                    setLoading(false);
                })
                .catch((err) => {
                    if (err?.code === "ERR_CANCELED" || err?.name === "AbortError") return;
                    setError(err?.response?.data?.error || err.message || "Failed to load");
                    setLoading(false);
                });
        });

        return () => { controller.abort(); };
    }, [slug]);

    // Collect all unique column keys from all submissions' submittedData
    const columns = (() => {
        const seen = new Set();
        const order = [];
        for (const sub of submissions) {
            const data = sub.submitted_data || sub.submittedData || {};
            for (const key of Object.keys(data)) {
                if (!seen.has(key)) { seen.add(key); order.push(key); }
            }
        }
        return order;
    })();

    // Normalise each submission's data field
    const normalised = submissions.map(sub => ({
        id: sub.id,
        submittedAt: sub.submitted_at || sub.submittedAt,
        submittedData: sub.submitted_data || sub.submittedData || {},
    }));

    const filtered = search.trim()
        ? normalised.filter(row =>
            JSON.stringify(row.submittedData).toLowerCase().includes(search.toLowerCase())
        )
        : normalised;

    // Pagination
    const PAGE_SIZE = 15;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    // Keep current page valid when filter/search changes
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages]);

    useEffect(() => {
        // reset to first page when search changes
        setCurrentPage(1);
    }, [search]);

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = Math.min(filtered.length, startIdx + PAGE_SIZE);
    const paged = filtered.slice(startIdx, endIdx);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/events"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-violet-600" />
                            Submissions
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                            <CalendarRange className="w-3.5 h-3.5" />
                            {eventTitle}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Total badge */}
                    {!loading && (
                        <span className="px-3 py-1.5 bg-violet-100 text-violet-700 text-sm font-semibold rounded-lg">
                            {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
                        </span>
                    )}

                    {/* Export CSV */}
                    {submissions.length > 0 && (
                        <button
                            onClick={() => exportCsv(columns, normalised)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            {submissions.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search in submissions..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="bg-white border border-gray-200 rounded-2xl py-20 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading submissions...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl py-10 text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            ) : submissions.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center gap-3">
                    <Inbox className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">No submissions yet</p>
                    <p className="text-sm text-gray-400">Submissions will appear here once users fill the form.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center">
                    <p className="text-gray-500">No submissions match your search.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            Submitted At
                                        </span>
                                    </th>
                                    {columns.map(col => (
                                        <th
                                            key={col}
                                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paged.map((row, idx) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => router.push(`/admin/events/${slug}/submissions/${row.id}`)}
                                        role="button"
                                        className="hover:bg-violet-50/40 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{startIdx + idx + 1}</td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                                            {formatDate(row.submittedAt)}
                                        </td>
                                        {columns.map(col => (
                                            <td key={col} className="px-4 py-3 text-gray-800 max-w-xs">
                                                {formatValue(row.submittedData[col])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
                        <div>
                            Showing <span className="font-medium">{startIdx + 1}</span> to <span className="font-medium">{endIdx}</span> of <span className="font-medium">{filtered.length}</span> submissions
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded-lg bg-white border text-sm text-gray-700 disabled:opacity-50">
                                Prev
                            </button>
                            <div className="px-3 py-1 text-sm text-gray-700">Page {currentPage} of {totalPages}</div>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded-lg bg-white border text-sm text-gray-700 disabled:opacity-50">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
