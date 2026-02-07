"use client";

import { useEffect, useMemo, useState } from "react";

import { ADMIN_API_BASE } from "@/app/auth/api";

type SummaryStatus = {
  completed: boolean;
  submitted: boolean;
  submitted_at: string | null;
  total: number;
  answered: number;
};

type SummaryResults = {
  overall_score: number;
  max_score: number;
  star_count: number;
  pillars: Array<{
    key: string;
    name: string;
    weight: number | null;
    score: number;
    max_score: number;
  }>;
};

const API_BASE = ADMIN_API_BASE.replace("/admin", "/company");

export default function SummaryContent() {

  const authHeaders = useMemo<Record<string, string>>(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const userId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("user_id");
  }, []);

  const [status, setStatus] = useState<SummaryStatus | null>(null);
  const [results, setResults] = useState<SummaryResults | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statusResponse, resultsResponse] = await Promise.all([
          fetch(
            `${API_BASE}/assessment-summary/status${
              userId ? `?user_id=${encodeURIComponent(userId)}` : ""
            }`,
            { headers: authHeaders }
          ),
          fetch(
            `${API_BASE}/assessment-summary/results${
              userId ? `?user_id=${encodeURIComponent(userId)}` : ""
            }`,
            { headers: authHeaders }
          ),
        ]);
        if (statusResponse.ok) {
          const data = (await statusResponse.json()) as SummaryStatus;
          if (!cancelled) {
            setStatus(data);
          }
        }
        if (resultsResponse.ok) {
          const data = (await resultsResponse.json()) as SummaryResults;
          if (!cancelled) {
            setResults(data);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(null);
          setResults(null);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, userId]);

  const canSubmit = Boolean(status?.completed) && !status?.submitted && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/assessment-summary/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ user_id: userId ? Number(userId) : undefined }),
      });
      if (response.ok) {
        const data = (await response.json()) as { submitted_at: string };
        setStatus((prev) =>
          prev
            ? { ...prev, submitted: true, submitted_at: data.submitted_at }
            : {
                completed: true,
                submitted: true,
                submitted_at: data.submitted_at,
                total: 0,
                answered: 0,
              }
        );
        setResults((prev) =>
          prev
            ? prev
            : {
                overall_score: 0,
                max_score: 0,
                star_count: 0,
                pillars: [],
              }
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const overallScore = results?.overall_score ?? 0;
  const maxScore = results?.max_score ?? 0;
  const starCount = results?.star_count ?? 0;

  return (
    <div className="space-y-6">
      <div
        className="w-full max-w-[200px] bg-[#2E86DE] px-4 py-2 text-left text-sm font-semibold text-white"
        style={{ clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)" }}
      >
        Summary
      </div>

      <div className="rounded border border-gray-200 bg-[#32B7B3] px-6 py-8 text-center text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide">Overall Rating</p>
        <div className="mt-3 text-4xl font-bold">
          {overallScore} / {maxScore}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1 text-yellow-300">
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index}>{index < starCount ? "★" : "☆"}</span>
          ))}
          <span className="ml-2 text-xs text-white/80">({starCount} Stars)</span>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_120px_120px] gap-2 bg-gray-100 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
          <span>Categories and indicators</span>
          <span className="text-center">Points</span>
          <span className="text-right">Score</span>
        </div>
        {(results?.pillars || []).map((item) => (
          <div
            key={item.key}
            className="grid grid-cols-[1fr_120px_120px] gap-2 border-t border-gray-200 px-4 py-3 text-sm"
          >
            <span className="text-gray-700">{item.name}</span>
            <span className="text-center text-gray-600">{item.max_score}</span>
            <span className="text-right font-semibold text-blue-700">{item.score}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {status?.submitted_at ? (
          <span className="text-xs font-semibold text-emerald-700">
            Submitted at: {new Date(status.submitted_at).toLocaleString()}
          </span>
        ) : null}
        {status ? (
          <span className="text-xs text-gray-500">
            {status.answered}/{status.total} completed
          </span>
        ) : null}
        <button
          className={
            canSubmit
              ? "rounded bg-yellow-400 px-5 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-yellow-300"
              : "cursor-not-allowed rounded bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-500"
          }
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {status?.submitted ? "Submitted" : "Submit your answer"}
        </button>
      </div>
    </div>
  );
}
