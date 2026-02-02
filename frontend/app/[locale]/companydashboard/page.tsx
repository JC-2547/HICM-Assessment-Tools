"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { MdNotStarted } from "react-icons/md";

export default function CompanydashboardPage() {
    const t = useTranslations("CompanyDashboard");
    const locale = useLocale();
    const router = useRouter();

    const handleStartAssessment = () => {
        router.push(`/${locale}/companydashboard/assessment`);
    };

    return (
        <main className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-none flex-1 px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
            <div className="flex w-full flex-1 rounded-sm border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                <div className="flex w-full flex-1 flex-col">
                    <div
                        className="w-full max-w-[200px] bg-[#2E86DE] px-3 py-2 text-left text-xs font-semibold text-white sm:max-w-[220px] sm:px-4 sm:text-sm"
                        style={{ clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)" }}
                    >
                        {t("title")}
                    </div>

                    <div className="mt-4 flex-1 text-sm leading-relaxed text-gray-700 sm:mt-6 sm:text-base">
                        {t("content")}
                    </div>

                    <div className="mt-auto flex flex-col items-stretch gap-3 pt-6 sm:flex-row sm:items-center sm:justify-end sm:pt-10">
                        <button onClick={handleStartAssessment} className="flex w-full items-center justify-center gap-2 rounded bg-[#4FB9AF] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#1F7A75] sm:w-auto">
                            {t("startButton")} <MdNotStarted />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}