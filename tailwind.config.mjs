// Tailwind & DaisyUI config
import daisyui from "daisyui";

export default {
    content: [
        "./src/app/**/*.{js,jsx,ts,tsx}",
        "./src/components/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            boxShadow: {
                neumorph: "8px 8px 16px #d1d5db, -8px -8px 16px #ffffff",
            },
            animation: {
                "fade-in": "fadeIn 0.4s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: 0, transform: "translateY(4px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
            },
        },
    },
    daisyui: {
        themes: [
            {
                light: {
                    primary: "#2563eb", // blue-600
                    "primary-content": "#ffffff",
                    secondary: "#ec4899", // pink-500
                    accent: "#16a34a", // green-600 used in some places
                    neutral: "#1f2937",
                    "base-100": "#ffffff",
                    "base-200": "#f1f5f9",
                    "base-300": "#e2e8f0",
                    info: "#0ea5e9",
                    success: "#22c55e",
                    warning: "#f59e0b",
                    error: "#dc2626",
                },
            },
            "dark",
        ],
    },
    plugins: [daisyui],
};
