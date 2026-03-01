"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import CardLink from "../components/CardLink.client";
import AnimatedLooader from "../components/animatedLooader";
import {
    FaQuran,
    FaPeopleArrows,
    FaClock,
    FaRegCompass,
    FaGift,
    FaMicrophone,
    FaPhoneSquare,
    FaHandPointRight,
    FaUser,
    FaStore,
    FaBriefcase,
    FaRegIdBadge,
    FaMosque,
    FaFileAlt
} from "react-icons/fa";
import { Megaphone, UsersRound } from "lucide-react";
import Image from "next/image";
import TasbihSvgIcon from "../components/TasbihSvgIcon";
import apiClient from "../lib/apiClient";
import { useEffect } from "react";

const sections = [
    {
        name: "Jama'at Times",
        href: "/jamat-times",
        icon: <FaPeopleArrows className="text-4xl lg:text-5xl text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />,
    },
    {
        name: "Prayer Times",
        href: "/prayer-times",
        icon: <FaClock className="text-4xl lg:text-5xl text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />,
    },
    {
        name: "Qibla Finder",
        href: "/qibla",
        icon: <FaRegCompass className="text-4xl lg:text-5xl text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />,
    },
    {
        name: "Quran",
        href: "/quran",
        icon: <FaQuran className="text-4xl lg:text-5xl text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />,
    },
    {
        name: "Tasbih Counter",
        href: "/tasbih",
        icon: <div className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"><TasbihSvgIcon className="w-12 h-12 lg:w-16 lg:h-16" /></div>,
    },
    {
        name: "Zikr",
        href: "/zikr",
        icon: (
            <img src="/iconZikr.png" alt="Zikr" className="w-12 h-12 lg:w-14 lg:h-14 object-contain bg-white rounded-full p-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
        ),
    },
    {
        name: "Rewards",
        href: "/rewards",
        icon: <FaGift className="text-4xl lg:text-5xl text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />,
    },
    {
        name: "Aelaan Naama",
        href: "/notice",
        icon: <Megaphone className="text-4xl lg:text-5xl text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />,
    },
    {
        name: "Olmaa's Stores",
        href: "/local-stores",
        icon: (
            <FaStore className="text-4xl lg:text-5xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
        ),
    },
    {
        name: "Job Portal",
        href: "/jobPortal/jobLists",
        icon: (
            <FaBriefcase className="text-4xl lg:text-5xl text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]" />
        ),
    },
    {
        name: "Masjid Committee",
        href: "/committee",
        icon: (
            <FaMosque className="text-4xl lg:text-5xl text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
        ),
    },
    {
        name: "Contact Us",
        href: "/contactUs",
        icon: (
            <FaRegIdBadge className="text-4xl lg:text-5xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        ),
    },

    {
        name: "Privacy Policy",
        href: "/privacy",
        icon: (
            <FaFileAlt className="text-4xl lg:text-5xl text-slate-400 drop-shadow-[0_0_15px_rgba(148,163,184,0.5)]" />
        ),
    },
    {
        name: "My Profile",
        href: "/myProfile",
        icon: (
            <FaUser className="text-4xl lg:text-5xl text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        ),
    }
];

// ─── Supabase client (client-side, anon key only) ───────────────────────────
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Cache TTL: only re-fetch from the API if the cached value is older than this
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getCachedTotal() {
    try {
        const raw = sessionStorage.getItem("notice_total_cache");
        if (!raw) return null;
        const { total, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL_MS) return total;
    } catch (_) {/* ignore */ }
    return null; // cache miss or expired
}

function setCachedTotal(total) {
    try {
        sessionStorage.setItem(
            "notice_total_cache",
            JSON.stringify({ total, ts: Date.now() })
        );
    } catch (_) {/* ignore */ }
}

export default function Home() {
    const [showLoader, setShowLoader] = useState(false);
    const [unseenCount, setUnseenCount] = useState(0);

    useEffect(() => {
        let mounted = true;

        function computeUnseen(total) {
            const lastSeen =
                parseInt(localStorage.getItem("notice_last_seen_count") || "0", 10) || 0;
            return Math.max(0, total - lastSeen);
        }

        async function fetchAndCache() {
            try {
                const { data } = await apiClient.get("/api/api-notice");
                const imgs = data?.images || [];
                const total = Array.isArray(imgs) ? imgs.length : 0;
                setCachedTotal(total);
                if (mounted) setUnseenCount(computeUnseen(total));
            } catch (e) {
                if (mounted) setUnseenCount(0);
            }
        }

        // On mount: use cache if fresh, otherwise fetch
        const cached = getCachedTotal();
        if (cached !== null) {
            setUnseenCount(computeUnseen(cached));
        } else {
            fetchAndCache();
        }

        // On focus: only re-fetch if cache is stale (avoids repeated API calls)
        const onFocus = () => {
            if (getCachedTotal() === null) fetchAndCache();
        };
        window.addEventListener("focus", onFocus);

        // ── Supabase Realtime: instant badge update when admin uploads ──────
        const channel = supabase
            .channel("notice-updates")
            .on("broadcast", { event: "new-notice" }, ({ payload }) => {
                if (!mounted) return;
                const newTotal = payload?.total;
                if (typeof newTotal === "number") {
                    setCachedTotal(newTotal);
                    setUnseenCount(computeUnseen(newTotal));
                } else {
                    // Fallback: invalidate cache so next focus re-fetches
                    try { sessionStorage.removeItem("notice_total_cache"); } catch (_) { }
                    fetchAndCache();
                }
            })
            .subscribe();

        return () => {
            mounted = false;
            window.removeEventListener("focus", onFocus);
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <main
            className="flex min-h-screen flex-col items-center justify-start pt-12 sm:pt-20 bg-gradient-to-b from-[#060b14] via-[#0b172d] to-[#040812] text-gray-200 p-4 sm:p-6 pb-24 sm:pb-32 relative overflow-hidden"
            style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
            }}
        >
            {/* Background Abstract Glows */}
            <div className="absolute top-0 left-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <header className="text-center mb-10 sm:mb-14 relative z-10 w-full max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight pb-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-green-300 via-emerald-400 to-teal-500">
                        RAAH-E-HIDAYAT
                    </span>
                </h1>
                <div className="mt-6 flex justify-center">
                    <CardLink
                        href="/ramzan"
                        className="text-lg sm:text-xl font-bold px-8 py-3 sm:px-12 sm:py-4 rounded-full bg-gradient-to-b from-emerald-500 to-green-700 text-white 
                        shadow-[0_10px_20px_rgba(16,185,129,0.4),inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-4px_0_rgba(0,0,0,0.3)] 
                        hover:shadow-[0_15px_30px_rgba(16,185,129,0.5),inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.2)] 
                        hover:-translate-y-1 active:translate-y-1 active:shadow-[0_5px_10px_rgba(16,185,129,0.4),inset_0_2px_0_rgba(0,0,0,0.3)] 
                        transform transition-all duration-300 border border-green-400/40 relative overflow-hidden group"
                        onDelayedShow={setShowLoader}
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                        <span className="relative drop-shadow-md">Ramzan Special</span>
                    </CardLink>
                </div>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl relative z-10 px-0 sm:px-4">
                {sections.map((section, idx) => {
                    const isNotice = section.href === "/notice";

                    // Realistic 3D Interactive Card Classes
                    const baseClass =
                        "group relative flex flex-col items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-3xl " +
                        "bg-gradient-to-b from-[#253648] to-[#162331] " +
                        "border-t border-l border-[#40566e] border-b border-r border-[#0d151e] " +
                        "shadow-[6px_6px_14px_rgba(0,0,0,0.6),-4px_-4px_10px_rgba(255,255,255,0.03)] " +
                        "hover:shadow-[10px_10px_20px_rgba(0,0,0,0.7),-6px_-6px_14px_rgba(255,255,255,0.05),inset_0_2px_20px_rgba(255,255,255,0.02)] " +
                        "active:shadow-[2px_2px_6px_rgba(0,0,0,0.8),inset_4px_4px_10px_rgba(0,0,0,0.5)] " +
                        "transform transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] " +
                        "hover:-translate-y-2 hover:scale-[1.03] active:translate-y-1 active:scale-95 " +
                        "h-[140px] sm:h-[180px] w-full overflow-hidden";

                    const noticeHighlight = isNotice && unseenCount > 0
                        ? " ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.4)] border-yellow-500/50"
                        : "";

                    return (
                        <CardLink
                            key={section.name}
                            href={section.href}
                            className={baseClass + noticeHighlight}
                            onDelayedShow={setShowLoader}
                        >
                            {/* Inner Glass Highlights Wrapper */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />

                            {/* Notification Badge */}
                            {isNotice && unseenCount > 0 && (
                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30">
                                    <span className="flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs sm:text-sm py-1 px-2.5 rounded-full border-2 border-[#162331] shadow-[0_4px_8px_rgba(239,68,68,0.6)] animate-pulse">
                                        {unseenCount > 3 ? "3+" : unseenCount}
                                    </span>
                                </div>
                            )}

                            {/* Elevated Icon Container */}
                            <div className="relative z-20 flex-shrink-0 p-3 sm:p-4 rounded-2xl bg-[#1a2533] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-1px_-1px_3px_rgba(255,255,255,0.05),0_6px_12px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8),inset_-1px_-1px_3px_rgba(255,255,255,0.06),0_10px_20px_rgba(0,0,0,0.6)] flex items-center justify-center">
                                <div className="transform transition-transform duration-300 group-hover:scale-110">
                                    {section.icon}
                                </div>
                            </div>

                            {/* Text */}
                            <h2 className="relative z-20 text-xs sm:text-base font-bold text-center text-slate-300 group-hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors mt-1 px-1">
                                {section.name}
                            </h2>
                        </CardLink>
                    );
                })}
            </div>

            {showLoader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060b14]/80 backdrop-blur-sm transition-opacity">
                    <AnimatedLooader message="Please wait..." />
                </div>
            )}

            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(150%) skew-x-[-30deg]; }
                }
            `}</style>
        </main>
    );
}
