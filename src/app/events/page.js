"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarRange, Clock, MapPin } from "lucide-react";
import AnimatedLooader from "../../components/animatedLooader";

// Remove trailing random id (e.g. " Wy36gq" or "-wy36gq") used in some titles
function sanitizeText(text) {
    if (text == null) return "";
    const str = String(text);
    const withoutTags = str.replace(/<[^>]*>/g, "");
    if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = withoutTags;
        return textarea.value;
    }
    return withoutTags;
}

function displayTitle(text) {
    const clean = sanitizeText(text);
    return clean.replace(/(?:\s|[-_])?[A-Za-z0-9]{6}$/i, "");
}

export default function EventsListingPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        import("axios").then((axios) => {
            axios.default.get(`/api/events`, { signal: controller.signal })
                .then((res) => {
                    setEvents(res.data?.events || []);
                    setLoading(false);
                })
                .catch((err) => {
                    if (err?.code === "ERR_CANCELED" || err?.name === "AbortError") return;
                    console.error("Failed to load active events:", err);
                    setLoading(false);
                });
        });
        return () => { controller.abort(); };
    }, []);

    return (
        <main className="min-h-screen bg-base-100 flex flex-col font-sans text-base-content">
            {/* Header */}
            <header className="bg-base-100 border-b border-base-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-base-200 text-muted transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <CalendarRange className="w-6 h-6 text-primary" />
                            Events & Programs
                        </h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Hero / Info */}
                <div className="mb-10 text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-warning tracking-tight">Active Events</h2>
                    <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
                        Join us for wonderful Islamic programs/events to enhance your success.
                    </p>
                </div>

                {loading ? (
                    <div className="py-20 flex items-center justify-center">
                        <AnimatedLooader message="Loading events..." />
                    </div>
                ) : events.length === 0 ? (
                    <div className="bg-base-100 border-2 border-dashed border-base-200 rounded-2xl py-16 px-4 text-center">
                        <CalendarRange className="w-12 h-12 text-muted mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-base-content">No active events</h3>
                        <p className="text-sm text-muted mt-1">There are currently no active programs to register for. Please check back later.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {events.map((event) => {
                            return (
                                <div
                                    key={event.slug}
                                    className="group flex flex-col sm:flex-row bg-base-100 rounded-2xl shadow-sm border border-white overflow-hidden hover:shadow-xl transition-all duration-300"
                                >
                                    {/* Color Banner / Indicator */}
                                    <div
                                        className="w-full sm:w-4 flex-shrink-0 bg-primary"
                                    />

                                    {/* Card Body */}
                                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 gap-6 bg-base-100 text-base-content">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold mb-2 break-words whitespace-normal line-clamp-2 group-hover:text-primary transition-colors">
                                                {displayTitle(event.title)}
                                            </h3>
                                            {event.description && (
                                                <p className="text-sm opacity-70 text-muted line-clamp-2">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>

                                        <Link
                                            href={`/events/${event.slug}`}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-primary-content shadow-sm hover:shadow-md transition-all whitespace-nowrap bg-primary"
                                        >
                                            View event
                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
