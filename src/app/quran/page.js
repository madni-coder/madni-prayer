"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FaAngleLeft } from "react-icons/fa";
import apiClient from "../../lib/apiClient";
import ClientPdfViewer from "../pdf-viewer/ClientPdfViewer";

// Detect Tauri environment
const isTauri = process.env.NEXT_PUBLIC_TAURI_BUILD === "1";

// Base URL of deployed site for API calls when running inside Tauri (static build has no Next API)
const REMOTE_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Sample Surah data (in real app, fetch from API or static JSON)
const surahs = [
    { number: 1, name: "Surah Yaseen", arabic: " يٰسٓ", ayahs: 83 },
    { number: 2, name: "Surah Baqrah", arabic: "البقرة", ayahs: 286 },
    { number: 3, name: "Surah Muzammil", arabic: "المزمل", ayahs: 200 },
    { number: 4, name: "Surah Waqi'a", arabic: "الواقعة", ayahs: 96 },
    { number: 5, name: "Surah Maryam", arabic: "مريم", ayahs: 98 },
    { number: 6, name: "Surah Mulk", arabic: "الملك", ayahs: 30 },
    // ...add more or fetch dynamically
];

// Static Para (Juz) data: 1-30 with custom names and Arabic only (ruku removed)
const paraNames = [
    { name: "Alif Laam Meem", arabic: "ٱلۤمّ" },
    { name: "Sayaqool", arabic: "سَيَقُولُ" },
    { name: "Tilka’r Rusul", arabic: "تِلْكَ ٱلرُّسُلُ" },
    { name: "Lan Tanaaloo", arabic: "لَن تَنَالُواْ" },
    { name: "Wa’l Mohsanat", arabic: "وَٱلْمُحْصَنَاتُ" },
    { name: "Ya Ayyuha’lladhina Aamanu", arabic: "لَا يُحِبُّ ٱللهُ" },
    { name: "Wa Iza Sami‘u", arabic: "وَإِذَا سَمِعُواْ" },
    { name: "Wa Lau Annana", arabic: "وَلَوْ أَنَّنَا" },
    { name: "Qad Aflaha", arabic: "قَالَ ٱلْمَلَأُ" },
    { name: "Wa A‘lamu", arabic: "وَٱعْلَمُواْ" },
    { name: "Ya Ayyuha’lladhina Aamanu La Tattakhizu", arabic: "يتعذرون" },
    { name: "Wa Mamin Daabbah", arabic: "وَمَا مِن دَآبَّةٍ" },
    { name: "Wa Ma Ubrioo", arabic: "وَمَآ أُبَرِّئُ" },
    { name: "Rubama", arabic: "رُّبَمَا" },
    { name: "Subhanalladhi", arabic: "سُبْحَٰنَ ٱلَّذِى" },
    { name: "Qala Alam", arabic: "قَالَ أَلَمْ" },
    { name: "Iqtarabat", arabic: "ٱقْتَرَبَتْ" },
    { name: "Qadd Aflaha", arabic: "قَدْ أَفْلَحَ" },
    { name: "Wa Qala’lladhina La Yarjuna", arabic: "وَقَالَ ٱلَّذِينَ " },
    { name: "A‘mman Khalaq", arabic: "أَمَّنْ خَلَقَ" },
    { name: "Utlu Ma Oohiya", arabic: "ٱتْلُ مَآ أُوحِىَ" },
    { name: "Wa Manyaqnut", arabic: "وَمَن يَقْنُتْ" },
    { name: "Wa Mali", arabic: "وَمَا لِىَ" },
    { name: "Faman Azlam", arabic: "فَمَنْ أَظْلَمُ" },
    { name: "Elahe Yuruddu", arabic: "إِلَيْهِ يُرَدُّ" },
    { name: "Ha’a Meem", arabic: "حم" },
    { name: "Qala Fama Khatbukum", arabic: "قَالَ فَمَا خَطْبُكُم" },
    { name: "Qadd Sami‘a’llahu", arabic: "قَدْ سَمِعَ ٱللَّهُ" },
    { name: "Tabarakalladhi", arabic: "تَبَارَكَ ٱلَّذِى" },
    { name: "‘Amma Yatasa’aloon", arabic: "عَمَّ " },
];

const paras = paraNames.map((p, i) => ({
    number: i + 1,
    name: p.name,
    arabic: p.arabic,
}));

async function getPara() {
    try {
        const { data } = await apiClient.get("/api/api-quran");
        return data.files;
    } catch (err) {
        throw new Error(err?.message || "Failed to fetch para files");
    }
}

async function getSurahPdf(surahName) {
    try {
        const { data } = await apiClient.get("/api/api-quran", {
            params: { surah: surahName },
        });
        return data.fileUrl;
    } catch (err) {
        throw new Error(err?.message || "Failed to fetch surah PDF");
    }
}

// Kanzul helper removed — use server API to resolve file and debug access

export default function Page() {
    const [search, setSearch] = useState("");
    const [view, setView] = useState("para"); // "para" is now default
    const [files, setFiles] = useState([]); // store API files
    const [showReader, setShowReader] = useState(false);
    const [currentPara, setCurrentPara] = useState(null);
    const [currentTitle, setCurrentTitle] = useState("");
    const [readerUrl, setReaderUrl] = useState("");
    const [zoom, setZoom] = useState(1);
    const [currentObjectUrl, setCurrentObjectUrl] = useState(null);
    const [loadingPara, setLoadingPara] = useState(null);
    const [kanzulLoading, setKanzulLoading] = useState(false);
    const router = useRouter();

    // Theme note: allow user to record how many para they completed
    const [noteText, setNoteText] = useState("");
    const [completedPara, setCompletedPara] = useState("");
    const [noteSavedAt, setNoteSavedAt] = useState(null);
    const [noteHistory, setNoteHistory] = useState([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("theme_note");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed) {
                    setNoteText(parsed.text || "");
                    setCompletedPara(parsed.completedPara || "");
                    setNoteSavedAt(parsed.savedAt || null);
                }
            }
            const rawHist = localStorage.getItem("theme_note_history");
            if (rawHist) {
                try {
                    const parsedHist = JSON.parse(rawHist);
                    if (Array.isArray(parsedHist) && parsedHist.length > 0) setNoteHistory([parsedHist[0]]);
                    else if (parsedHist && typeof parsedHist === 'object') setNoteHistory([parsedHist]);
                } catch (e) {
                    // ignore
                }
            }
        } catch (e) {
            // ignore
        }
    }, []);

    const saveThemeNote = () => {
        try {
            const payload = {
                text: noteText,
                completedPara: completedPara,
                savedAt: Date.now(),
            };
            localStorage.setItem("theme_note", JSON.stringify(payload));
            setNoteSavedAt(payload.savedAt);
            // keep only single latest history entry (overwrite)
            const newEntry = { text: noteText, savedAt: payload.savedAt };
            const newHist = [newEntry];
            try {
                localStorage.setItem("theme_note_history", JSON.stringify(newHist));
            } catch (e) {
                // ignore
            }
            setNoteHistory(newHist);
            setNoteText("");
            console.log("Theme note saved", payload);
        } catch (e) {
            console.error("Failed to save theme note", e);
            alert("Failed to save note");
        }
    };

    const clearThemeNote = () => {
        try {
            localStorage.removeItem("theme_note");
            localStorage.removeItem("theme_note_history");
        } catch (e) {
            // ignore
        }
        setNoteText("");
        setNoteHistory([]);
        setNoteSavedAt(null);
    };

    // keyboard handlers for reader modal + lock body scroll while open
    useEffect(() => {
        if (!showReader) return;
        const onKey = (e) => {
            if (e.key === "Escape") setShowReader(false);
        };
        window.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        // mark body so global CSS can hide fixed bottom nav
        document.body.classList.add("bottom-nav-hidden");
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
            document.body.classList.remove("bottom-nav-hidden");
        };
    }, [showReader]);

    // revoke any created object URL when reader closes
    useEffect(() => {
        if (showReader) return;
        if (currentObjectUrl) {
            try {
                URL.revokeObjectURL(currentObjectUrl);
            } catch (e) {
                // ignore
            }
            setCurrentObjectUrl(null);
        }
    }, [showReader, currentObjectUrl]);

    // Open reader modal for a surah
    const openSurahReader = async (surah) => {
        try {
            const surahFileName = surah.name;
            console.log('[openSurahReader] Opening surah:', surahFileName);

            const fileUrl = await getSurahPdf(surahFileName);
            console.log('[openSurahReader] Got fileUrl:', fileUrl);

            const proxied = isTauri
                ? `${REMOTE_API_BASE}/api/pdf-proxy?url=${encodeURIComponent(fileUrl)}`
                : `/api/pdf-proxy?url=${encodeURIComponent(fileUrl)}`;

            console.log("[openSurahReader] PDF proxied URL:", proxied);
            setZoom(1);
            setCurrentPara(surah.number);
            setCurrentTitle(`${surah.number}. ${surah.name}`);
            setReaderUrl(proxied);
            setShowReader(true);
        } catch (error) {
            console.error("Error opening surah:", error);
            alert(`Error loading surah PDF: ${error.message || 'Unknown error'}. Please check your connection.`);
        }
    };

    const closeReader = () => {
        setShowReader(false);
        setZoom(1);
    };

    const isKanzul = (currentTitle || "").toLowerCase().includes("kanzul");

    const zoomStep = 0.25;
    const zoomMin = 0.5;
    const zoomMax = 3.0;
    const increaseZoom = () => setZoom(z => Math.min(zoomMax, +(z + zoomStep).toFixed(2)));
    const decreaseZoom = () => setZoom(z => Math.max(zoomMin, +(z - zoomStep).toFixed(2)));

    const openReader = async (p) => {
        const file = files.find((f) => f.id === p.number);
        if (!file) {
            console.error('Para file not found:', p.number);
            return;
        }
        const urlBase = file.fileUrl;

        console.log('[openReader] Para:', p.number, 'URL:', urlBase);

        const proxied = `/api/pdf-proxy?url=${encodeURIComponent(urlBase)}`;
        const proxiedFinal = isTauri
            ? `${REMOTE_API_BASE}/api/pdf-proxy?url=${encodeURIComponent(
                urlBase
            )}`
            : proxied;

        console.log('[openReader] Proxied URL:', proxiedFinal);

        // indicate loading state for this para card
        setLoadingPara(p.number);

        try {
            const storageKey = `para_pdf_${p.number}`;
            const saved = localStorage.getItem(storageKey);

            // Note: We no longer use blob URLs from localStorage cache because
            // blob URLs don't work across page navigations in mobile/Tauri environments.
            // Instead, we always fetch via the proxied URL.
            // The cache is still useful for offline scenarios but we'll handle that differently.

            // Fetch the proxied PDF and try to save it (if small enough) for offline use
            const resp = await axios.get(proxiedFinal, {
                responseType: "blob",
            });
            const blob = resp.data;

            // If blob is small enough (approx < 4.5MB), store as base64 in localStorage (async)
            const maxSaveBytes = 4.5 * 1024 * 1024; // 4.5 MB
            if (blob.size <= maxSaveBytes) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        const result = e.target.result; // data:application/pdf;base64,....
                        const payload = JSON.stringify({ type: "base64", data: result, size: blob.size, savedAt: Date.now() });
                        try {
                            localStorage.setItem(storageKey, payload);
                            console.log(`Para ${p.number} PDF saved to localStorage`);
                        } catch (err) {
                            console.warn("Failed to save para PDF to localStorage", err);
                        }
                    } catch (err) {
                        console.warn("Error converting blob to base64", err);
                    }
                };
                reader.readAsDataURL(blob);
            } else {
                // Save metadata with URL for fallback
                try {
                    localStorage.setItem(storageKey, JSON.stringify({ type: "url", url: proxiedFinal, size: blob.size, savedAt: Date.now() }));
                } catch (err) {
                    // ignore
                }
            }

            // Use the proxied URL directly for ClientPdfViewer component
            console.log("PDF proxied URL", { proxied: proxiedFinal });
            setZoom(1);
            setCurrentPara(p.number);
            setCurrentTitle(`Para ${p.number}`);
            setReaderUrl(proxiedFinal);
            setShowReader(true);
        } catch (error) {
            console.error("Error opening para:", error);
            // Swallow alert popups; errors are logged to console instead
        } finally {
            // clear loading indicator for this para
            setLoadingPara(null);
        }
    };

    const openKanzul = async () => {
        setKanzulLoading(true);
        try {
            const storageKey = `kanzul_imaan_pdf`;
            const saved = localStorage.getItem(storageKey);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && parsed.type === "base64" && parsed.data) {
                        const byteCharacters = atob(parsed.data.split(",")[1] || parsed.data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: "application/pdf" });
                        const objUrl = URL.createObjectURL(blob);
                        setCurrentObjectUrl(objUrl);
                        setZoom(1);
                        setCurrentTitle('Kanzul Imaan');
                        setReaderUrl(objUrl);
                        setShowReader(true);
                        return;
                    }
                } catch (e) {
                    console.warn("Failed to parse saved Kanzul Imaan PDF", e);
                }
            }

            const apiUrl = isTauri
                ? `${REMOTE_API_BASE}/api/kanzul`
                : '/api/kanzul';
            const { data } = await axios.get(apiUrl);
            const rawFileUrl = data.fileUrl || data.publicUrl || data.signedUrl || data.fallback;
            if (!rawFileUrl) throw new Error('No file URL returned from server');

            const proxied = isTauri
                ? `${REMOTE_API_BASE}/api/pdf-proxy?url=${encodeURIComponent(rawFileUrl)}`
                : `/api/pdf-proxy?url=${encodeURIComponent(rawFileUrl)}`;

            setZoom(1);
            setCurrentTitle('Kanzul Imaan');
            setReaderUrl(proxied);
            setShowReader(true);
        } catch (err) {
            console.error('Failed to open Kanzul Imaan', err);
            alert(err.message || 'Failed to open Kanzul Imaan PDF');
        } finally {
            setKanzulLoading(false);
        }
    };

    useEffect(() => {
        getPara()
            .then((files) => {
                setFiles(files || []);
            })
            .catch((err) => {
                console.error("Error fetching para files:", err);
            });
    }, []);

    const filteredSurahs = surahs.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.arabic.includes(search) ||
            String(s.number) === search
    );
    const filteredParas = paras.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.arabic.includes(search) ||
            String(p.number) === search
    );

    return (
        <section className="flex flex-col items-center justify-center min-h-[70vh] px-4 pb-20 animate-fade-in bg-base-100">
            <div style={{ alignSelf: "flex-start" }}>
                <button
                    className="flex items-center gap-2 mb-4 mt-2 text-lg text-primary hover:text-green-600 font-semibold"
                    onClick={() => router.push("/")}
                    aria-label="Back to Home"
                >
                    <FaAngleLeft /> Back
                </button>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                Quran Sharif
            </h2>
            <div className="glass-card p-8 max-w-4xl w-full bg-base-200 text-base-content pl-4 mx-auto">

                {/* Toggle buttons for Surah/Para/Kanzul Imaan */}
                {/* Theme Note moved to bottom; kept state and save handler only */}
                <div className="flex gap-2 mb-4">

                    <button
                        className={`btn btn-xxl ${view === "para" ? "btn-primary" : "btn-ghost"
                            }`}
                        onClick={() => setView("para")}
                    >
                        Para (Juz)
                    </button>
                    <button
                        className={`btn btn-xxl ${view === "surah" ? "btn-primary" : "btn-ghost"
                            }`}
                        onClick={() => setView("surah")}
                    >
                        Surah
                    </button>
                    <button
                        className={`btn btn-xxl ${view === "kanzul" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setView("kanzul")}
                    >
                        Kanzul Imaan
                    </button>
                </div>
                <h1 className="text-primary text-xl font-bold mb-4">Reminder Note</h1>

                <div className="mt-6 w-full">
                    <textarea
                        placeholder="Maine Aaj Kaha tak padh liya ..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full textarea textarea-bordered"
                        rows={3}
                        style={{ resize: "vertical" }}
                    />
                    <div className="flex items-center justify-end mt-2 gap-2">
                        <button className="btn btn-primary" onClick={saveThemeNote}>
                            Save
                        </button>
                        <button className="btn btn-error" onClick={clearThemeNote}>
                            Clear
                        </button>
                    </div>
                    {/* History rows: show recent saves (most recent first) */}

                    <div className="mt-3 space-y-2">
                        {noteHistory.length === 0 ? (
                            <div className="text-sm text-base-content/60 mb-3">No notes yet.</div>
                        ) : (
                            noteHistory.map((h, idx) => (
                                <div key={h.savedAt || idx} className="p-3 bg-base-100 border border-info rounded-md mb-3">
                                    <div className="text-xs text-base-content/60">{new Date(h.savedAt).toLocaleString()}</div>
                                    <div className="text-sm mt-1 text-white font-bold">{h.text}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div
                    className={
                        view === "para"
                            ? "grid grid-cols-2 sm:grid-cols-4 gap-3"
                            : "grid grid-cols-1 sm:grid-cols-2 gap-3"
                    }
                >
                    {view === "surah" ? (
                        filteredSurahs.map((s) => (
                            <div
                                key={s.number}
                                className="neumorph-card flex flex-col items-center transition hover:scale-105 active:scale-95 hover:shadow-lg active:shadow-md cursor-pointer bg-base-100 border border-primary"
                                style={{
                                    minHeight: 140,
                                    height: 140,
                                    maxHeight: 140,
                                    minWidth: 0,
                                    width: "100%",
                                    borderRadius: 12,
                                    position: "relative",
                                    padding: 12,
                                }}
                                onClick={() => openSurahReader(s)}
                            >
                                <div className="w-full flex justify-end items-start">
                                    <span className="text-xs text-primary" style={{ fontFamily: "serif" }}>
                                        ◤
                                    </span>
                                </div>
                                <span className="text-2xl mb-1 mt-2 text-center" style={{ fontWeight: 600 }}>
                                    {s.arabic}
                                </span>
                                <span className="text-lg text-white font-bold text-center w-full truncate mt-2">{s.name}</span>
                                <div className="w-full flex justify-end items-end mt-auto">
                                    <span className="text-xs text-primary" style={{ fontFamily: "serif" }}>
                                        ◢
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : view === "para" ? (
                        filteredParas.map((p) => {
                            const isLoading = loadingPara === p.number;
                            return (
                                <div
                                    key={p.number}
                                    className={`neumorph-card flex flex-col items-center justify-between transition hover:scale-105 active:scale-95 hover:shadow-lg active:shadow-md ${isLoading ? 'opacity-70 pointer-events-none' : 'cursor-pointer'} bg-base-100 border border-primary`}
                                    style={{
                                        minHeight: 140,
                                        height: 140,
                                        maxHeight: 140,
                                        minWidth: 0,
                                        width: "100%",
                                        borderRadius: 12,
                                        position: "relative",
                                        padding: 12,
                                    }}
                                    onClick={() => openReader(p)}
                                >
                                    <div className="w-full flex justify-between items-start">
                                        <span className="text-lg font-bold text-primary">{p.number}</span>
                                        <span className="text-xs text-primary" style={{ fontFamily: "serif" }}>
                                            ◤
                                        </span>
                                    </div>

                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center w-full mt-2">
                                            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                            </svg>
                                            <div className="text-sm text-primary mt-2">Opening...</div>
                                        </div>
                                    ) : (
                                        <span className="text-2xl mb-1 mt-2 text-center text-white" style={{ fontWeight: 600 }}>
                                            {p.arabic}
                                        </span>
                                    )}

                                    <div className="w-full flex justify-end items-end mt-auto">
                                        <span className="text-xs text-primary" style={{ fontFamily: "serif" }}>
                                            ◢
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-2 sm:col-span-4 flex justify-center">
                            <button
                                className={`btn btn-error ${kanzulLoading ? 'opacity-70 pointer-events-none' : ''}`}
                                onClick={openKanzul}
                                disabled={kanzulLoading}
                            >
                                {kanzulLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        <span>Opening...</span>
                                    </span>
                                ) : (
                                    'Open Kanzul Imaan'
                                )}
                            </button>
                        </div>
                    )}
                    {(view === "surah" && filteredSurahs.length === 0) ||
                        (view === "para" && filteredParas.length === 0) ? (
                        <div className="col-span-2 sm:col-span-4 text-center text-base-content/60">
                            No {view === "surah" ? "Surah" : "Para"} found.
                        </div>
                    ) : null}
                </div>
                {/* Theme Note (bottom) - plain responsive textbox with Save */}

                {/* In-app full-window reader modal (mobile/tablet/web responsive) */}
                {showReader && (
                    <div className="fixed inset-0 z-[120] bg-black bg-opacity-80">
                        <div className="flex flex-col h-screen w-screen">
                            <header className="flex items-center justify-between px-4 py-4 bg-base-200 border-b border-base-300 mt-10">
                                <div className="flex-1 min-w-0 mr-3">
                                    <span className="font-bold text-lg leading-snug block">
                                        {currentTitle || `Para ${currentPara ?? 2}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button className="btn btn-sm" onClick={decreaseZoom} aria-label="Zoom out">−</button>
                                    <div className="text-sm px-1 min-w-[44px] text-center">{Math.round(zoom * 100)}%</div>
                                    <button className="btn btn-sm" onClick={increaseZoom} aria-label="Zoom in">+</button>
                                    <button
                                        className="btn btn-sm btn-error rounded-full"
                                        onClick={closeReader}
                                    >
                                        Close
                                    </button>
                                </div>
                            </header>
                            <main className="relative flex-1 min-h-0 bg-black" style={{ overflow: 'hidden' }}>
                                <ClientPdfViewer file={readerUrl} zoom={zoom} />
                            </main>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}