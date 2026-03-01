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
        icon: <FaPeopleArrows className="text-2xl lg:text-5xl text-pink-500" />,
        borderColor: "border-pink-500",
    },
    {
        name: "Prayer Times",
        href: "/prayer-times",
        icon: <FaClock className="text-2xl lg:text-5xl text-yellow-500" />,
        borderColor: "border-yellow-500",
    },
    {
        name: "Qibla Finder",
        href: "/qibla",
        icon: <FaRegCompass className="text-2xl lg:text-5xl text-blue-400" />,
        borderColor: "border-blue-400",
    },
    {
        name: "Quran",
        href: "/quran",
        icon: <FaQuran className="text-2xl lg:text-5xl text-green-400" />,
        borderColor: "border-green-400",
    },


    {
        name: "Tasbih Counter",
        href: "/tasbih",
        icon: <TasbihSvgIcon className="w-12 h-12 lg:w-24 lg:h-24" />,
        borderColor: "border-teal-400",
    },
    {
        name: "Zikr",
        href: "/zikr",
        icon: (
            <img src="/iconZikr.png" alt="Zikr" className="w-10 h-10 object-contain bg-white rounded-full p-0.5" />
        ),
        borderColor: "border-white",
    },
    {
        name: "Rewards",
        href: "/rewards",
        icon: <FaGift className="text-2xl lg:text-5xl text-pink-500" />,
        borderColor: "border-pink-500",
    },
    {
        name: "Aelaan Naama",
        href: "/notice",
        icon: <Megaphone className="text-3xl lg:text-6xl text-blue-400" />,
        borderColor: "border-blue-400",
    },




    {
        name: "Olmaa's Stores",
        href: "/local-stores",
        icon: (
            <FaStore className="text-3xl lg:text-6xl text-emerald-400" />
        ),
        borderColor: "border-emerald-400",
    },
    {
        name: "Job Portal",
        href: "/jobPortal/jobLists",
        icon: (
            <FaBriefcase className="text-3xl lg:text-6xl text-purple-400" />
        ),
        borderColor: "border-purple-400",
    },
    {
        name: "Masjid Committee",
        href: "/committee",
        icon: (
            <FaMosque className="text-3xl lg:text-6xl text-indigo-400" />
        ),
        borderColor: "border-indigo-400",
    },
    {
        name: "Contact Us",
        href: "/contactUs",
        icon: (
            <FaRegIdBadge className="text-3xl lg:text-6xl text-yellow-400" />
        ),
        borderColor: "border-yellow-400",
    },

    {
        name: "Privacy Policy",
        href: "/privacy",
        icon: (
            <FaFileAlt className="text-3xl lg:text-6xl text-slate-400" />
        ),
        borderColor: "border-slate-400",
    },
    {
        name: "My Profile",
        href: "/myProfile",
        icon: (
            <FaUser className="text-3xl lg:text-6xl text-cyan-500" />
        ),
        borderColor: "border-cyan-500",
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
            className="flex min-h-screen flex-col items-center justify-center bg-[#09152a] text-gray-200 p-4 sm:p-6 pb-24 sm:pb28"
            style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
            }}
        >
            <header className="text-center mb-10 ">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-600">
                        RAAH-E-HIDAYAT{" "}
                    </span>{" "}
                </h1>
                <CardLink
                    href="/ramzan"
                    className="mt-2 text-lg sm:text-xl max-w-2xl mx-auto inline-block font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:shadow-md transform transition-all duration-200 hover:scale-105 cursor-pointer"
                    onDelayedShow={setShowLoader}
                >
                    <span className="inline-flex items-center">
                        Ramzan Special
                    </span>
                </CardLink>
            </header>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl ">
                {sections.map((section) => {
                    const isNotice = section.href === "/notice";
                    const baseClass =
                        "group relative flex flex-col items-center justify-center gap-3 p-6 bg-[#243447] rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-green-600 dark:hover:bg-green-700 active:bg-green-600 dark:active:bg-green-800 focus:bg-green-600 dark:focus:bg-green-800 min-h-[140px] aspect-square";
                    const noticeHighlight = isNotice && unseenCount > 0 ? " ring-2 ring-offset-2 ring-yellow-400 shadow-xl" : "";
                    const borderBottomClass = ` border-b-4 ${section.borderColor}`;
                    return (
                        <CardLink
                            key={section.name}
                            href={section.href}
                            className={baseClass + noticeHighlight + borderBottomClass}
                            onDelayedShow={setShowLoader}
                        >
                            <div className="w-full h-full relative flex flex-col items-center justify-center">
                                {isNotice && unseenCount > 0 && (
                                    <div className="absolute top-[-20px] right-[-20px]">
                                        <span className="badge badge-error text-l font-bold text-white py-1 px-2 animate-pulse shadow-sm">
                                            {unseenCount > 3 ? "3+" : unseenCount}
                                        </span>
                                    </div>
                                )}

                                <div className="flex-shrink-0 p-1 rounded-full bg-[#1e2f3f] mb-1">
                                    {section.icon}
                                </div>
                                <h2 className="text-base font-semibold text-center text-white transition-colors">
                                    {section.name}
                                </h2>
                            </div>
                        </CardLink>
                    );
                })}
            </div>
            {showLoader && <AnimatedLooader message="Please wait..." />}
        </main>
    );
}
