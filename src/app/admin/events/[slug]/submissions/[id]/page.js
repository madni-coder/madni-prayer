"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";

// --- Helpers to render submission values in a user-friendly way ---
function prettifyKey(key) {
    if (!key) return "";
    const s = String(key);
    const spaced = s.replace(/[_-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
    return spaced.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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

function formatValue(val) {
    if (val === null || val === undefined || val === "") return <span className="text-gray-400 italic text-xs">—</span>;
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-gray-400 italic text-xs">—</span>;
        return (
            <div className="flex flex-wrap gap-1">
                {val.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                        {String(v)}
                    </span>
                ))}
            </div>
        );
    }
    if (typeof val === "object") {
        const parts = Object.entries(val).filter(([, v]) => v !== null && v !== undefined && v !== "");
        if (parts.length === 0) return <span className="text-gray-400 italic text-xs">—</span>;
        return (
            <div className="space-y-1">
                {parts.map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 min-w-[110px]">{prettifyKey(k)}</div>
                        <div className="text-sm text-gray-800">{formatValue(v)}</div>
                    </div>
                ))}
            </div>
        );
    }
    return String(val);
}

export default function SubmissionDetailPage() {
    const { slug, id } = useParams();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug || !id) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                const axios = (await import("axios")).default;

                // Try fetching single submission endpoint first, fallback to list+find
                try {
                    const res = await axios.get(`/api/admin/events/${slug}/submissions/${id}`);
                    if (!cancelled) setSubmission(res.data?.submission || res.data);
                } catch (err) {
                    // fallback: fetch list and find by id
                    const list = await axios.get(`/api/admin/events/${slug}/submissions`);
                    const found = (list.data?.submissions || []).find(s => String(s.id) === String(id));
                    if (!cancelled) setSubmission(found || null);
                }
            } catch (err) {
                if (!cancelled) setError(err?.response?.data?.error || err.message || "Failed to load submission");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [slug, id]);

    const payload = submission ? (submission.submitted_data || submission.submittedData || {}) : {};

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href={`/admin/events/${slug}/submissions`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Submission</h1>
                    <p className="text-sm text-gray-500 mt-0.5">ID: {id}</p>
                </div>
                <div className="flex-1" />
            </div>

            {loading ? (
                <div className="bg-white border border-gray-200 rounded-2xl py-20 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading submission...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl py-10 text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            ) : !submission ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center gap-3">
                    <Inbox className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">Submission not found</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4">
                        <div className="mb-4 text-sm text-gray-600">Submitted At: <span className="font-medium text-gray-800">{formatDate(submission.submitted_at || submission.submittedAt)}</span></div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.keys(payload).length === 0 ? (
                                    <div className="text-sm text-gray-500">No submitted fields</div>
                                ) : (
                                    Object.entries(payload).map(([k, v]) => (
                                        <div key={k} className="bg-white border border-gray-100 rounded-lg p-3">
                                            <div className="text-xs text-gray-500 mb-1">{prettifyKey(k)}</div>
                                            <div className="text-sm text-gray-800">{formatValue(v)}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
