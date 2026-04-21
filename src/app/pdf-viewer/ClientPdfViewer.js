"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import QuranLoader from "../../components/QuranLoader";

const isIOS = () => {
    if (typeof window === "undefined") return false;
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
};

export default function ClientPdfViewer({ file: fileProp, zoom = 1 }) {
    const router = useRouter();
    const searchParams = useSearchParams?.();
    const paramFile = searchParams ? searchParams.get("file") : null;
    const paramTitle = searchParams ? searchParams.get("title") : null;
    const file = fileProp || paramFile || "";
    const isStandalone = !fileProp;
    const title =
        paramTitle ||
        (file
            ? file.split("/").pop().replace(/\.pdf$/i, "").replace(/[-_]/g, " ")
            : "PDF Viewer");

    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [err, setErr] = useState(null);
    const [url, setUrl] = useState("");
    const [pages, setPages] = useState([]);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [renderedPages, setRenderedPages] = useState(new Set());

    const observerRef = useRef(null);
    const pageRefsRef = useRef({});
    const renderedPagesRef = useRef(new Set());
    const scrollContainerRef = useRef(null);

    // Re-center horizontal scroll whenever zoom changes so
    // the page stays in the middle, not shifted to the right.
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const id = setTimeout(() => {
            if (!scrollContainerRef.current) return;
            const { scrollWidth, clientWidth } = scrollContainerRef.current;
            if (scrollWidth > clientWidth) {
                scrollContainerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
            }
        }, 30); // wait one paint for layout to settle
        return () => clearTimeout(id);
    }, [zoom]);

    // ── PDF URL setup ──────────────────────────────────────────────────────────
    useEffect(() => {
        setErr(null);
        setLoading(true);
        setLoadingProgress(0);
        setCurrentPage(0);
        setTotalPages(0);
        if (!file) { setUrl(""); setLoading(false); return; }
        try { setUrl(decodeURIComponent(file)); } catch { setUrl(file); }
    }, [file]);

    // ── PDF loading & rendering ────────────────────────────────────────────────
    useEffect(() => {
        if (!url) return;
        let cancelled = false;

        async function loadPdf() {
            setErr(null);
            setLoading(true);
            setLoadingProgress(0);
            setPages([]);
            setRenderedPages(new Set());

            try {
                const pdfjsPath = "/pdfjs/pdf.min.mjs";
                const workerPath = "/pdfjs/pdf.worker.min.mjs";
                setLoadingProgress(10);

                let pdfjsLib;
                try {
                    const mod = await import(/* webpackIgnore: true */ pdfjsPath);
                    pdfjsLib = mod.default || mod;
                } catch {
                    throw new Error("Failed to load PDF library. Please try again.");
                }
                if (pdfjsLib.GlobalWorkerOptions) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
                }
                setLoadingProgress(30);

                const resp = await fetch(url, {
                    method: "GET",
                    credentials: "same-origin",
                    mode: "cors",
                });
                if (!resp.ok)
                    throw new Error(`Failed to fetch PDF: ${resp.status} ${resp.statusText}`);
                const arrayBuffer = await resp.arrayBuffer();
                setLoadingProgress(60);

                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                if (cancelled) return;

                const totalPagesCount = pdf.numPages;
                setTotalPages(totalPagesCount);
                setPdfDoc(pdf);

                const pageArray = new Array(totalPagesCount).fill(null);
                setPages(pageArray);
                setLoadingProgress(100);

                const initialCount = Math.min(totalPagesCount, 3);
                const newRendered = new Set();
                for (let i = 1; i <= initialCount; i++) {
                    try {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 1.5 });
                        const canvas = document.createElement("canvas");
                        canvas.width = Math.floor(viewport.width);
                        canvas.height = Math.floor(viewport.height);
                        await page
                            .render({ canvasContext: canvas.getContext("2d"), viewport })
                            .promise;
                        pageArray[i - 1] = canvas.toDataURL("image/png");
                        newRendered.add(i);
                    } catch (pe) {
                        console.error(`Error rendering page ${i}:`, pe);
                    }
                }

                pageRefsRef.current = {};
                setPages([...pageArray]);
                setRenderedPages(newRendered);
                renderedPagesRef.current = newRendered;
                setCurrentPage(initialCount >= 1 ? 1 : 0);
            } catch (e) {
                console.error("PDF render error:", e);
                setErr(e.message || String(e));
            } finally {
                setLoading(false);
            }
        }

        loadPdf();
        return () => { cancelled = true; };
    }, [url]);

    // ── Lazy page rendering ────────────────────────────────────────────────────
    const renderPage = useCallback(
        async (pageNum) => {
            if (!pdfDoc || renderedPagesRef.current.has(pageNum)) return;
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement("canvas");
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                await page
                    .render({ canvasContext: canvas.getContext("2d"), viewport })
                    .promise;
                const dataUrl = canvas.toDataURL("image/png");
                setPages((prev) => {
                    const n = [...prev];
                    n[pageNum - 1] = dataUrl;
                    return n;
                });
                setRenderedPages((prev) => {
                    const next = new Set(prev);
                    next.add(pageNum);
                    renderedPagesRef.current = next;
                    return next;
                });
            } catch (e) {
                console.error(`Error rendering page ${pageNum}:`, e);
            }
        },
        [pdfDoc]
    );

    // ── Intersection observer for lazy loading ─────────────────────────────────
    useEffect(() => {
        if (!pdfDoc) return;
        observerRef.current = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageNum = parseInt(entry.target.dataset.page);
                        renderPage(pageNum);
                        setCurrentPage(pageNum);
                    }
                }),
            { rootMargin: "500px" }
        );
        return () => observerRef.current?.disconnect();
    }, [pdfDoc, totalPages, renderPage]);

    useEffect(() => {
        if (!observerRef.current) return;
        Object.values(pageRefsRef.current).forEach(
            (el) => el && observerRef.current.observe(el)
        );
    }, [pages, totalPages]);

    // ── Render ─────────────────────────────────────────────────────────────────
    if (!file) {
        return (
            <div className="p-6 text-center text-base-content/60">
                No file specified.
            </div>
        );
    }

    // zoom is applied as image width so layout reflows naturally — no page overlap
    const imageWidth = `${Math.round(zoom * 100)}%`;
    const isZoomed = zoom > 1.01;

    return (
        <div
            style={{
                width: "100%",
                height: isStandalone ? "100svh" : "100%",
                background: "#000",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Standalone header (when opened as a full /pdf-viewer page) */}
            {isStandalone && (
                <header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        background: "var(--fallback-b2,oklch(var(--b2)/1))",
                        borderBottom: "1px solid var(--fallback-b3,oklch(var(--b3)/1))",
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontWeight: 600,
                            fontSize: 17,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginRight: 8,
                        }}
                    >
                        {title}
                    </span>
                    <button
                        className="btn btn-sm btn-error"
                        style={{ flexShrink: 0 }}
                        onClick={() => router.back()}
                        aria-label="Go back"
                    >
                        Close
                    </button>
                </header>
            )}

            <QuranLoader
                isVisible={loading}
                progress={loadingProgress}
                title={
                    loadingProgress < 30
                        ? "Loading Quran PDF..."
                        : loadingProgress < 40
                        ? "Preparing Document..."
                        : "Rendering Pages..."
                }
                subtitle={
                    loadingProgress < 30
                        ? "Please wait while we fetch the PDF file"
                        : loadingProgress < 40
                        ? "Processing the document for viewing"
                        : totalPages > 0
                        ? `Rendering page ${currentPage} of ${totalPages}`
                        : "Preparing pages for rendering..."
                }
            />

            {err ? (
                <div style={{ padding: 24, textAlign: "center" }}>
                    <div style={{ color: "#f87171", marginBottom: 16 }}>
                        <p style={{ fontWeight: 600, marginBottom: 8 }}>
                            Unable to display PDF
                        </p>
                        <p style={{ fontSize: 14 }}>{err}</p>
                        {isIOS() && (
                            <p style={{ fontSize: 14, marginTop: 8 }}>
                                iOS Safari has limitations with inline PDF preview. Use the
                                button below.
                            </p>
                        )}
                    </div>
                    <a
                        className="btn btn-primary"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Open PDF in {isIOS() ? "Safari" : "External Viewer"}
                    </a>
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowX: isZoomed ? "auto" : "hidden",
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch",
                        background: "#000",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: isZoomed ? imageWidth : "100%",
                        }}
                    >
                        {pages.map((dataUrl, idx) => (
                            <div
                                key={idx}
                                ref={(el) => (pageRefsRef.current[idx] = el)}
                                data-page={idx + 1}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#000",
                                    minHeight: dataUrl ? "auto" : "100vh",
                                }}
                            >
                                {dataUrl ? (
                                    <img
                                        src={dataUrl}
                                        alt={`page-${idx + 1}`}
                                        style={{
                                            // width drives zoom — layout reflows so pages never overlap
                                            width: imageWidth,
                                            height: "auto",
                                            display: "block",
                                        }}
                                        draggable={false}
                                    />
                                ) : (
                                    <div
                                        style={{ color: "rgba(255,255,255,0.3)", padding: 24 }}
                                    >
                                        Page {idx + 1}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}