"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    CalendarRange, Plus, Pencil, Trash2, Eye,
    FileText, Clock, Users, ChevronRight, Search, ToggleLeft, ToggleRight
} from "lucide-react";








































// ─── Status Badge ────────────────────────────────────────────────────────────
// Sanitize text to avoid rendering HTML/code in titles/descriptions
function sanitizeText(text) {
    if (text == null) return "";
    const str = String(text);
    // strip HTML tags
    const withoutTags = str.replace(/<[^>]*>/g, "");
    // decode HTML entities if running in browser
    if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = withoutTags;
        return textarea.value;
    }
    return withoutTags;
}

// Remove trailing random id (e.g. " Wy36gq" or "-wy36gq") from titles for display
function displayTitle(text) {
    const clean = sanitizeText(text);
    // remove trailing space or hyphen + 6 alphanumeric chars (case-insensitive)
    return clean.replace(/(?:\s|[-_])?[A-Za-z0-9]{6}$/i, "");
}

function StatusBadge({ active }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${active
            ? "bg-emerald-100 text-emerald-700"
            : "bg-gray-50 text-gray-700 opacity-60"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
            {active ? "Live" : "Draft"}
        </span>
    );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ page, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Event Page</h3>
                </div>
                <p className="text-gray-700 opacity-80 text-sm mb-6">
                    Are you sure you want to delete <strong>"{displayTitle(page.title)}"</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        Cancel
                    </button>
                    <button onClick={onConfirm}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Create New Page Modal ────────────────────────────────────────────────────
function CreateModal({ onConfirm, onCancel }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const rawTitle = title.trim();
        if (!rawTitle) return;
        const cleanTitle = sanitizeText(rawTitle);
        const cleanDescription = sanitizeText(description.trim());
        const randomStr = Math.random().toString(36).substring(2, 8);
        const slug = cleanTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + `-${randomStr}`;
        onConfirm({ title: cleanTitle, description: cleanDescription, slug });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-violet-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Create New Event Page</h3>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Event Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Eid Milad Program 2026"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-gray-900 bg-white"
                        />
                        {title && (() => {
                            const previewSlug = sanitizeText(title || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                            return (
                                <p className="mt-1 text-xs text-gray-700 opacity-50">
                                    Slug: /events/{previewSlug}-{'[random_id]'}
                                </p>
                            );
                        })()}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Short description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 bg-white"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onCancel}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                            Cancel
                        </button>
                        <button type="submit"
                            className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition bg-violet-600">
                            Create Page
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminEventsPage() {
    const router = useRouter();
    const [pages, setPages] = useState([]);
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        import("axios").then((axios) => {
            axios.default.get("/api/admin/events", { signal: controller.signal })
                .then(res => {
                    setPages(res.data?.events || []);
                    setLoading(false);
                })
                .catch(err => {
                    if (err?.code === "ERR_CANCELED" || err?.name === "AbortError") return;
                    console.error("Failed to load events", err);
                    setLoading(false);
                });
        });
        return () => { controller.abort(); };
    }, []);

    const filtered = pages.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
    );

    const toggleActive = async (slug, currentStatus) => {
        // Optimistic UI update
        setPages(prev => prev.map(p => p.slug === slug ? { ...p, isActive: !p.isActive } : p));
        try {
            const axios = (await import("axios")).default;
            // First fetch existing schema to cleanly upsert the active bit
            const schemaRes = await axios.get(`/api/admin/events/${slug}`);
            if (schemaRes.data?.event) {
                const schema = schemaRes.data.event;
                // Flip the active Boolean inside the payload
                const updatePayload = {
                    page_title: schema.title,
                    description: schema.description,
                    color: schema.theme_color,
                    submit_label: schema.submit_label,
                    fields: schema.schema_fields,
                    isActive: !currentStatus
                }
                await axios.put(`/api/admin/events/${slug}`, { schema: updatePayload });
            }
        } catch (err) {
            console.error("Failed to toggle status", err);
            // Revert back if failed
            setPages(prev => prev.map(p => p.slug === slug ? { ...p, isActive: currentStatus } : p));
        }
    };

    const deletePage = async (slug) => {
        setDeleteTarget(null);
        setPages(prev => prev.filter(p => p.slug !== slug));
        try {
            const axios = (await import("axios")).default;
            await axios.delete(`/api/admin/events/${slug}`);
        } catch (err) {
            console.error("Failed to delete event", err);
            // Refresh full list if delete failed
            const axios = (await import("axios")).default;
            const res = await axios.get("/api/admin/events");
            setPages(res.data?.events || []);
        }
    };

    const createPage = (data) => {
        setShowCreateModal(false);
        // Navigate instantly to builder, it will cleanly PUT new data when they hit save!
        router.push(`/admin/events/${data.slug}`);
    };

    const liveCount = pages.filter(p => p.isActive).length;
    const totalSubmissions = pages.reduce((a, p) => a + (p.submissionsCount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarRange className="w-7 h-7 text-violet-600" />
                        Events / Programs
                    </h1>
                    <p className="mt-1 text-sm text-gray-700 opacity-60">
                        Create fully dynamic event pages with custom fields — no code needed.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Event Page
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Pages", value: pages.length, icon: FileText, color: "bg-violet-100 text-violet-600" },
                    { label: "Live Now", value: liveCount, icon: Eye, color: "bg-emerald-50 text-emerald-600" },
                    { label: "All Submissions", value: totalSubmissions, icon: Users, color: "bg-blue-50 text-blue-600" },
                ].map(stat => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 leading-none">{stat.value}</p>
                            <p className="text-xs text-gray-700 opacity-60 mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 opacity-50" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search event pages..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
            </div>

            {/* Pages List */}
            {loading ? (
                <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <h3 className="text-gray-700 opacity-60 font-medium">Loading events...</h3>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
                    <CalendarRange className="w-12 h-12 text-gray-700 opacity-30 mx-auto mb-3" />
                    <h3 className="text-gray-700 opacity-60 font-medium">No event pages found</h3>
                    <p className="text-gray-700 opacity-50 text-sm mt-1">Create your first event page to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(page => (
                        <div key={page.id}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
                            <div className="flex items-start gap-0">
                                {/* Color Bar */}
                                <div className="w-1.5 rounded-l-xl self-stretch bg-violet-600" />

                                <div className="flex-1 p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        {/* Info */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-base font-semibold text-gray-900 truncate">{displayTitle(page.title)}</h2>
                                                <StatusBadge active={page.isActive} />
                                            </div>
                                            {page.description && (
                                                <p className="text-sm text-gray-700 opacity-60 mt-0.5 truncate">{sanitizeText(page.description)}</p>
                                            )}
                                            {/* slug hidden from admin list */}

                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-700 opacity-60">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {page.fieldsCount} fields
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {page.submissionsCount} submissions
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Updated {page.updatedAt}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Toggle Active */}
                                            <button
                                                onClick={() => toggleActive(page.slug, page.isActive)}
                                                title={page.isActive ? "Set to Draft" : "Set to Live"}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${page.isActive
                                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                    : "bg-gray-50 text-gray-700 opacity-60 hover:bg-gray-100"
                                                    }`}
                                            >
                                                {page.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                {page.isActive ? "Live" : "Draft"}
                                            </button>

                                            {/* View Submissions */}
                                            <Link href={`/admin/events/${page.slug}/submissions`}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-700 opacity-80 rounded-lg text-xs font-medium hover:bg-gray-100 transition">
                                                <Eye className="w-3.5 h-3.5" />
                                                Preview
                                            </Link>

                                            {/* Edit Builder */}
                                            <Link href={`/admin/events/${page.slug}`}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-white rounded-lg text-xs font-medium hover:opacity-90 transition bg-violet-600">
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                                <ChevronRight className="w-3 h-3" />
                                            </Link>

                                            {/* Delete */}
                                            <button
                                                onClick={() => setDeleteTarget(page)}
                                                className="p-1.5 text-gray-700 opacity-50 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {deleteTarget && (
                <DeleteModal
                    page={deleteTarget}
                    onConfirm={() => deletePage(deleteTarget.slug)}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
            {showCreateModal && (
                <CreateModal
                    onConfirm={createPage}
                    onCancel={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
}
