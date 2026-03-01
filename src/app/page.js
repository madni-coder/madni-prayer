"use client";

import { useState, useCallback, useEffect } from "react";
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

const sections = [
    {
        name: "Jama'at Times",
        href: "/jamat-times",
        icon: <FaPeopleArrows className="text-4xl lg:text-5xl text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />,
        accent: '#ec4899',
    },
    {
        name: "Prayer Times",
        href: "/prayer-times",
        icon: <FaClock className="text-4xl lg:text-5xl text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />,
        accent: '#f59e0b',
    },
    {
        name: "Qibla Finder",
        href: "/qibla",
        icon: <FaRegCompass className="text-4xl lg:text-5xl text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />,
        accent: '#60a5fa',
    },
    {
        name: "Quran Sharif",
        href: "/quran",
        icon: <FaQuran className="text-4xl lg:text-5xl text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />,
        accent: '#4ade80',
    },
    {
        name: "Tasbih Counter",
        href: "/tasbih",
        icon: <div className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"><TasbihSvgIcon className="w-12 h-12 lg:w-16 lg:h-16" /></div>,
        accent: '#06b6d4',
    },
    {
        name: "Zikr",
        href: "/zikr",
        icon: (
            <img src="/iconZikr.png" alt="Zikr" className="w-8 h-8 lg:w-14 lg:h-14 object-contain bg-white rounded-full p-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
        ),
        accent: '#ffffff',
    },
    {
        name: "Weekly Rewards",
        href: "/rewards",
        icon: <FaGift className="text-4xl lg:text-5xl text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />,
        accent: '#ec4899',
    },
    {
        name: "Aelaan Naama",
        href: "/notice",
        icon: <Megaphone className="text-4xl lg:text-5xl text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />,
        accent: '#60a5fa',
    },
    {
        name: "Olmaa's Stores",
        href: "/local-stores",
        icon: (
            <FaStore className="text-4xl lg:text-5xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
        ),
        accent: '#34d399',
    },
    {
        name: "Job Portal",
        href: "/jobPortal/jobLists",
        icon: (
            <FaBriefcase className="text-4xl lg:text-5xl text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]" />
        ),
        accent: '#c084fc',
    },
    {
        name: "Masjid Committee",
        href: "/committee",
        icon: (
            <FaMosque className="text-4xl lg:text-5xl text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
        ),
        accent: '#818cf8',
    },
    {
        name: "Contact Us",
        href: "/contactUs",
        icon: (
            <FaRegIdBadge className="text-4xl lg:text-5xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        ),
        accent: '#f59e0b',
    },

    {
        name: "Privacy Policy",
        href: "/privacy",
        icon: (
            <FaFileAlt className="text-4xl lg:text-5xl text-slate-400 drop-shadow-[0_0_15px_rgba(148,163,184,0.5)]" />
        ),
        accent: '#94a3b8',
    },
    {
        name: "My Profile",
        href: "/myProfile",
        icon: (
            <FaUser className="text-4xl lg:text-5xl text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        ),
        accent: '#06b6d4',
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
                parseInt(localStorage.getItem("notice_last_seen_count") || "0", 15) || 0;
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

    // Helper function to trigger low intensity vibration on mobile
    // Tries multiple fallbacks: standard Vibration API, Tauri haptics plugin,
    // and other common WebView bridges. Nothing is done if no API exists.
    const triggerVibration = useCallback(async () => {
        if (typeof window === "undefined") return;

        try {
            // 1) Tauri Haptics Plugin - For Tauri mobile apps (iOS & Android)
            if (window.__TAURI_INTERNALS__) {
                try {
                    const { vibrate, ImpactStyle } = await import('@tauri-apps/plugin-haptics');
                    await vibrate(ImpactStyle.Light);
                    return;
                } catch (e) {
                    console.debug('Tauri haptics not available:', e);
                }
            }

            // 2) Standard web Vibration API
            if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
                navigator.vibrate(15);
                return;
            }

            // 3) React Native WebView bridge
            if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "vibrate", duration: 15 }));
                return;
            }

            // 4) Android/JavascriptInterface
            if (window.Android && typeof window.Android.vibrate === "function") {
                window.Android.vibrate(15);
                return;
            }
            if (window.android && typeof window.android.vibrate === "function") {
                window.android.vibrate(15);
                return;
            }

            // 5) WKWebView iOS message handler
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.vibrate) {
                window.webkit.messageHandlers.vibrate.postMessage({ duration: 15 });
                return;
            }
        } catch (err) {
            // swallow errors — vibration is non-essential
            // eslint-disable-next-line no-console
            console.warn("triggerVibration error:", err);
        }
    }, []);

    return (
        <main
            className=" flex min-h-screen flex-col items-center justify-start pt-12 sm:pt-20 bg-gradient-to-b from-[#060b14] via-[#0b172d] to-[#040812] text-gray-200 p-4 sm:p-6 pb-24 sm:pb-32 relative overflow-hidden"
            style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
            }}
        >
            {/* Background Abstract Glows */}
            <div className="absolute top-0 left-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

            <header className=" text-center mb-15 sm:mb-14 relative z-15 w-full max-w-4xl mx-auto">
                <div className="relative inline-flex flex-col items-center mt-[-30px]">
                    {/* Glowing background blur */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-r from-emerald-500/50 via-teal-400/50 to-cyan-500/50 blur-[50px] rounded-full pointer-events-none animate-pulse" />

                    <h1 className="relative w-full text-4xl whitespace-nowrap font-black tracking-tighter uppercase drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] z-10 pb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-emerald-200 to-teal-600 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            RAAH-E-HIDAYAT
                        </span>
                    </h1>

                    {/* Glowing underline accent */}
                    <div className="mt-[-2] sm:mt-4 h-[3px] w-32 sm:w-48 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)] relative overflow-hidden">
                        <div className="absolute inset-0 w-[50%] bg-white/60 -translate-x-[200%] skew-x-[-30deg] animate-[shimmer_2.5s_infinite]" />
                    </div>
                </div>
                <div className="mt-6 flex justify-center">
                    <CardLink
                        href="/ramzan"
                        className="mt-[-5] text-lg sm:text-xl font-bold px-8 py-3 sm:px-12 sm:py-4 rounded-full bg-gradient-to-b from-emerald-500 to-green-700 text-white 
                        shadow-[0_10px_20px_rgba(16,185,129,0.4),inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-4px_0_rgba(0,0,0,0.3)] 
                        hover:shadow-[0_15px_30px_rgba(16,185,129,0.5),inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.2)] 
                        hover:-translate-y-1 active:translate-y-1 active:shadow-[0_5px_10px_rgba(16,185,129,0.4),inset_0_2px_0_rgba(0,0,0,0.3)] 
                        transform transition-all duration-300 border border-green-400/40 relative overflow-hidden group"
                        onDelayedShow={setShowLoader}
                        onTap={triggerVibration}
                    >
                        <span className=" absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                        <span className="relative drop-shadow-md ">Ramzan Special</span>
                    </CardLink>
                </div>
            </header>

            <div className="mt-[-20] grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl relative z-15 px-0 sm:px-4">
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
                            onTap={triggerVibration}
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

                            {/* Elevated Icon Container (transparent glass) */}
                            <div className="relative z-20 flex-shrink-0 p-4 sm:p-5 w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/10 backdrop-blur-[14px] border border-white/[0.08] shadow-[inset_2px_2px_10px_rgba(0,0,0,0.5),inset_-1px_-1px_6px_rgba(255,255,255,0.08),0_12px_28px_rgba(0,0,0,0.65)] transition-all duration-300 group-hover:-translate-y-1 flex items-center justify-center overflow-hidden">
                                {/* clear glass gradient with subtle reflections */}
                                <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.01) 50%, rgba(0,0,0,0.15) 100%)' }} />
                                {/* glass corner reflection */}
                                <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full opacity-12 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2), rgba(255,255,255,0.05) 30%, transparent 55%)' }} />
                                {/* glass highlight bar */}
                                <div className="absolute top-1.5 left-3 right-3 h-0.5 rounded-full opacity-20 bg-white/80 blur-[2px] pointer-events-none" />

                                <div className="relative z-10 transform transition-transform duration-300 group-hover:scale-110">
                                    {section.icon}
                                </div>

                                {section.accent && (
                                    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                                        <div
                                            className="rounded-full h-[3px] w-16 sm:w-12 mb-2"
                                            style={{
                                                background: section.accent,
                                                boxShadow: `0 6px 12px ${section.accent}22`,
                                                opacity: 0.95,
                                            }}
                                        />
                                    </div>
                                )}

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
