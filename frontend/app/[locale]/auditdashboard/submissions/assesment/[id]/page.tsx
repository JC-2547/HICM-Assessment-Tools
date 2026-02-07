"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { API_BASE } from "@/app/auth/api";

type PillarQuestion = {
  id: string;
  question: string;
  description: string;
  performanceResults?: string | null;
  answer: string;
  score: number;
  auditorScoreValue?: number | null;
  auditorScoreCriteriaId?: number | null;
  criteriaOptions: Array<{ id: number; name: string; score: number | null; selected: boolean }>;
  evidence: string[];
};

type Pillar = {
  title: string;
  questions: PillarQuestion[];
};

export default function AssesmentPage() {
  const params = useParams();
  const rawId = params?.id as string | string[] | undefined;
  const companyId = Array.isArray(rawId) ? rawId[0] : rawId;
  const numericCompanyId = companyId ? Number(companyId) : null;

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [judgeScores, setJudgeScores] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const activePillar = pillars[activeIndex];
  const allQuestionIds = pillars.flatMap((pillar) => pillar.questions.map((question) => question.id));
  const isComplete = locked || (allQuestionIds.length > 0 && allQuestionIds.every((id) => judgeScores[id]));
  const BACKEND_BASE = API_BASE.replace(/\/api$/, "");

  const authHeaders = useMemo<Record<string, string>>(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!numericCompanyId) {
        setError("Missing company id");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/audit/submissions/${numericCompanyId}`, { headers: authHeaders });
        if (!response.ok) {
          if (!cancelled) setError(`Request failed (${response.status})`);
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          const mapped: Pillar[] = (data.pillars || []).map((pillar: any) => ({
            title: pillar.title,
            questions: (pillar.questions || []).map((q: any) => ({
              id: String(q.id),
              question: q.question,
              description: q.description ?? "",
              performanceResults: q.performance_results ?? null,
              answer: q.answer ?? "-",
              score: q.score ?? 0,
              auditorScoreValue: q.auditor_score_value ?? null,
              auditorScoreCriteriaId: q.auditor_score_criteria_id ?? null,
              criteriaOptions: q.criteria_options ?? [],
              evidence: q.evidence ?? [],
            })),
          }));
          setPillars(mapped);
          const prefill: Record<string, string> = {};
          mapped.forEach((pillar) => {
            pillar.questions.forEach((q) => {
              if (q.auditorScoreCriteriaId) {
                prefill[q.id] = String(q.auditorScoreCriteriaId);
              }
            });
          });
          setJudgeScores(prefill);
          setLocked(Boolean(data.auditor_submitted));
          setSubmittedAt(data.auditor_submitted_at ?? null);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, numericCompanyId]);

  const formatEvidenceLabel = (value: string) => {
    const urlLike = /^https?:\/\//i.test(value);
    if (!urlLike && !value.startsWith("/")) return value;
    try {
      const label = new URL(value).pathname.split("/").filter(Boolean).pop();
      return label || value;
    } catch {
      return value;
    }
  };

  const buildEvidenceHref = (value: string) => {
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return `${BACKEND_BASE}${value}`;
    return `${BACKEND_BASE}/${value.replace(/^\//, "")}`;
  };

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const handleSubmit = async () => {
    if (locked) {
      setSubmitError("ส่งคะแนนแล้ว ไม่สามารถแก้ไขได้");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const scores = pillars.flatMap((pillar) =>
        pillar.questions.map((question) => ({
          assessment_id: Number(question.id),
          evaluation_criteria_id: Number(judgeScores[question.id]),
        }))
      );
      if (!numericCompanyId) {
        setSubmitError("ไม่พบรหัสบริษัท");
        return;
      }
      const response = await fetch(`${API_BASE}/audit/submissions/${numericCompanyId}/scores`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ scores }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "ไม่สามารถบันทึกคะแนนได้");
      }
      setSubmitSuccess("บันทึกคะแนนเรียบร้อย");
      setLocked(true);
      setSubmittedAt(new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      if (message.toLowerCase().includes("already submitted")) {
        setLocked(true);
      }
      setSubmitError(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        Loading assessment...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-white p-6 text-sm text-amber-700 shadow-sm">
        {error}
      </div>
    );
  }

  if (!activePillar) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        ไม่พบข้อมูลการประเมิน
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {pillars.map((pillar, index) => (
          <button
            key={pillar.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={
              index === activeIndex
                ? "rounded-full border border-blue-500 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700"
                : "rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            }
          >
            {pillar.title}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{activePillar.title}</h2>
          <span className="text-xs font-semibold uppercase text-gray-400">
            {activePillar.questions.length} Questions
          </span>
        </div>

        {locked && (
          <div className="mt-3 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
            ส่งคะแนนแล้ว จะแก้ไขไม่ได้{submittedAt ? ` (${new Date(submittedAt).toLocaleString()})` : ""}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {activePillar.questions.map((question, index) => (
            <div key={question.id} className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {index + 1}. {question.question}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{question.description}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  คะแนน: {question.score}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">ผลการดำเนินการ</p>
                  <textarea className="mt-1 text-sm text-gray-800 rounded-md border border-gray-300 p-2 w-full" value={question.performanceResults ? question.performanceResults : "-"} readOnly />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">ผลการประเมินตนเอง</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{question.answer}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">คะแนน auditor</p>
                  <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {question.auditorScoreValue ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">หลักฐาน</p>
                  <div className="mt-1 flex flex-col gap-1.5">
                    {question.evidence.map((file, idx) => {
                      const urlLike = /^https?:\/\//i.test(file) || file.startsWith("/");
                      const label = formatEvidenceLabel(file);
                      const displayLabel = `หลักฐาน ${idx + 1}`;
                      return urlLike ? (
                        <a
                          key={`${file}-${idx}`}
                          href={buildEvidenceHref(file)}
                          target="_blank"
                          rel="noreferrer"
                          title={label}
                          className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-100"
                        >
                          <span className="h-2 w-2 rounded-full bg-blue-400" aria-hidden />
                          <span className="truncate">{displayLabel}</span>
                        </a>
                      ) : (
                        <span
                          key={`${file}-${idx}`}
                          title={label}
                          className="flex  items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
                        >
                          <span className="h-2 w-2 rounded-full bg-gray-300" aria-hidden />
                          <span className="truncate">{displayLabel}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-600">คณะกรรมการให้คะแนน</p>
                    <p className="text-xs text-gray-500">เลือกเกณฑ์เพื่อบันทึกคะแนนของคำถามนี้</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {question.criteriaOptions.length === 0 ? (
                    <span className="text-xs text-gray-500">-</span>
                  ) : (
                    question.criteriaOptions.map((option) => {
                      const selected = judgeScores[question.id] === String(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={locked}
                          onClick={() =>
                            setJudgeScores((prev) => ({ ...prev, [question.id]: String(option.id) }))
                          }
                          className={
                            selected
                              ? "flex w-full items-start gap-3 rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-700"
                              : "flex w-full items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:border-blue-200"
                          }
                        >
                          <span
                            className={
                              selected
                                ? "relative mt-0.5 h-4 w-4 rounded-full border-2 border-blue-500"
                                : "relative mt-0.5 h-4 w-4 rounded-full border-2 border-gray-300"
                            }
                          >
                            {selected && (
                              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500" />
                            )}
                          </span>
                          <span className="flex-1">
                            {option.name}{option.score !== null ? ` (${option.score})` : ""}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            {locked
              ? "ส่งคะแนนแล้ว ไม่สามารถแก้ไขได้"
              : isComplete
              ? "ให้คะแนนครบทุกข้อแล้ว"
              : "กรุณาเลือกคะแนนให้ครบทุกข้อก่อนกด Submit"}
          </p>
          <button
            type="button"
            disabled={locked || !isComplete || submitting}
            onClick={handleSubmit}
            className={
              isComplete && !submitting && !locked
                ? "rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                : "rounded bg-gray-300 px-4 py-2 text-sm font-semibold text-white"
            }
          >
            {locked ? "ส่งแล้ว" : submitting ? "กำลังบันทึก..." : "Submit"}
          </button>
        </div>

        {submitError && <p className="mt-2 text-xs text-red-600">{submitError}</p>}
        {submitSuccess && <p className="mt-2 text-xs text-green-600">{submitSuccess}</p>}
      </div>
    </div>
  );
}
