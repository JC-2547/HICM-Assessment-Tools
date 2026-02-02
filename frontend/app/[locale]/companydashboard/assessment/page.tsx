"use client";

import { useState } from "react";
import IndustrialSafetyAndEnvironmentContent from "./components/industrial_safety_and_environment-content";
import ManagementAndSustainabilityContent from "./components/management_and_sustainability-content";
import CommunityEngagementContent from "./components/community_engagement-content";
import HealthPromotionContent from "./components/health_promotion-content";
import SummaryContent from "./components/summary-content";

type TabKey = "HealthPromotion" | "IndustrialSafetyAndEnvironment" | "CommunityEngagement" | "ManagementAndSustainability" | "summary";

export default function CompanydashboardAssessmentPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("HealthPromotion");

    return (
        <div className="bg-gray-100">
            <div className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-none flex-col px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
                <div className="flex w-full flex-1 flex-col overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-100">
                        <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs font-semibold text-gray-600 sm:text-sm">
                            <button
                                className={
                                    activeTab === "HealthPromotion"
                                        ? "rounded bg-white px-3 py-2 text-gray-800 shadow"
                                        : "rounded px-3 py-2 hover:bg-white/70"
                                }
                                onClick={() => setActiveTab("HealthPromotion")}
                            >
                                 Health Promotion
                            </button>
                            <button
                                className={
                                    activeTab === "IndustrialSafetyAndEnvironment"
                                        ? "rounded bg-white px-3 py-2 text-gray-800 shadow"
                                        : "rounded px-3 py-2 hover:bg-white/70"
                                }
                                onClick={() => setActiveTab("IndustrialSafetyAndEnvironment")}
                            >
                                Industrial Safety & Environment
                            </button>
                            <button
                                className={
                                    activeTab === "CommunityEngagement"
                                        ? "rounded bg-white px-3 py-2 text-gray-800 shadow"
                                        : "rounded px-3 py-2 hover:bg-white/70"
                                }
                                onClick={() => setActiveTab("CommunityEngagement")}
                            >
                                Community Engagement
                            </button>
                            <button
                                className={
                                    activeTab === "ManagementAndSustainability"
                                        ? "rounded bg-white px-3 py-2 text-gray-800 shadow"
                                        : "rounded px-3 py-2 hover:bg-white/70"
                                }
                                onClick={() => setActiveTab("ManagementAndSustainability")}
                            >
                                Management & Sustainability
                            </button>
                            <button
                                className={
                                    activeTab === "summary"
                                        ? "rounded bg-white px-3 py-2 text-gray-800 shadow"
                                        : "rounded px-3 py-2 hover:bg-white/70"
                                }
                                onClick={() => setActiveTab("summary")}
                            >
                                Summary
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 sm:p-6">
                        {activeTab === "HealthPromotion" && <HealthPromotionContent />} 
                        {activeTab === "IndustrialSafetyAndEnvironment" && <IndustrialSafetyAndEnvironmentContent />}
                        {activeTab === "CommunityEngagement" && <CommunityEngagementContent />}
                        {activeTab === "ManagementAndSustainability" && <ManagementAndSustainabilityContent />}
                        {activeTab === "summary" && <SummaryContent />}
                    </div>
                </div>
            </div>
        </div>
    );
}