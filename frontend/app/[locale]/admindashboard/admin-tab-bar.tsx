"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
};

export default function AdminTabBar({ locale }: { locale: string }) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: `/${locale}/admindashboard`, label: "Dashboard" },
    { href: `/${locale}/admindashboard/user`, label: "User Management" },
    { href: `/${locale}/admindashboard/assessment`, label: "Assessment Management" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="w-full border-b border-gray-200 bg-gray-100">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              isActive(tab.href)
                ? "rounded bg-white px-3 py-2 text-gray-800 shadow"
                : "rounded px-3 py-2 hover:bg-white/70"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
