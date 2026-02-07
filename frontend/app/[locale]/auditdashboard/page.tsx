"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { API_BASE } from "@/app/auth/api";

type SubmittedCompany = {
  company_id: number;
  company_name: string;
  submitted_at: string;
  status: string;
  score: number;
};

export default function AuditDashboardPage() {
  const locale = useLocale();
  const [submittedCompanies, setSubmittedCompanies] = useState<SubmittedCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo<Record<string, string>>(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/audit/submissions`, { headers: authHeaders });
      if (!response.ok) return;
      const data = (await response.json()) as SubmittedCompany[];
      setSubmittedCompanies(data);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-100 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-none space-y-6">
        <div className="rounded-lg bg-white p-5 shadow sm:p-6">
          <h1 className="text-xl font-semibold text-gray-900">Audit Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Companies that have submitted assessments for review.
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Submitted Companies</h2>
              <p className="mt-1 text-sm text-gray-500">Total {submittedCompanies.length} items</p>
            </div>
            <button
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={load}
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-100 text-xs font-semibold uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Submitted at</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : submittedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  submittedCompanies.map((company) => (
                    <tr key={company.company_id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-gray-700">{company.company_name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(company.submitted_at).toLocaleString()}
                      </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {company.status}
                      </span>
                    </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {company.score}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end  ">
                          <Link
                            href={`/${locale}/auditdashboard/submissions/${company.company_id}`}
                            className="rounded border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            Review
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}