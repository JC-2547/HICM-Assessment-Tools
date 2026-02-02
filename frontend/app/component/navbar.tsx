"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function Navbar() {
    const t = useTranslations("Navbar");
    const [username, setUsername] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("access_token");
        const name = localStorage.getItem("username");
        if (token && name) {
            setUsername(name);
        } else {
            setUsername(null);
        }
    }, []);

    const handleLogout = () => {
        if (typeof window === "undefined") return;
        localStorage.clear();
        setUsername(null);
        setMenuOpen(false);
        window.location.href = "/";
    };

  return (
        <nav className="w-full bg-[#0000FF] px-4 shadow-md">
            <div className="container mx-auto flex h-14 items-center justify-between">
                <div className="text-base font-bold text-white sm:text-lg">
                    {t("title")}
                </div>
                <div className="relative">
                    {username ? (
                        <button
                            className="flex items-center gap-2 rounded bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 sm:text-base"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            type="button"
                        >
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                >
                                    <path d="M20 21a8 8 0 0 0-16 0" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <span>{username}</span>
                        </button>
                    ) : (
                        <button className="rounded bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 sm:text-base">
                            {t("staffButton")}
                        </button>
                    )}
                    {username && menuOpen ? (
                        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
                            <button
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                                onClick={handleLogout}
                                type="button"
                            >
                                Logout
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
    </nav>
  );
}
