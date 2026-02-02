"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

export default function AdmindashboardPage() {
    const locale = useLocale();

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-100 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto w-full max-w-none space-y-6">
                <div className="rounded-lg bg-white p-5 shadow sm:p-6">
                    <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Choose a management module.</p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={`/${locale}/admindashboard/user`}
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            User Management
                        </Link>
                        <Link
                            href={`/${locale}/admindashboard/assessment`}
                            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Aessessment Management
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
