"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Clock,
    Megaphone,
    Gift,
    X,
    School,
    Coins,
    LogOut,
    Gauge, Book, UsersRound,
    Wind,
    Briefcase,
    UserCheck,
    CalendarRange
} from "lucide-react";

const navigation = [
    {
        name: "Dashboard  ",
        href: "/admin",
        icon: Gauge,
    },
    {
        name: "All  Masjid",
        href: "/admin/all-masjids",
        icon: School,
    },
    
    {
        name: "Jamat Times",
        href: "/admin/jamat",
        icon: Clock,
    },
    {
        name: "Aelaan Naama",
        href: "/admin/notice",
        icon: Megaphone,
    },

    {
        name: "Durooj Sharif",
        href: "/admin/durood-sharif",
        icon: Coins,
    },

    {
        name: "Zikr Records",
        href: "/admin/zikrCounts",
        icon: Book,
    },
    {
        name: "Free Services",
        href: "/admin/freeServices",
        icon: Wind,
    },
    {
        name: "Users  ",
        href: "/admin/users",
        icon: UsersRound
    }, {
        name: "Local Store",
        href: "/admin/local-store",
        icon: Gift,
    },
    {
        name: "Job Lists",
        href: "/admin/job-lists",
        icon: Briefcase,
    },
    {
        name: "Job Seekers",
        href: "/admin/job-seekers",
        icon: UserCheck,
    },
    {
        name: "Events / Programs",
        href: "/admin/events",
        icon: CalendarRange,
    },
];

export default function AdminSidebar({ isOpen, onClose, onLogout }) {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Admin Dashboard
                        </h2>
                    </div>
                    <nav className="mt-8 flex-1 px-2 space-y-1">
                        {navigation.map((item) => {
                            let isActive;
                            if (item.href === "/admin") {
                                isActive = pathname === "/admin";
                            } else {
                                isActive = pathname.startsWith(item.href);
                            }
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${isActive
                                        ? "bg-blue-50 border-r-4 border-blue-500 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                                >
                                    <item.icon
                                        className={`${isActive
                                            ? "text-blue-500"
                                            : "text-gray-400 group-hover:text-gray-500"
                                            } mr-3 flex-shrink-0 h-6 w-6`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout button */}
                    <div className="px-2 pb-4">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors duration-150"
                        >
                            <LogOut className="mr-3 flex-shrink-0 h-6 w-6" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile sidebar */}
            <div
                className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${isOpen ? "translate-x-0" : "-translate-x-full"
                    } transition-transform duration-300 ease-in-out`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Admin Dashboard
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            let isActive;
                            if (item.href === "/admin") {
                                isActive = pathname === "/admin";
                            } else {
                                isActive = pathname.startsWith(item.href);
                            }
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`${isActive
                                        ? "bg-blue-50 border-r-4 border-blue-500 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                                >
                                    <item.icon
                                        className={`${isActive
                                            ? "text-blue-500"
                                            : "text-gray-400 group-hover:text-gray-500"
                                            } mr-3 flex-shrink-0 h-6 w-6`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile logout button */}
                    <div className="px-2 pb-4">
                        <button
                            onClick={() => {
                                onClose();
                                onLogout();
                            }}
                            className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors duration-150"
                        >
                            <LogOut className="mr-3 flex-shrink-0 h-6 w-6" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
