"use client";

import { useCallback, useRef } from "react";

const pillarRows = [
    { code: "H1", label: "Health Promotion", Indicators: 15, maxscore: 300, score: 100 },
    { code: "I2", label: "Industrial Safety & Environment", Indicators: 15, maxscore: 300, score: 200 },
    { code: "C3", label: "Community Engagement", Indicators: 15, maxscore: 200, score: 100 },
    { code: "M4", label: "Management & Sustainability", Indicators: 15, maxscore: 200, score: 100 },
];

const totalPoints = pillarRows.reduce((sum, item) => sum + item.Indicators, 0);
const totalScore = pillarRows.reduce((sum, item) => sum + item.score, 0);

const levelRows = [
    { level: "Level 1", range: "< 600", Meaning: "เริ่มต้น (Emerging) - องค์กรเริ่มให้ความสำคัญกับสุขภาวะ มีพื้นฐานบางส่วน" },
    { level: "Level 2", range: "600-699", Meaning: "กำลังพัฒนา (Developing) - องค์กรมีระบบพื้นฐานครบ กำลังพัฒนาให้ครอบคลุม" },
    { level: "Level 3", range: "700-799", Meaning: "พัฒนาดี (Performing) - องค์กรมีระบบที่ดี มีการดำเนินงานอย่างมีประสิทธิภาพ" },
    { level: "Level 4", range: "800-899", Meaning: "เป็นเลิศ (Excellence) - องค์กรมีมาตรฐานสูง เป็นแบบอย่างที่ดี" },
    { level: "Level 5", range: "900-1000", Meaning: "รระดับโลก (World-Class) - องค์กรมีมาตรฐานระดับสากล เป็นต้นแบบแห่งการเรียนรู้" },
];

const assessmentLevel = (() => {
    if (totalScore < 600) return levelRows[0].level;
    if (totalScore <= 699) return levelRows[1].level;
    if (totalScore <= 799) return levelRows[2].level;
    if (totalScore <= 899) return levelRows[3].level;
    return levelRows[4].level;
})();

const assessmentMeaning = levelRows.find((row) => row.level === assessmentLevel)?.Meaning ?? "-";


const observerRows = [
    "",
    "",
    "",
];

export default function CertificatePage2() {
    const contentRef = useRef<HTMLDivElement | null>(null);

    const handleExportPdf = useCallback(async () => {
        if (!contentRef.current || typeof window === "undefined") return;

        try {
            const html2pdf = (await import("html2pdf.js")).default;

            await html2pdf()
                .set({
                    margin: 10,
                    filename: "hicm-certificate.pdf",
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: "#ffffff",
                    },
                    jsPDF: {
                        unit: "mm",
                        format: "a4",
                        orientation: "portrait",
                    },
                })
                .from(contentRef.current)
                .save();
        } catch (error) {
            console.error("PDF export failed", error);
            alert("ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง");
        }
    }, []);

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-100 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="certificate-print mx-auto w-full max-w-5xl space-y-4">
                <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                    >
                        Export PDF
                    </button>
                </div>

                <div ref={contentRef} className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="rounded-lg">
                    <div className="border-b border-gray-300 bg-gray-50 px-6 py-5 text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">HICM Assessment</p>
                        <h1 className="mt-2 text-xl font-semibold text-gray-900">การประเมินและสรุปผล</h1>
                        <p className="mt-1 text-xs text-gray-500">เอกสารสรุปผลการประเมิน (เอกสารทางการ)</p>
                    </div>

                    <div className="space-y-6 px-6 py-5">
                        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-gray-800">สรุปผลคะแนนแต่ละ Pillar</h2>
                            <div className="overflow-hidden rounded border border-gray-300">
                                <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] bg-gray-100 px-3 py-2 text-xs font-semibold uppercase text-gray-600">
                                    <span>Pillar</span>
                                    <span className="text-center">ตัวชีวัด</span>
                                    <span className="text-center">คะแนนรวม (ไม่ปรับสัดส่วน)</span>
                                    
                                </div>
                                {pillarRows.map((row) => (
                                    <div
                                        key={row.code}
                                        className="grid grid-cols-[1.4fr_0.8fr_0.8fr] border-t border-gray-200 px-3 py-2 text-sm"
                                    >
                                        <span className="text-gray-800">
                                            {row.code}: {row.label}
                                        </span>
                                        <span className="text-center text-gray-700">{row.Indicators}</span>
                                        <span className="text-center text-gray-700">{row.score}/{row.maxscore}</span>
                                    </div>
                                ))}
                                <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] border-t border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold">
                                    <span className="text-gray-800">รวมผลคะแนนทั้งหมด</span>
                                    <span className="text-center text-gray-800">{totalPoints}</span>
                                    <span className="text-center text-gray-800">{totalScore}</span>
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
                                            <th className="px-3 py-2 text-center">ชื่อระดับและความหมาย</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {levelRows.map((row, index) => (
                                            <tr key={row.level} className="border-t border-gray-200">
                                                <td className="px-3 py-2 text-gray-800">{row.level}</td>
                                                <td className="px-3 py-2 text-center text-gray-700">{row.range}</td>
                                                <td className="px-3 py-2 text-center text-gray-700">{row.Meaning} </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="gap-50 flex items-center justify-between ">
                                <div className="ml-4">
                                    <h2 className="text-sm font-semibold text-gray-900">ผลการประเมินรวมขององค์กร</h2>
                                    <p className="text-xs font-semibold text-gray-500">(เต็ม 1,000 คะแนน)</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-extrabold text-xl">{totalScore}</span>
                                </div>
                                <div>
                                    <span className=" text-sm font-semibold text-gray-600 mr-4 ">คะแนน</span>
                                </div>
                            </div>                            
                        </section>
                        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <div>
                                <div className="rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 sm:text-right">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="inline-flex  items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900">ระดับที่ได้รับ:</span>
                                            <span className="rounded-full px-2 py-0.5 text-xs font-bold ">{assessmentLevel} :</span>
                                            <span className="text-gray-800">{assessmentMeaning}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-gray-800">ลายเซ็นผู้ประเมินและผู้อนุมัติ</h2>
                            <div className="mt-4 grid gap-3 text-sm text-gray-700">
                                <div className="grid items-center gap-3 sm:grid-cols-[120px_1fr_80px_1fr]">
                                    <span className="font-semibold text-gray-800">ผู้ประเมิน</span>
                                    <div className="border-b border-dotted border-gray-400">&nbsp;</div>
                                    <span className="font-semibold text-gray-800">วันที่</span>
                                    <div className="border-b border-dotted border-gray-400 flex justify-center">
                                        <div className="flex justify-between w-30">
                                        <div>&nbsp;&nbsp;/</div>
                                        <div>&nbsp;&nbsp;/</div>
                                        </div>
                                    </div>                                    
                                </div>
                                <div className="grid items-center gap-3 sm:grid-cols-[120px_1fr_80px_1fr]">
                                    <span className="font-semibold text-gray-800">ผู้รับการประเมิน</span>
                                    <div className="border-b border-dotted border-gray-400">&nbsp;</div>
                                    <span className="font-semibold text-gray-800">วันที่</span>
                                    <div className="border-b border-dotted border-gray-400 flex justify-center">
                                        <div className="flex justify-between w-30">
                                        <div>&nbsp;&nbsp;/</div>
                                        <div>&nbsp;&nbsp;/</div>
                                        </div>
                                    </div>
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
