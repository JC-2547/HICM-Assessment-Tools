"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { API_BASE } from "@/app/auth/api";
import DashboardPage  from "../component/dasboard";

type SubmissionDetail = {
  company_id: number;
  company_name: string;
  company_type: string | null;
  company_address: string | null;
  company_evaluation: string | null;
  company_job_position: string | null;
  company_date_assessment: string | null;
  company_round_assessment: string | null;
  company_number_of_employees: number | null; 
  submitted_at: string | null;
  status: string;
  score: number;
  pillars: Array<{
    title: string;
    questions: Array<{
      id: number;
      question: string;
      description: string | null;
      performance_results: string | null;
      answer: string | null;
      score: number | null;
      criteria_options: Array<{
        id: number;
        name: string;
        score: number | null;
        selected: boolean;
      }>;
      evidence: string[];
    }>;
  }>;
};

export default function AuditSubmissionDetailPage() {
  const params = useParams();
  const rawId = params?.id as string | string[] | undefined;
  const rawLocale = params?.locale as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const locale = Array.isArray(rawLocale) ? rawLocale[0] : rawLocale;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) {
        setSubmission(null);
        setError("Missing submission id");
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/audit/submissions/${id}`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          if (!cancelled) {
            setSubmission(null);
            setError(`Request failed (${response.status})`);
          }
          return;
        }
        const data = (await response.json()) as SubmissionDetail;
        if (!cancelled) {
          setSubmission(data);
          setError(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const notFoundMessage = !loading && !submission;
  const pillars = submission
    ? submission.pillars.map((pillar) => ({
        title: pillar.title,
        questions: pillar.questions.map((question) => ({
          id: String(question.id),
          question: question.question,
          description: question.description ?? "",
          performanceResults: question.performance_results ?? null,
          answer: question.answer ?? "-",
          score: question.score ?? 0,
          criteriaOptions: question.criteria_options ?? [],
          evidence: question.evidence,
        })),
      }))
    : [];

  const companyInfoRows = [
    { label: "ชื่อสถานประกอบการ", value: submission?.company_name || "-" },
    { label: "ที่อยู่", value: submission?.company_address || "-" },
    { label: "ประเภทอุตสาหกรรม", value: submission?.company_type || "-" },
    { label: "จำนวนพนักงาน", value: submission?.company_number_of_employees?.toString() || "-" },
    { label: "ผู้ประเมิน", value: submission?.company_evaluation || "-" },
    { label: "ตำแหน่ง", value: submission?.company_job_position || "-" },
    {
      label: "วันที่ประเมิน",
      value: submission?.company_date_assessment ? new Date(submission.company_date_assessment).toLocaleDateString() : "-",
    },
    { label: "รอบการประเมิน", value: submission?.company_round_assessment || "-" },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-100 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-none space-y-6">

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Company</p>
              <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                {submission?.company_name || ""}
              </h1>
            </div>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {submission?.status || ""}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {companyInfoRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="min-w-[140px] text-sm font-semibold text-gray-700">{row.label}</span>
                <div className="flex-1 border-b border-dotted border-gray-300 text-sm text-gray-900">
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Overall score</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {submission?.score ?? 0}
              </p>
            </div>
          </div>
        </div>


        <div>
          {loading ? (
            <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow">
              Loading dashboard...
            </div>
          ) : error ? (
            <div className="rounded-lg bg-white p-6 text-center text-sm text-amber-700 shadow">
              {error}
            </div>
          ) : submission ? (
            <DashboardPage companyId={submission.company_id} locale={locale} />
          ) : notFoundMessage ? (
            <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow">
              Submission not found.
            </div>
          ) : null}

        </div>

      </div>
    </div>
  );
}
