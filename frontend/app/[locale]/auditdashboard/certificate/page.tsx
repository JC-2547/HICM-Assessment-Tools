"use client";

import { useCallback, useRef } from "react";

const pillarRows = [
    { code: "H1", label: "Health Promotion", points: 300, score: 290, percent: 96.67 },
    { code: "I2", label: "Industrial Safety & Environment", points: 300, score: 40, percent: 13.33 },
    { code: "C3", label: "Community Engagement", points: 200, score: 200, percent: 100 },
    { code: "M4", label: "Management & Sustainability", points: 200, score: 100, percent: 50 },
];

const totalPoints = pillarRows.reduce((sum, item) => sum + item.points, 0);
const totalScore = pillarRows.reduce((sum, item) => sum + item.score, 0);
const totalPercent = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;

const levelRows = [
    { level: "Level 1: เริ่มต้น (Emerging)", range: "< 600" },
    { level: "Level 2: กำลังพัฒนา (Developing)", range: "600-699" },
    { level: "Level 3: พัฒนาดี (Performing)", range: "700-799" },
    { level: "Level 4: เป็นเลิศ (Excellence)", range: "800-899" },
    { level: "Level 5: ระดับโลก (World-Class)", range: "900-1000" },
];

const assessmentLevel = (() => {
    if (totalScore < 600) return levelRows[0].level;
    if (totalScore <= 699) return levelRows[1].level;
    if (totalScore <= 799) return levelRows[2].level;
    if (totalScore <= 899) return levelRows[3].level;
    return levelRows[4].level;
})();

const observerRows = [
    "",
    "",
    "",
];

export default function CertificatePage() {
    const contentRef = useRef<HTMLDivElement | null>(null);

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-100 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="certificate-print mx-auto w-full max-w-5xl space-y-4">
                <div ref={contentRef} className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="rounded-lg">
                    <div className="border-b border-gray-300 bg-gray-50 px-6 py-5 text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">HICM Assessment</p>
                        <h1 className="mt-2 text-xl font-semibold text-gray-900">การประเมินและสรุปผล</h1>
                        <p className="mt-1 text-xs text-gray-500">เอกสารสรุปผลการประเมิน (เอกสารทางการ)</p>
                    </div>

                    <div className="space-y-6 px-6 py-5">
                        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-gray-800">ข้อมูลพื้นฐานสถานประกอบการ</h2>
                            <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                                <div className="flex items-center gap-2">
                                    <span className="min-w-[160px] font-semibold">ชื่อสถานประกอบการ</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="min-w-[160px] font-semibold">ที่อยู่</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="min-w-[160px] font-semibold">ประเภทอุตสาหกรรม</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="min-w-[160px] font-semibold">จำนวนพนักงาน</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="min-w-[160px] font-semibold">ผู้ประเมิน</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="min-w-[160px] font-semibold">ตำแหน่ง</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="min-w-[160px] font-semibold">วันที่ประเมิน</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="min-w-[160px] font-semibold">รอบการประเมิน</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-gray-800">สรุปผลคะแนนแต่ละ Pillar</h2>
                            <div className="overflow-hidden rounded border border-gray-300">
                                <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] bg-gray-100 px-3 py-2 text-xs font-semibold uppercase text-gray-600">
                                    <span>Pillar</span>
                                    <span className="text-center">คะแนนเต็ม</span>
                                    <span className="text-center">คะแนนที่ได้</span>
                                    <span className="text-center">ร้อยละ (%)</span>
                                </div>
                                {pillarRows.map((row) => (
                                    <div
                                        key={row.code}
                                        className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] border-t border-gray-200 px-3 py-2 text-sm"
                                    >
                                        <span className="text-gray-800">
                                            {row.code}: {row.label}
                                        </span>
                                        <span className="text-center text-gray-700">{row.points}</span>
                                        <span className="text-center text-gray-700">{row.score}</span>
                                        <span className="text-center text-gray-700">{row.percent.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] border-t border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold">
                                    <span className="text-gray-800">รวมผลคะแนนทั้งหมด</span>
                                    <span className="text-center text-gray-800">{totalPoints}</span>
                                    <span className="text-center text-gray-800">{totalScore}</span>
                                    <span className="text-center text-gray-800">{totalPercent.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-gray-800">ระดับการประเมิน HICM</h2>
                            <div className="overflow-hidden rounded border border-gray-300">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 text-xs font-semibold uppercase text-gray-600">
                                        <tr>
                                            <th className="px-3 py-2">ระดับ</th>
                                            <th className="px-3 py-2 text-center">คะแนน</th>
                                            <th className="px-3 py-2 text-center">ผลการประเมิน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {levelRows.map((row, index) => (
                                            <tr key={row.level} className="border-t border-gray-200">
                                                <td className="px-3 py-2 text-gray-800">{row.level}</td>
                                                <td className="px-3 py-2 text-center text-gray-700">{row.range}</td>
                                                {index === 0 && (
                                                    <td
                                                        className="px-3 py-2 text-center text-gray-800 border border-gray-300"
                                                        rowSpan={levelRows.length}
                                                    >
                                                        {assessmentLevel}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-gray-800">ข้อมูลเพิ่มเติมและข้อสังเกตจากผู้ประเมิน</h2>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-[90px_1fr] gap-3">
                                    <div className="flex items-start justify-center rounded border border-gray-300 bg-gray-50 px-2 py-3 text-sm font-semibold text-gray-700">
                                        จุดเด่น
                                    </div>
                                    <div className="rounded border border-gray-300">
                                        <ol className="space-y-3 p-4 text-sm text-gray-700">
                                            {observerRows.map((_, index) => (
                                                <li key={`strength-${index}`} className="border-b border-dotted border-gray-300 pb-2">
                                                    {index + 1})
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[90px_1fr] gap-3">
                                    <div className="flex items-start justify-center rounded border border-gray-300 bg-gray-50 px-2 py-3 text-sm font-semibold text-gray-700">
                                        จุดที่ควรปรับปรุง
                                    </div>
                                    <div className="rounded border border-gray-300">
                                        <ol className="space-y-3 p-4 text-sm text-gray-700">
                                            {observerRows.map((_, index) => (
                                                <li key={`improve-${index}`} className="border-b border-dotted border-gray-300 pb-2">
                                                    {index + 1})
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-gray-800">แผนการพัฒนาในรอบถัดไป</h2>
                            <div className="overflow-hidden rounded border-none bg-white">
                                <table className="w-full table-fixed border-collapse text-sm">
                                    <colgroup>
                                        <col className="w-[70px]" />
                                        <col className="w-[40%]" />
                                        <col className="w-[22%]" />
                                        <col className="w-[18%]" />
                                        <col className="w-[18%]" />
                                    </colgroup>
                                    <thead className="bg-gray-100 text-xs font-semibold uppercase text-gray-600">
                                        <tr>
                                            <th className="border border-gray-300 px-2 py-2 text-center">ลำดับ</th>
                                            <th className="border border-gray-300 px-2 py-2 text-center">กิจกรรม/โครงการ</th>
                                            <th className="border border-gray-300 px-2 py-2 text-center">ผู้รับผิดชอบ</th>
                                            <th className="border border-gray-300 px-2 py-2 text-center">ระยะเวลา</th>
                                            <th className="border border-gray-300 px-2 py-2 text-center">งบประมาณ (บาท) </th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <tr key={`plan-${index}`} className="h-9">
                                                <td className="border border-gray-300 px-2 text-center font-semibold text-gray-800">
                                                    {index + 1}
                                                </td>
                                                <td className="border border-gray-300 px-2">
                                                    <div className="border-b border-dotted border-gray-300">&nbsp;</div>
                                                </td>
                                                <td className="border border-gray-300 px-2">
                                                    <div className="border-b border-dotted border-gray-300">&nbsp;</div>
                                                </td>
                                                <td className="border border-gray-300 px-2">
                                                    <div className="border-b border-dotted border-gray-300">&nbsp;</div>
                                                </td>
                                                <td className="border border-gray-300 px-2">
                                                    <div className="border-b border-dotted border-gray-300">&nbsp;</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-gray-800">ลายเซ็นผู้ประเมินและผู้อนุมัติ</h2>
                            <div className="mt-4 grid gap-3 text-sm text-gray-700">
                                <div className="grid items-center gap-3 sm:grid-cols-[120px_1fr_80px_1fr]">
                                    <span className="font-semibold text-gray-800">ผู้ประเมิน</span>
                                    <div className="border-b border-dotted border-gray-400">&nbsp;</div>
                                    <span className="font-semibold text-gray-800">วันที่</span>
                                    <div className="border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="grid items-center gap-3 sm:grid-cols-[120px_1fr_80px_1fr]">
                                    <span className="font-semibold text-gray-800">ผู้ตรวจสอบ</span>
                                    <div className="border-b border-dotted border-gray-400">&nbsp;</div>
                                    <span className="font-semibold text-gray-800">วันที่</span>
                                    <div className="border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                                <div className="grid items-center gap-3 sm:grid-cols-[120px_1fr_80px_1fr]">
                                    <span className="font-semibold text-gray-800">ผู้อนุมัติ</span>
                                    <div className="relative h-5">
                                        <div className="absolute inset-x-0 bottom-0 border-b border-dotted border-gray-400">&nbsp;</div>
                                        <span className="absolute left-1/2 top-full -translate-x-1/2 pt-1 text-xs text-gray-500">
                                            (ผู้บริหารระดับสูง)
                                        </span>
                                    </div>
                                    <span className="font-semibold text-gray-800">วันที่</span>
                                    <div className="border-b border-dotted border-gray-400">&nbsp;</div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}
