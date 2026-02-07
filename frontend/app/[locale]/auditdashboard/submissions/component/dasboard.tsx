"use client";

import Link from "next/link";

type DashboardProps = {
    companyId?: number;
    locale?: string;
    onStartScoring?: () => void;
};

export default function DashboardPage({ companyId, locale, onStartScoring }: DashboardProps) {
    const certificateHref = locale ? `/${locale}/auditdashboard/certificate2${companyId ? `?company=${companyId}` : ""}` : "/auditdashboard/certificate";
    const assesmentHref = companyId && locale ? `/${locale}/auditdashboard/submissions/assesment/${companyId}` : "";
    const scoringDisabled = !companyId;
    
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">ภาพรวมการประเมิน</p>
                    <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
                    <p className="text-sm text-gray-600">สรุปคะแนนและความคืบหน้าการลงคะแนนของคณะกรรมการ</p>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <div className="col-span-2 rounded-xl border border-gray-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">Overall score</p>
                            <p className="mt-1 text-3xl font-semibold text-gray-900">—</p>
                            <p className="text-xs text-gray-500">คะแนนรวมจากทุก pillar (auditor)</p>
                        </div>
                        <div className="relative h-24 w-24 rounded-full bg-white shadow-inner">
                            <div className="absolute inset-2 rounded-full border-4 border-blue-200" />
                            <div className="absolute inset-4 rounded-full bg-blue-500/80" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-semibold text-blue-800">—</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-blue-100">
                        <div className="h-2 w-1/3 rounded-full bg-blue-500" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">ตัวอย่างเกจ (รอเชื่อมข้อมูลจริง)</p>
                </div>

                <div className="col-span-2 rounded-xl border border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-gray-500">คณะกรรมการ</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">1/5</p>
                    <p className="text-xs text-gray-500">จำนวน auditor ที่ส่งคะแนนแล้ว / ทั้งหมด</p>
                    <div className="mt-4 h-2 rounded-full bg-gray-100">
                        <div className="h-2 w-1/5 rounded-full bg-green-500" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">ความคืบหน้าการลงคะแนน</p>
                </div>

                <div className="col-span-2 rounded-xl border border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">คะแนนรายเสา</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">Radar chart</p>
                            <p className="text-xs text-gray-500">กระจายคะแนนแต่ละ pillar</p>
                        </div>
                        <div className="h-28 w-28 rounded-full border border-indigo-100 bg-white shadow-inner" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" /> เสาหลักที่ 1 — — คะแนน
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500" /> เสาหลักที่ 2 — — คะแนน
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500" /> เสาหลักที่ 3 — — คะแนน
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> เสาหลักที่ 4 — — คะแนน
                        </div>
                    </div>
                </div>

                <div className="col-span-2 rounded-xl border border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-gray-500">การกระทำด่วน</p>
                    <div className="mt-3 flex flex-col gap-3">
                        {assesmentHref ? (
                            <Link
                                href={assesmentHref}
                                className="flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                ลงคะแนนการประเมิน
                            </Link>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500"
                            >
                                ลงคะแนนการประเมิน
                            </button>
                        )}
                        <Link
                            href={certificateHref}
                            className="flex justify-center rounded-lg border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50"
                        >
                            นำออกใบรับรองการประเมิน
                        </Link>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">ใช้เมื่อคะแนนครบถ้วนแล้ว</p>
                </div>
            </div>
        </div>
    );
}
