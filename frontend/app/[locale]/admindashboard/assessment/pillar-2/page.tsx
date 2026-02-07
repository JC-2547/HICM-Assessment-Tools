"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import PillarBuilder from "../components/pillar-builder";

export default function PillarTwoPage() {
  const locale = useLocale();

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-100 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-none space-y-6">
        <Link
          href={`/${locale}/admindashboard/assessment`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to pillars
        </Link>
        <PillarBuilder pillarKey="pillar-2" defaultName="Industrial Safety & Environment (I2)" />
      </div>
    </div>
  );
}
