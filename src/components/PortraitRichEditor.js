"use client";

import React, { useRef, useState } from "react";
import { useEffect } from "react";

// Portrait-sized rich editor that supports background colors and gradients.
export default function PortraitRichEditor({ onImage }) {
    const editorRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [bg, setBg] = useState("linear-gradient(180deg,#fff,#f8fafc)");
    const [imgSrc, setImgSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [imageSize, setImageSize] = useState("medium"); // default inserted image size
    const [isTooLarge, setIsTooLarge] = useState(false);
    const [sizeError, setSizeError] = useState("");
    const [fontSize, setFontSize] = useState(18); // editor font size in px
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        justifyCenter: false,
    });

    const MIN_FONT = 12;
    const MAX_FONT = 32;
    const STEP_FONT = 2;

    const presets = [
        "linear-gradient(180deg,#fff,#f8fafc)",
        "linear-gradient(180deg,#fde68a,#fca5a5)",
        "linear-gradient(180deg,#d8b4fe,#93c5fd)",
        "linear-gradient(180deg,#bbf7d0,#86efac)",
        "linear-gradient(180deg,#fef3c7,#fed7aa)",
        "linear-gradient(180deg,#f0abfc,#c4b5fd)",
    ];

    function applyFormat(command, value = null) {
        // Prevent insertion of large content while overflowed
        if (isTooLarge && command === "insertHTML") {
            setSizeError(
                "Content too large to insert more items. Remove some content first."
            );
            return;
        }
        document.execCommand(command, false, value);
        editorRef.current && editorRef.current.focus();

        // Update active states after applying format
        setTimeout(updateActiveFormats, 10);
    }

    // Check which formatting options are currently active at cursor position
    function updateActiveFormats() {
        if (!editorRef.current) return;

        try {
            const newActiveFormats = {
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                underline: document.queryCommandState("underline"),
                justifyCenter: document.queryCommandState("justifyCenter"),
            };

            setActiveFormats(newActiveFormats);
        } catch (err) {
            // Ignore errors - some browsers might not support queryCommandState for all commands
            console.warn("Error checking format states:", err);
        }
    }

    // Handle selection change to update active format states
    function handleSelectionChange() {
        updateActiveFormats();
    }

    // Insert an <img> at the current caret / selection
    async function insertImageFromFile(file) {
        if (isTooLarge) {
            setSizeError(
                "Cannot insert image: content already exceeds available space. Remove some content first."
            );
            return;
        }
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target.result;
            // Build a constrained image element. We intentionally do not let it touch both edges:
            // padding: editor has 20px padding so we set max-width to calc(100% - 40px) to avoid edge-to-edge.
            const sizeMap = {
                small: "40%",
                medium: "70%",
                large: "90%",
            };

            const chosen = sizeMap[imageSize] || sizeMap.medium;

            // Use a wrapper div around the image to allow centering and responsive behavior
            const html =
                `<div class=\"portrait-image-wrap\" contenteditable=\"false\" style=\"display:flex;justify-content:center;position:relative;\">` +
                `<div style=\"position:relative;display:inline-block;\">` +
                `<img src=\"${src}\" alt=\"inserted image\" style=\"max-width:${chosen};width:auto;height:auto;border-radius:8px;object-fit:contain;\" />` +
                `<button class=\"image-delete-btn\" onclick=\"this.closest('.portrait-image-wrap').remove()\" style=\"position:absolute;top:-8px;right:-8px;width:20px;height:20px;border-radius:50%;background:#ef4444;color:white;border:none;cursor:pointer;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);z-index:10;\" title=\"Remove image\">×</button>` +
                `</div>` +
                `</div><div><br></div>`;

            // Insert the HTML at the caret
            applyFormat("insertHTML", html);

            // After inserting, attach load listener to the last inserted image so we can re-check size
            // Small timeout to ensure DOM updated
            setTimeout(() => {
                try {
                    const imgs = editorRef.current.querySelectorAll(
                        ".portrait-image-wrap img"
                    );
                    if (imgs && imgs.length) {
                        const last = imgs[imgs.length - 1];
                        // If it's a data URL image it'll load; attach onload to re-evaluate
                        last.onload = () => {
                            checkContentSize();
                        };
                    }

                    // Attach event listeners to delete buttons
                    const deleteButtons =
                        editorRef.current.querySelectorAll(".image-delete-btn");
                    deleteButtons.forEach((btn) => {
                        btn.onclick = function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const wrapper = this.closest(
                                ".portrait-image-wrap"
                            );
                            if (wrapper) {
                                wrapper.remove();
                                checkContentSize();
                                updateActiveFormats();
                            }
                        };
                    });
                } catch (err) {
                    // ignore
                }
                // Re-check right away as well
                checkContentSize();
            }, 50);
        };
        reader.readAsDataURL(file);
    }

    // Change size of the currently selected image wrapper (if any)
    function changeSelectedImageSize(sizeKey) {
        const sizeMap = { small: "40%", medium: "70%", large: "90%" };
        const newSize = sizeMap[sizeKey] || sizeMap.medium;

        // First, try to change selected image
        const sel = window.getSelection();
        let selectedImageChanged = false;

        if (sel && sel.anchorNode) {
            // Walk up from anchorNode to find a wrapper with class portrait-image-wrap
            let node =
                sel.anchorNode.nodeType === Node.ELEMENT_NODE
                    ? sel.anchorNode
                    : sel.anchorNode.parentElement;
            while (node && node !== editorRef.current) {
                if (
                    node.classList &&
                    node.classList.contains("portrait-image-wrap")
                )
                    break;
                node = node.parentElement;
            }
            if (
                node &&
                node.classList &&
                node.classList.contains("portrait-image-wrap")
            ) {
                const img = node.querySelector("img");
                if (img) {
                    img.style.maxWidth = newSize;
                    selectedImageChanged = true;
                }
            }
        }

        // If no image was selected, change the most recently inserted image
        if (!selectedImageChanged && editorRef.current) {
            const allImages = editorRef.current.querySelectorAll(
                ".portrait-image-wrap img"
            );
            if (allImages.length > 0) {
                const lastImage = allImages[allImages.length - 1];
                lastImage.style.maxWidth = newSize;
            }
        }

        // After resizing, re-check content size
        setTimeout(checkContentSize, 20);
    }

    useEffect(() => {
        // initial check and whenever images/sizes change
        checkContentSize();
        // also attach a resize observer to re-check if container size changes
        let ro;
        try {
            if (containerRef.current && window.ResizeObserver) {
                ro = new ResizeObserver(() => checkContentSize());
                ro.observe(containerRef.current);
            }
        } catch (err) {
            /* ignore */
        }

        // Add event listeners for selection changes
        const handleDocumentSelectionChange = () => {
            // Only update if the selection is within our editor
            const selection = window.getSelection();
            if (
                selection &&
                selection.anchorNode &&
                editorRef.current &&
                editorRef.current.contains(selection.anchorNode)
            ) {
                handleSelectionChange();
            }
        };

        document.addEventListener(
            "selectionchange",
            handleDocumentSelectionChange
        );

        return () => {
            try {
                ro && ro.disconnect();
            } catch (e) {}
            document.removeEventListener(
                "selectionchange",
                handleDocumentSelectionChange
            );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imgSrc, imageSize]);

    // Re-evaluate content size when font size changes
    useEffect(() => {
        // delay slightly to allow layout to settle
        const t = setTimeout(checkContentSize, 30);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fontSize]);

    // Check whether the editable content overflows its visible height (would need scrollbar)
    function checkContentSize() {
        try {
            const el = editorRef.current;
            if (!el) return;
            const scrollH = el.scrollHeight;
            const clientH = el.clientHeight;
            if (scrollH > clientH + 1) {
                setIsTooLarge(true);
                setSizeError(
                    "Content exceeds available space. Remove text or reduce image sizes."
                );
            } else {
                if (isTooLarge) {
                    setIsTooLarge(false);
                    setSizeError("");
                }
            }
        } catch (err) {
            console.warn("checkContentSize error", err);
        }
    }

    // Prevent typing/inserting when content is too large, but allow deletion and navigation
    function handleKeyDown(e) {
        if (!isTooLarge) {
            // Update format states on key events that might change formatting
            setTimeout(updateActiveFormats, 10);
            return;
        }
        const allowed = [
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
        ];
        // Allow Ctrl/Meta combos (copy/paste) for navigation and deletion
        if (e.ctrlKey || e.metaKey) return;
        if (!allowed.includes(e.key)) {
            e.preventDefault();
            setSizeError(
                "Content is too large — remove content or reduce images before adding more."
            );
        }
    }

    function handlePaste(e) {
        if (isTooLarge) {
            e.preventDefault();
            setSizeError(
                "Cannot paste: content already exceeds available space. Remove some content first."
            );
        }
    }

    async function handleSubmit() {
        if (!containerRef.current) return;
        setIsLoading(true);
        try {
            // set white background to capture properly
            const style = {
                background: bg,
                width: "360px",
                height: "480px",
            };

            const node = containerRef.current;
            // Inline DOM -> PNG renderer using SVG foreignObject.
            // This avoids requiring an extra dependency during build/runtime.
            const dataUrl = await (async function nodeToPng(
                el,
                width = 360,
                height = 480
            ) {
                // Clone element so we don't mutate original
                const cloned = el.cloneNode(true);

                // Make sure the clone has an explicit size so the exported SVG matches
                cloned.style.width = width + "px";
                cloned.style.height = height + "px";

                // Inline computed styles for the clone and its children so the SVG foreignObject renders correctly
                function inlineStyles(node) {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    const el = node;
                    const computed = window.getComputedStyle(el);
                    let styleString = "";
                    for (let i = 0; i < computed.length; i++) {
                        const prop = computed[i];
                        const val = computed.getPropertyValue(prop);
                        styleString += `${prop}:${val};`;
                    }
                    // Preserve existing inline style too
                    el.setAttribute(
                        "style",
                        el.getAttribute("style")
                            ? el.getAttribute("style") + ";" + styleString
                            : styleString
                    );
                    // Recurse
                    for (let i = 0; i < el.children.length; i++) {
                        inlineStyles(el.children[i]);
                    }
                }

                inlineStyles(cloned);

                // Serialize the node's markup
                const serializer = new XMLSerializer();
                const serialized = serializer.serializeToString(cloned);

                // Build the SVG containing the node as a foreignObject
                const svg =
                    `<?xml version="1.0" encoding="utf-8"?>\n` +
                    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>` +
                    `<foreignObject width='100%' height='100%'>${serialized}</foreignObject>` +
                    `</svg>`;

                const svgData =
                    "data:image/svg+xml;charset=utf-8," +
                    encodeURIComponent(svg);

                // Create image from SVG and draw to canvas
                const img = new Image();
                // Ensure image loads with correct sizes
                img.width = width;
                img.height = height;

                // Use a promise to wait for image load
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve(true);
                    img.onerror = (e) => {
                        // still resolve; we'll attempt to draw whatever we have
                        console.warn("SVG image load error", e);
                        resolve(false);
                    };
                    img.src = svgData;
                });

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                // Fill transparent background so gradients remain visible
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                return canvas.toDataURL("image/png");
            })(node, 360, 640);
            setImgSrc(dataUrl);

            // Try to upload the generated PNG to the server endpoint
            try {
                // Convert data URL to Blob
                const blob = await (await fetch(dataUrl)).blob();
                const fileName = `notice_${Date.now()}.png`;
                const file = new File([blob], fileName, {
                    type: blob.type || "image/png",
                });

                const formData = new FormData();
                formData.append("image", file);

                const resp = await fetch("/api/api-notice", {
                    method: "POST",
                    body: formData,
                });

                if (!resp.ok) {
                    const errBody = await resp.json().catch(() => ({}));
                    throw new Error(
                        errBody.error || resp.statusText || "Upload failed"
                    );
                }

                const body = await resp.json();
                // Pass server response to onImage so caller can use server URLs
                onImage && onImage(body);
            } catch (uploadErr) {
                console.warn(
                    "Upload failed, falling back to local preview:",
                    uploadErr
                );
                // Fallback: still provide local data URL to caller
                onImage && onImage(dataUrl);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to create image: " + err?.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="portrait-rich-editor ">
            <div className="controls" style={{ marginBottom: 12 }}>
                {/* Text formatting tools */}
                <div className="toolbar-section">
                    <div className="toolbar-label">Text Formatting</div>
                    <div className="toolbar-group">
                        <button
                            onClick={() => applyFormat("bold")}
                            className={`toolbar-btn ${
                                activeFormats.bold ? "active" : ""
                            }`}
                            title="Bold"
                        >
                            <span className="btn-text">B</span>
                        </button>
                        <button
                            onClick={() => applyFormat("italic")}
                            className={`toolbar-btn ${
                                activeFormats.italic ? "active" : ""
                            }`}
                            title="Italic"
                        >
                            <span className="btn-text">I</span>
                        </button>
                        <button
                            onClick={() => applyFormat("underline")}
                            className={`toolbar-btn ${
                                activeFormats.underline ? "active" : ""
                            }`}
                            title="Underline"
                        >
                            <span className="btn-text">U</span>
                        </button>
                        <button
                            onClick={() => {
                                // Toggle center alignment - if already centered, align left
                                if (activeFormats.justifyCenter) {
                                    applyFormat("justifyLeft");
                                } else {
                                    applyFormat("justifyCenter");
                                }
                            }}
                            className={`toolbar-btn ${
                                activeFormats.justifyCenter ? "active" : ""
                            }`}
                            title="Center Align"
                        >
                            <span className="btn-text">Center</span>
                        </button>
                        <button
                            onClick={() => applyFormat("undo")}
                            className="toolbar-btn"
                            title="Undo"
                        >
                            <span className="btn-text">↶</span>
                        </button>
                    </div>
                </div>

                {/* Font size controls */}
                <div className="toolbar-section">
                    <div className="toolbar-label">Font Size</div>
                    <div className="toolbar-group font-size-group">
                        <button
                            type="button"
                            title="Decrease font size"
                            aria-label="Decrease font size"
                            className="toolbar-btn"
                            onClick={() =>
                                setFontSize((s) =>
                                    Math.max(MIN_FONT, s - STEP_FONT)
                                )
                            }
                            disabled={fontSize <= MIN_FONT}
                        >
                            <span className="btn-text">A-</span>
                        </button>
                        <div className="font-size-display">{fontSize}px</div>
                        <button
                            type="button"
                            title="Increase font size"
                            aria-label="Increase font size"
                            className="toolbar-btn"
                            onClick={() =>
                                setFontSize((s) =>
                                    Math.min(MAX_FONT, s + STEP_FONT)
                                )
                            }
                            disabled={fontSize >= MAX_FONT}
                        >
                            <span className="btn-text">A+</span>
                        </button>
                    </div>
                </div>

                {/* Image insertion controls */}
                <div className="toolbar-section">
                    <div className="toolbar-label">Image Controls</div>
                    <div className="toolbar-group">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                const f = e.target.files && e.target.files[0];
                                if (f) insertImageFromFile(f);
                                // reset input so same file can be picked again
                                e.target.value = null;
                            }}
                        />
                        <button
                            className="toolbar-btn image-btn"
                            onClick={() =>
                                fileInputRef.current &&
                                fileInputRef.current.click()
                            }
                            type="button"
                            title="Insert Image"
                        >
                            <span className="btn-text">Insert Image</span>
                        </button>

                        <div className="size-controls">
                            <span className="size-label">Resize Images:</span>
                            {[
                                ["small", "S"],
                                ["medium", "M"],
                                ["large", "L"],
                            ].map(([k, label]) => (
                                <button
                                    key={k}
                                    className={`toolbar-btn size-btn ${
                                        imageSize === k ? "active" : ""
                                    }`}
                                    onClick={() => {
                                        setImageSize(k);
                                        // also try to change selected image size
                                        changeSelectedImageSize(k);
                                    }}
                                    title={`${
                                        k.charAt(0).toUpperCase() + k.slice(1)
                                    } size - Click to resize images`}
                                >
                                    <span className="btn-text">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Background color presets */}
                <div className="toolbar-section">
                    <div className="toolbar-label">Background Colors</div>
                    <div className="toolbar-group color-group">
                        {presets.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => setBg(p)}
                                title={`Background preset ${i + 1}`}
                                className={`color-preset ${
                                    p === bg ? "active" : ""
                                }`}
                                style={{
                                    background: p,
                                }}
                            />
                        ))}

                        <input
                            type="color"
                            onChange={(e) => setBg(e.target.value)}
                            aria-label="Pick custom background color"
                            className="color-picker"
                            title="Custom color picker"
                        />
                    </div>
                </div>
            </div>

            {/* Visible size error banner */}
            {sizeError ? (
                <div
                    role="alert"
                    aria-live="assertive"
                    style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #fca5a5",
                        padding: "8px 12px",
                        borderRadius: 8,
                        marginBottom: 12,
                    }}
                >
                    {sizeError}
                </div>
            ) : null}

            <div
                ref={containerRef}
                style={{
                    width: 360,
                    height: 480,
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                    background: bg,
                    position: "relative",
                }}
            >
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                        checkContentSize();
                        updateActiveFormats();
                    }}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onMouseUp={updateActiveFormats}
                    onKeyUp={updateActiveFormats}
                    style={{
                        padding: 55,
                        width: "100%",
                        height: "100%",
                        outline: "none",
                        color: "#111827",
                        fontFamily:
                            "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
                        fontSize: fontSize,
                        overflow: "auto",
                        WebkitTextSizeAdjust: "none",
                        boxSizing: "border-box",
                        background: "transparent",
                    }}
                />
            </div>

            {/* Initialize content size check once mounted */}

            <style jsx>{`
                .portrait-rich-editor {
                    font-family: "Inter", sans-serif;
                }

                .controls {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }

                .toolbar-section {
                    margin-bottom: 10px;
                }

                .toolbar-section:last-child {
                    margin-bottom: 0;
                }

                .toolbar-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .toolbar-group {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .toolbar-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 32px;
                    height: 32px;
                    padding: 6px 10px;
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 13px;
                    font-weight: 500;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .toolbar-btn:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }

                .toolbar-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .toolbar-btn:disabled {
                    background: #f9fafb;
                    color: #9ca3af;
                    cursor: not-allowed;
                    border-color: #e5e7eb;
                    transform: none;
                    box-shadow: none;
                }

                .toolbar-btn.active {
                    background: #3b82f6;
                    color: white;
                    border-color: #2563eb;
                    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
                }

                .toolbar-btn.active:hover {
                    background: #2563eb;
                    border-color: #1d4ed8;
                }

                .btn-text {
                    color: #1f2937;
                    font-weight: 600;
                }

                .toolbar-btn.active .btn-text {
                    color: white;
                }

                .toolbar-btn:disabled .btn-text {
                    color: #9ca3af;
                }

                .image-btn {
                    background: #10b981;
                    color: white;
                    border-color: #059669;
                    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
                }

                .image-btn .btn-text {
                    color: white;
                }

                .image-btn:hover {
                    background: #059669;
                    border-color: #047857;
                    box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4);
                }

                .font-size-group {
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 3px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .font-size-display {
                    font-size: 11px;
                    font-weight: 600;
                    color: #374151;
                    min-width: 36px;
                    text-align: center;
                    padding: 0 6px;
                    background: #f9fafb;
                    border-radius: 4px;
                    border: 1px solid #e5e7eb;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .size-controls {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 3px 6px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .size-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #6b7280;
                    margin-right: 3px;
                }

                .size-btn {
                    min-width: 26px;
                    height: 26px;
                    border-radius: 4px;
                }

                .color-group {
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 6px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .color-preset {
                    width: 36px;
                    height: 26px;
                    border-radius: 6px;
                    border: 2px solid #e5e7eb;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .color-preset:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                    border-color: #9ca3af;
                }

                .color-preset.active {
                    border-color: #3b82f6;
                    border-width: 3px;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                .color-picker {
                    width: 36px;
                    height: 26px;
                    border: 2px solid #d1d5db;
                    border-radius: 6px;
                    cursor: pointer;
                    background: transparent;
                    padding: 0;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                }

                .color-picker:hover {
                    border-color: #9ca3af;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }

                .submit-btn {
                    width: 100%;
                    height: 42px;
                    background: linear-gradient(
                        135deg,
                        #667eea 0%,
                        #764ba2 100%
                    );
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    margin-top: 12px;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
                }

                .submit-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .submit-btn:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .submit-btn .btn-text {
                    color: white;
                }

                .output-section {
                    margin-top: 12px;
                }

                .output-container {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }

                .output-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .output-image {
                    width: 180px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s ease;
                }

                .output-image:hover {
                    transform: scale(1.02);
                }

                .portrait-image-wrap img {
                    display: block;
                    max-width: 70%;
                    width: auto;
                    height: auto;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .portrait-image-wrap img:hover {
                    transform: scale(1.02);
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                    border: 2px solid #3b82f6;
                }

                .portrait-image-wrap {
                    display: flex;
                    justify-content: center;
                    margin: 8px 0;
                    position: relative;
                }

                .image-delete-btn {
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .portrait-image-wrap:hover .image-delete-btn {
                    opacity: 1;
                }

                .image-delete-btn:hover {
                    background: #dc2626 !important;
                    transform: scale(1.1);
                }
            `}</style>

            <div className="output-section">
                {imgSrc ? (
                    <div className="output-container">
                        <h4 className="output-title">Generated Image</h4>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imgSrc}
                            alt="notice image"
                            className="output-image"
                        />
                    </div>
                ) : null}
            </div>
            <button
                onClick={handleSubmit}
                className="submit-btn"
                disabled={isLoading || isTooLarge}
            >
                <span className="btn-text">
                    {isTooLarge
                        ? "Cannot upload: content too large"
                        : isLoading
                        ? "Rendering..."
                        : "Upload this Content"}
                </span>
            </button>
        </div>
    );
}
