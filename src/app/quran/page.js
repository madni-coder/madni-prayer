"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaAngleLeft } from "react-icons/fa";
import fetchFromApi from '../../utils/fetchFromApi';

// Sample Surah data (in real app, fetch from API or static JSON)
const surahs = [
    { number: 1, name: "Al-Fatiha", arabic: "الفاتحة", ayahs: 7 },
    { number: 2, name: "Al-Baqarah", arabic: "البقرة", ayahs: 286 },
    { number: 3, name: "Al-Imran", arabic: "آل عمران", ayahs: 200 },
    // ...add more or fetch dynamically
];

// Static Para (Juz) data: 1-30 with custom names, Arabic, and Total Ruku (from screenshot)
const paraNames = [
    { name: "Alif Laam Meem", arabic: "ٱلۤمّ", ruku: 17 },
    { name: "Sayaqool", arabic: "سَيَقُولُ", ruku: 16 },
    { name: "Tilka’r Rusul", arabic: "تِلْكَ ٱلرُّسُلُ", ruku: 17 },
    { name: "Lan Tanaaloo", arabic: "لَن تَنَالُواْ", ruku: 14 },
    { name: "Wa’l Mohsanat", arabic: "وَٱلْمُحْصَنَاتُ", ruku: 17 },
    {
        name: "Ya Ayyuha’lladhina Aamanu",
        arabic: "لَا يُحِبُّ ٱللهُ",
        ruku: 16,
    },
    { name: "Wa Iza Sami‘u", arabic: "وَإِذَا سَمِعُواْ", ruku: 19 },
    { name: "Wa Lau Annana", arabic: "وَلَوْ أَنَّنَا", ruku: 17 },
    { name: "Qad Aflaha", arabic: "قَالَ ٱلْمَلَأُ", ruku: 18 },
    { name: "Wa A‘lamu", arabic: "وَٱعْلَمُواْ", ruku: 17 },
    {
        name: "Ya Ayyuha’lladhina Aamanu La Tattakhizu",
        arabic: "يتعذرون",
        ruku: 16,
    },
    { name: "Wa Mamin Daabbah", arabic: "وَمَا مِن دَآبَّةٍ", ruku: 17 },
    { name: "Wa Ma Ubrioo", arabic: "وَمَآ أُبَرِّئُ", ruku: 19 },
    { name: "Rubama", arabic: "رُّبَمَا", ruku: 16 },
    { name: "Subhanalladhi", arabic: "سُبْحَٰنَ ٱلَّذِى", ruku: 15 },
    { name: "Qala Alam", arabic: "قَالَ أَلَمْ", ruku: 16 },
    { name: "Iqtarabat", arabic: "ٱقْتَرَبَتْ", ruku: 16 },
    { name: "Qadd Aflaha", arabic: "قَدْ أَفْلَحَ", ruku: 17 },
    {
        name: "Wa Qala’lladhina La Yarjuna",
        arabic: "وَقَالَ ٱلَّذِينَ ",
        ruku: 19,
    },
    { name: "A‘mman Khalaq", arabic: "أَمَّنْ خَلَقَ", ruku: 19 },
    { name: "Utlu Ma Oohiya", arabic: "ٱتْلُ مَآ أُوحِىَ", ruku: 18 },
    { name: "Wa Manyaqnut", arabic: "وَمَن يَقْنُتْ", ruku: 17 },
    { name: "Wa Mali", arabic: "وَمَا لِىَ", ruku: 16 },
    { name: "Faman Azlam", arabic: "فَمَنْ أَظْلَمُ", ruku: 19 },
    { name: "Elahe Yuruddu", arabic: "إِلَيْهِ يُرَدُّ", ruku: 17 },
    { name: "Ha’a Meem", arabic: "حم", ruku: 19 },
    { name: "Qala Fama Khatbukum", arabic: "قَالَ فَمَا خَطْبُكُم", ruku: 20 },
    { name: "Qadd Sami‘a’llahu", arabic: "قَدْ سَمِعَ ٱللَّهُ", ruku: 20 },
    { name: "Tabarakalladhi", arabic: "تَبَارَكَ ٱلَّذِى", ruku: 24 },
    { name: "‘Amma Yatasa’aloon", arabic: "عَمَّ ", ruku: 39 },
];

const paras = paraNames.map((p, i) => ({
    number: i + 1,
    name: p.name,
    arabic: p.arabic,
    ruku: p.ruku,
}));

// GET API function referencing route.js
async function getPara() {
    try {
        const res = await fetchFromApi("/api/api-quran");
        if (!res.ok) throw new Error("Failed to fetch para files");
        const data = await res.json();
        // Return files array as in route.js
        return data.files;
    } catch (err) {
        throw new Error(err.message);
    }
}

export default function Quran() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [view, setView] = useState("para"); // "para" is now default
    const [files, setFiles] = useState([]); // store API files
    const [showReader, setShowReader] = useState(false);
    const [currentPara, setCurrentPara] = useState(null);
    const [readerUrl, setReaderUrl] = useState("");
    const [isIframeLoading, setIsIframeLoading] = useState(true);

    // keyboard handlers for reader modal + lock body scroll while open
    useEffect(() => {
        if (!showReader) return;
        const onKey = (e) => {
            if (e.key === "Escape") setShowReader(false);
        };
        window.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [showReader]);

    // Open reader modal for a para
    const openReader = (p) => {
        // Find file for this para from API response
        const file = files.find((f) => f.id === p.number);
        if (!file) return;
        // Use fileUrl from API
        const urlBase = file.fileUrl;
        const url = `${urlBase}#toolbar=0&navpanes=0&scrollbar=0`;

        // If on a mobile device, open the PDF in a new tab/window instead of embedding
        // Many mobile browsers show a centered 'Open' button when trying to embed PDFs; opening
        // in a new tab provides a better direct experience for mobile users.
        const ua =
            typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(
            ua
        );
        if (isMobile) {
            // Open the raw file URL in a new tab (avoid fragment which some browsers ignore for direct open)
            window.open(urlBase, "_blank", "noopener,noreferrer");
            return;
        }

        // Desktop: show the in-app iframe reader
        setCurrentPara(p.number);
        setIsIframeLoading(true);
        setReaderUrl(url);
        setShowReader(true);
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

    // Filter logic for Surah and Para
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
        <section className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in bg-base-100">
            <button
                className="flex items-center gap-2 mb-4 text-lg text-primary hover:text-green-600 font-semibold"
                onClick={() => router.push("/")}
                aria-label="Back to Home"
                style={{ alignSelf: "flex-start" }}
            >
                <FaAngleLeft /> Back
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                Quran
            </h2>
            <div className="glass-card p-6 max-w-2xl w-full bg-base-200 text-base-content">
                {/* Toggle buttons for Surah/Para */}
                <div className="flex gap-2 mb-4">
                    <button
                        className={`btn btn-xxl ${
                            view === "para" ? "btn-primary" : "btn-ghost"
                        }`}
                        onClick={() => setView("para")}
                    >
                        Para (Juz)
                    </button>
                    <button
                        className={`btn btn-xxl ${
                            view === "surah" ? "btn-primary" : "btn-ghost"
                        }`}
                        onClick={() => setView("surah")}
                    >
                        Surah
                    </button>
                </div>
                <input
                    className="input input-bordered w-full mb-4"
                    placeholder={`Search ${
                        view === "surah" ? "Surah" : "Para"
                    } by name, number, or Arabic...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div
                    className={
                        view === "para"
                            ? "grid grid-cols-2 sm:grid-cols-4 gap-3"
                            : "grid grid-cols-1 sm:grid-cols-2 gap-3"
                    }
                >
                    {view === "surah"
                        ? filteredSurahs.map((s) => (
                              <div
                                  key={s.number}
                                  className="neumorph-card p-4 flex flex-col items-center transition hover:scale-105 active:scale-95 hover:shadow-lg active:shadow-md cursor-pointer bg-base-100 border border-base-300"
                              >
                                  <span className="text-lg font-bold text-primary">
                                      {s.number}. {s.name}
                                  </span>
                                  <span className="text-2xl mb-1">
                                      {s.arabic}
                                  </span>
                                  <span className="text-xs text-base-content/60">
                                      Ayahs: {s.ayahs}
                                  </span>
                              </div>
                          ))
                        : filteredParas.map((p) => {
                              // Find file for this para
                              const file = files.find((f) => f.id === p.number);
                              return (
                                  <div
                                      key={p.number}
                                      className="neumorph-card flex flex-col items-center justify-between transition hover:scale-105 active:scale-95 hover:shadow-lg active:shadow-md cursor-pointer bg-base-100 border border-primary"
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
                                          <span className="text-base font-bold text-primary">
                                              {p.number}
                                          </span>
                                          {/* Decorative corner, optional */}
                                          <span
                                              className="text-xs text-primary"
                                              style={{ fontFamily: "serif" }}
                                          >
                                              ◤
                                          </span>
                                      </div>
                                      <span
                                          className="text-2xl mb-1 mt-2 text-center text-white"
                                          style={{ fontWeight: 600 }}
                                      >
                                          {p.arabic}
                                      </span>
                                      <div className="w-full flex justify-between items-end mt-auto">
                                          <span className="text-xs text-primary">
                                              {p.ruku}
                                          </span>
                                          <span className="bg-primary text-primary-content text-xs px-2 py-1 rounded-full ml-1">
                                              Total Ruku
                                          </span>
                                          {/* Decorative corner, optional */}
                                          <span
                                              className="text-xs text-primary"
                                              style={{ fontFamily: "serif" }}
                                          >
                                              ◢
                                          </span>
                                      </div>
                                  </div>
                              );
                          })}
                    {(view === "surah" && filteredSurahs.length === 0) ||
                    (view === "para" && filteredParas.length === 0) ? (
                        <div className="col-span-2 sm:col-span-4 text-center text-base-content/60">
                            No {view === "surah" ? "Surah" : "Para"} found.
                        </div>
                    ) : null}
                </div>
                {/* In-app full-window reader modal (mobile/tablet/web responsive) */}
                {showReader && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-80">
                        <div className="flex flex-col h-screen w-screen">
                            <header className="flex items-center justify-between px-4 py-3 bg-base-200 border-b border-base-300">
                                <div>
                                    <span className="font-semibold text-lg">
                                        Para {currentPara ?? 2}
                                    </span>
                                </div>
                                <div>
                                    <button
                                        className="btn btn-sm btn-error"
                                        onClick={() => setShowReader(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </header>
                            <main className="relative flex-1 overflow-hidden bg-base-100">
                                <iframe
                                    src={readerUrl}
                                    className="w-full h-full min-h-0"
                                    title={`Para ${currentPara} preview`}
                                    onLoad={() => setIsIframeLoading(false)}
                                />
                            </main>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
