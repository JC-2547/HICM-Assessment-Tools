"use client";

import { useState } from "react";
import PillarBuilder from "./components/pillar-builder";

export default function AdminQuestionsPage() {
  const [activePillar, setActivePillar] = useState("pillar-1");

  const pillars = [
    { key: "pillar-1", label: "Health Promotion (H1)" },
    { key: "pillar-2", label: "Industrial Safety & Environment (I2)" },
    { key: "pillar-3", label: "Community Engagement (C3)" },
    { key: "pillar-4", label: "Management & Sustainability (M4)" },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-100 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-none space-y-6">
        <div className="rounded-lg bg-white p-5 shadow sm:p-6">
          <h1 className="text-xl font-semibold text-gray-900">Assessment</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a pillar to manage questions.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {pillars.map((pillar) => (
              <button
                key={pillar.key}
                onClick={() => setActivePillar(pillar.key)}
                className={
                  activePillar === pillar.key
                    ? "rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                    : "rounded border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                }
              >
                {pillar.label}
              </button>
            ))}
          </div>
        </div>

        <PillarBuilder
          pillarKey={activePillar}
          defaultName={pillars.find((pillar) => pillar.key === activePillar)?.label || "Pillar555"}
        />
      </div>
    </div>
  );
}
