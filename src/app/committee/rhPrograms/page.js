"use client";

// Module-level cache — survives navigations within the same browser session
let _cachedEvents = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

// ─── Button colour helpers ────────────────────────────────────────────────────
const btnClass = (color, active) => {
    const base = "flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97]";
    const map = {
        green: { on: "bg-emerald-500 border-2 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.03]", off: "bg-transparent border-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10" },
        red: { on: "bg-red-500 border-2 border-red-500 text-white shadow-lg shadow-red-500/30 scale-[1.03]", off: "bg-transparent border-2 border-red-500/50 text-red-400 hover:bg-red-500/10" },
        blue: { on: "bg-blue-500 border-2 border-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.03]", off: "bg-transparent border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10" },
        orange: { on: "bg-orange-500 border-2 border-orange-500 text-white shadow-lg shadow-orange-500/30 scale-[1.03]", off: "bg-transparent border-2 border-orange-500/50 text-orange-400 hover:bg-orange-500/10" },
        purple: { on: "bg-purple-500 border-2 border-purple-500 text-white shadow-lg shadow-purple-500/30 scale-[1.03]", off: "bg-transparent border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10" },
    };
    const c = map[color] || map.green;
    return `${base} ${active ? c.on : c.off}`;
};

// ─── In-Card Image Carousel ───────────────────────────────────────────────────
function CarouselImage({ src, alt }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative w-full shrink-0" style={{ minWidth: "100%" }}>
            {/* Shimmer skeleton shown while image loads */}
            {!loaded && (
                <div
                    className="w-full"
                    style={{
                        minHeight: "220px",
                        background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.4s infinite",
                    }}
                />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                onError={(e) => { e.currentTarget.style.display = "none"; setLoaded(true); }}
                draggable={false}
                className="w-full block transition-opacity duration-400"
                style={{ opacity: loaded ? 1 : 0, position: loaded ? "static" : "absolute", top: 0, left: 0 }}
            />
        </div>
    );
}

function CardCarousel({ images }) {
    const valid = (images || []).filter(Boolean);
    const [idx, setIdx] = useState(0);
    const touchStartX = useRef(null);

    useEffect(() => { setIdx(0); }, [valid.length]);
    if (!valid.length) return null;

    const prev = () => setIdx((i) => (i - 1 + valid.length) % valid.length);
    const next = () => setIdx((i) => (i + 1) % valid.length);

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
        touchStartX.current = null;
    };

    return (
        <>
            {/* Shimmer keyframe — injected once */}
            <style>{`
                @keyframes shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
            <div
                className="relative w-full overflow-hidden rounded-t-2xl"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {/* Slides */}
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${idx * 100}%)` }}
                >
                    {valid.map((src, i) => (
                        <CarouselImage key={src} src={src} alt={`Event image ${i + 1}`} />
                    ))}
                </div>

                {/* Bottom gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />

                {valid.length > 1 && (
                    <>
                        <button onClick={prev} aria-label="Previous image"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all z-10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button onClick={next} aria-label="Next image"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all z-10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                            {idx + 1} / {valid.length}
                        </div>

                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                            {valid.map((_, i) => (
                                <button key={i} onClick={() => setIdx(i)} aria-label={`Image ${i + 1}`}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "bg-emerald-400 w-5" : "bg-white/50 w-1.5"}`} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}


// ─── Single Event Card ────────────────────────────────────────────────────────
const MAX_COMMENT = 500;

function EventCard({ event }) {
    const [vote, setVote] = useState(null);
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const buttons = Array.isArray(event.buttons) ? event.buttons : [];
    const imageUrls = Array.isArray(event.image_urls) ? event.image_urls : [];
    const pdfAttachments = Array.isArray(event.pdf_attachments) ? event.pdf_attachments : [];

    // Masjid identity from localStorage
    const masjidLoginId = typeof window !== "undefined"
        ? localStorage.getItem("masjidCommittee_masjidId") || localStorage.getItem("masjidLoginId")
        : null;
    const masjidName = typeof window !== "undefined"
        ? localStorage.getItem("masjidCommittee_masjidName") || localStorage.getItem("masjidName") || ""
        : "";

    const handleSubmit = async () => {
        if (!vote) return;
        if (!masjidLoginId) {
            setSubmitError("Masjid ID not found. Please log in again.");
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        try {
            await apiClient.post("/api/committee-event-responses", {
                eventId: event.id,
                masjidLoginId: Number(masjidLoginId),
                masjidName,
                vote,
                comment,
            });
            setSubmitted(true);
        } catch (err) {
            setSubmitError(err.message || "Something went wrong. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900">

            {/* ── 1. Image Carousel (inside card, at the top) ── */}
            {imageUrls.length > 0 && <CardCarousel images={imageUrls} />}

            {/* ── 2. Card Header ── */}


            {/* ── 3. Description ── */}
            <div className="px-5 py-4 bg-slate-800/60">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* ── 4. PDF Attachments ── */}
            {pdfAttachments.length > 0 && (
                <div className="px-5 py-3 bg-slate-800/40 border-t border-slate-700/30 space-y-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Attachments</p>
                    {pdfAttachments.map((pdf, i) => (
                        <a key={i} href={pdf.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2 hover:bg-red-900/50 transition-colors active:scale-[0.98]">
                            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-red-300 truncate">{pdf.name}</span>
                        </a>
                    ))}
                </div>
            )}

            {/* ── 5. Vote Buttons ── */}
            {buttons.length > 0 && (
                <div className="border-t border-slate-700/30">
                    {!submitted ? (
                        <div className="px-5 py-4 flex gap-3 bg-slate-800/80">
                            {buttons.map((btn, i) => (
                                <button key={i} onClick={() => setVote(btn.label)}
                                    className={btnClass(btn.color, vote === btn.label)}>
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-5 py-4 flex items-center gap-3 bg-emerald-900/30">
                            <svg className="w-5 h-5 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm font-semibold text-emerald-300">
                                You voted &ldquo;{vote}&rdquo; — Jazak Allah Khair!
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── 6 & 7. Comment + Submit — only when vote buttons exist ── */}
            {buttons.length > 0 && (
                <>
                    <div className="h-px bg-slate-700/40 mx-5" />
                    <div className="px-5 py-4 bg-slate-800/60">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Your Comment
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Share your thoughts… (max 500 characters)"
                            value={comment}
                            onChange={(e) => e.target.value.length <= MAX_COMMENT && setComment(e.target.value)}
                            disabled={submitted}
                            className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-xs ${comment.length >= MAX_COMMENT ? "text-red-400" : "text-slate-500"}`}>
                                {comment.length} / {MAX_COMMENT}
                            </span>
                        </div>
                    </div>

                    {!submitted && (
                        <div className="px-5 pb-5 bg-slate-800/80">
                            <button
                                onClick={handleSubmit}
                                disabled={!vote || submitting}
                                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Submit
                                    </>
                                )}
                            </button>
                            {!vote && (
                                <p className="text-center text-slate-500 text-xs mt-2">Please select an option above to submit</p>
                            )}
                            {submitError && (
                                <p className="text-center text-red-400 text-xs mt-2">{submitError}</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RhPrograms() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            // Use cache if fresh — avoids re-downloading images on every visit
            const now = Date.now();
            if (_cachedEvents && (now - _cacheTime) < CACHE_TTL_MS) {
                if (mounted) {
                    setEvents(_cachedEvents);
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const { data: json } = await apiClient.get("/api/committee-events");
                const evts = json.events || [];
                // Store in module-level cache
                _cachedEvents = evts;
                _cacheTime = Date.now();
                if (mounted) setEvents(evts);
            } catch (err) {
                console.error("Failed to load committee events", err);
                if (mounted) setError("Failed to load announcements. Please try again.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <main className="min-h-screen bg-base-100 flex flex-col">

            {/* ── Sticky Header ── */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-lg">
                <button onClick={() => router.back()} aria-label="Go back"
                    className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div>
                    <h1 className="text-white font-bold text-lg leading-tight">Event Announcement</h1>
                    <p className="text-white/90 text-sm">From Raahe Hidayat Team</p>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 flex flex-col items-center py-6 px-4 gap-8">

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center mt-20 gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm">Loading announcements…</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 w-full max-w-md mt-8">
                        <svg className="h-6 w-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-red-200 text-sm">{error}</span>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && events.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-20 gap-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-800/60 flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-slate-400 text-sm">No announcements available yet.</p>
                    </div>
                )}

                {/* Event Cards */}
                {!loading && !error && events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        </main>
    );
}
