"use client";
import React from "react";
import { usePathname } from "next/navigation";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "Jamat Times", href: "/jamat-times" },
    { name: "Quran", href: "/quran" },
    { name: "Prayer Times", href: "/prayer-times" },
    { name: "Qibla", href: "/qibla" },
    { name: "Tasbih", href: "/tasbih" },
    { name: "Settings", href: "/settings" },
];

export default function TopNav() {
    const pathname = usePathname();
    // Hide TopNav on any /admin route
    if (pathname.startsWith("/admin")) {
        return null;
    }
    return (
        <nav className="sticky top-0 z-50 bg-base-100 backdrop-blur border-b border-base-300 shadow-sm">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
                <span className="font-bold text-xl text-primary tracking-wide">
                    Madni Prayer Times
                </span>
                <ul className="hidden md:flex gap-4">
                    {navLinks.map((link) => (
                        <li key={link.name}>
                            <a
                                href={link.href}
                                className={`btn btn-ghost btn-sm rounded-full text-base-content hover:bg-primary hover:text-primary-content transition-colors duration-200
                                    ${
                                        pathname === link.href
                                            ? "btn-active bg-primary text-primary-content"
                                            : ""
                                    }
                                `}
                            >
                                {link.name}
                            </a>
                        </li>
                    ))}
                </ul>
                {/* Mobile dropdown */}
                <div className="md:hidden dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-circle btn-ghost">
                        <svg
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </label>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 mt-2"
                    >
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <a
                                    href={link.href}
                                    className={`text-base-content hover:bg-primary hover:text-primary-content transition-colors duration-200
                                        ${
                                            pathname === link.href
                                                ? "bg-primary text-primary-content font-bold"
                                                : ""
                                        }
                                    `}
                                >
                                    {link.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
