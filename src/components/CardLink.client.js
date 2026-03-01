"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CardLink({ href, children, onDelayedShow, delay = 800, className, onTap, ...props }) {
    const router = useRouter();
    const timerRef = useRef();

    const createOverlay = (text) => {
        if (typeof document === "undefined") return;
        if (document.getElementById("global-navigation-loader")) return;
        const overlay = document.createElement("div");
        overlay.id = "global-navigation-loader";
        overlay.setAttribute(
            "style",
            "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);z-index:9999;"
        );

        overlay.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
                                <span class="loader" aria-hidden="true"></span>
                                <div style="color:#fff;font-size:14px;text-align:center">${text || "Loading..."}</div>
            </div>
            <style>
            /* Compact primary-colored loader */
            .loader {
                width: 16px;
                height: 16px;
                position: relative;
                left: -32px;
                border-radius: 50%;
                color: var(--primary-color, var(--color-primary, #FF3D00));
                background: currentColor;
                box-shadow: 32px 0 , -32px 0 ,  64px 0;
                display: inline-block;
            }

            .loader::after {
                content: '';
                position: absolute;
                left: -32px;
                top: 0;
                width: 16px;
                height: 16px;
                border-radius: 10px;
                background: var(--primary-color, var(--color-primary, #FF3D00));
                animation: move 3s linear infinite alternate;
            }

            @keyframes move {
                0% , 5%{
                    left: -32px;
                    width: 16px;
                }
                15% , 20%{
                    left: -32px;
                    width: 48px;
                }
                30% , 35%{
                    left: 0px;
                    width: 16px;
                }
                45% , 50%{
                    left: 0px;
                    width: 48px;
                }
                60% , 65%{
                    left: 32px;
                    width: 16px;
                }

                75% , 80% {
                    left: 32px;
                    width: 48px;
                }
                95%, 100% {
                    left: 64px;
                    width: 16px;
                }
            }
            </style>
        `;

        // determine the resolved primary color and apply it to the overlay
        try {
            const tryGetVar = (el, name) => {
                try {
                    return getComputedStyle(el).getPropertyValue(name).trim();
                } catch (e) {
                    return "";
                }
            };

            // 1) try CSS variables on :root/html
            let primary = tryGetVar(document.documentElement, "--primary-color") || tryGetVar(document.documentElement, "--color-primary");

            // 2) try body
            if (!primary) primary = tryGetVar(document.body, "--primary-color") || tryGetVar(document.body, "--color-primary");

            // 3) try to read a resolved background color from a themed helper element
            if (!primary) {
                const tmp = document.createElement("div");
                tmp.className = "bg-primary";
                tmp.style.position = "fixed";
                tmp.style.left = "-9999px";
                document.body.appendChild(tmp);
                try {
                    const bg = getComputedStyle(tmp).backgroundColor;
                    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") primary = bg;
                } catch (e) { }
                tmp.remove();
            }

            // 4) final fallback: reference the CSS variable (will cascade to theme)
            if (!primary) primary = "var(--primary-color, var(--color-primary, #FF3D00))";

            overlay.style.setProperty("--primary-color", primary);
        } catch (e) {
            // leave overlay to use the CSS fallback defined in the injected styles
        }

        document.body.appendChild(overlay);
    };

    const removeOverlay = () => {
        if (typeof document === "undefined") return;
        const el = document.getElementById("global-navigation-loader");
        if (el) el.remove();
    };

    const handleClick = async (e) => {
        e.preventDefault();

        // call optional tap handler (used for vibration feedback)
        try {
            if (typeof onTap === "function") onTap(e);
        } catch (err) {
            // ignore
        }

        // show a global overlay spinner so it remains visible during navigation
        createOverlay("Please wait...");

        // capture current URL so we can detect a successful navigation
        const startHref = typeof window !== "undefined" ? window.location.href : "";

        // navigate - await if router.push returns a promise
        try {
            const pushResult = router.push(href);
            // if push returns a promise, await it
            if (pushResult && typeof pushResult.then === "function") {
                try {
                    await pushResult;
                } catch (e) {
                    // ignore; we'll detect nav via href change below or remove on error
                }
            }
        } catch (err) {
            removeOverlay();
            if (onDelayedShow) onDelayedShow(false);
            return;
        }

        // poll until the URL changes (client navigation finished), then remove overlay
        const checkInterval = setInterval(() => {
            if (typeof window === "undefined") return;
            if (window.location.href !== startHref) {
                removeOverlay();
                clearInterval(checkInterval);
            }
        }, 100);

        // safety: remove overlay after 10s to avoid stuck state
        setTimeout(() => {
            removeOverlay();
            clearInterval(checkInterval);
        }, 10000);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <a href={href} {...props} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}
