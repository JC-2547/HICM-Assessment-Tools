"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const locales = ["th", "en"] as const;

function getPathnameWithLocale(pathname: string, locale: string) {
  const segments = pathname.split("/");

  if (segments.length < 2) {
    return `/${locale}`;
  }

  if (locales.includes(segments[1] as (typeof locales)[number])) {
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  }

  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

export default function LanguageSwitcher() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleSwitch = (nextLocale: (typeof locales)[number]) => {
    const nextPath = getPathnameWithLocale(pathname, nextLocale);
    startTransition(() => {
      router.push(nextPath);
    });
  };

  return (
    <div className="fixed bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-xs shadow-sm backdrop-blur sm:text-sm">
      <span className="text-gray-500">{t("language")}</span>
      <div className="flex overflow-hidden rounded-full border border-gray-200">
        <button
          type="button"
          onClick={() => handleSwitch("th")}
          className={
            locale === "th"
              ? "bg-blue-500 px-3 py-1 text-white"
              : "px-3 py-1 text-gray-700 hover:bg-gray-100"
          }
        >
          TH
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("en")}
          className={
            locale === "en"
              ? "bg-blue-500 px-3 py-1 text-white"
              : "px-3 py-1 text-gray-700 hover:bg-gray-100"
          }
        >
          EN
        </button>
      </div>
    </div>
  );
}
