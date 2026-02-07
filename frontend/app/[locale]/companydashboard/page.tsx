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
                        <p className="mt-3">
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;แบบประเมิน HICM V2025 จัดทำขึ้นเพื่อเป็นเครื่องมือในการประเมินและพัฒนาสถานประกอบการอุตสาหกรรมให้เป็นองค์กรสุขภาวะอย่างยั่งยืน โดยมุ่งเน้นการบูรณาการการส่งเสริมสุขภาพ ความปลอดภัยในการทำงาน การมีส่วนร่วมกับชุมชน และการบริหารจัดการที่มีประสิทธิภาพ เพื่อสร้างสภาพแวดล้อมการทำงานที่ดี และส่งเสริมคุณภาพชีวิตที่ดีของคนทำงานและชุมชนโดยรอบ
                        </p>
                        <p className="mt-3">
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;การประเมินประกอบด้วย 4 เสาหลัก ได้แก่
                            การส่งเสริมสุขภาพ
                            ความปลอดภัยอุตสาหกรรมและสิ่งแวดล้อม
                            การมีส่วนร่วมของชุมชน 
                            และการบริหารจัดการและความยั่งยืน 
                            โดยแต่ละเสาหลักจะมีตัวชี้วัดและเกณฑ์การประเมินที่ชัดเจน เพื่อให้สถานประกอบการสามารถวางแผนพัฒนาและปรับปรุงได้อย่างมีประสิทธิภาพ

                            แต่ละคำถามมี 4 ตัวเลือก ได้แก่ และแต่ละตัวเลือกมีคะแนนดังนี้ 0, 0.25, 0.5, 1 คะแนน คะแนนในแต่ละข้อจะถูกนำมาคำนวณรวมเป็นคะแนนรวมของแต่ละเสาหลัก รวม 1000 คะแนน
                        </p>
                        <p className="mt-3 ml-8"> 
                            คะแนนรวมที่ได้จะถูกจัดระดับเป็น 6 ระดับ ดังนี้
                        </p>

                     <div className="mt-2 ml-8 grid max-w-[420px] grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
                        <span className="font-semibold ">&lt;= 600</span>
                        <span>เริ่มต้น (Emerging)</span>
                        <span className="font-semibold ">600 - 799</span>
                        <span>กำลังพัฒนา (Developing)</span>
                        <span className="font-semibold ">800 - 999</span>
                        <span>พัฒนาดี (Performing)</span>
                        <span className="font-semibold ">1000 - 1199</span>
                        <span>เป็นเลิศ (Excellence)</span>
                        <span className="font-semibold ">1200 - 1399</span>
                        <span>ระดับโลก (World-Class)</span>
                        <span className="font-semibold ">&gt;= 1399</span>
                        <span>ระดับโลก (World-Class) Plus</span>
                    </div>
                        <p className="mt-3 text-xs text-gray-600">
                            หมายเหตุ: กรุณาแนบหลักฐานประกอบ (Evidence) ให้ครบถ้วนในแต่ละข้อ เพื่อให้การประเมินมีความถูกต้องและสมบูรณ์
                        </p>
                        <p className="mt-3">
                            ผลการประเมินจะช่วยให้สถานประกอบการเข้าใจจุดแข็งและจุดที่ต้องพัฒนา พร้อมทั้งเป็นแนวทางในการวางแผนกลยุทธ์เพื่อก้าวสู่การเป็นองค์กรสุขภาวะที่มีความยั่งยืนในระยะยาว
                        </p>
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