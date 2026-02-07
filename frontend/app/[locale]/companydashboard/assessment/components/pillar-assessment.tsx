"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ADMIN_API_BASE, API_BASE } from "@/app/auth/api";
import AssessmentSection, { AssessmentQuestion } from "./assessment";

type PillarAssessmentResponse = {
  key: string;
  name: string;
  questions: Array<{
    id: number;
    title: string;
    detail?: string | null;
    choices: Array<{ id: number; label: string; score: number }>;
  }>;
};

type DraftResponse = {
  items: Array<{
    assessment_id: number;
    evaluation_criteria_id: number | null;
    performance_results: string | null;
  }>;
};

type SubmitStatusResponse = {
  submitted: boolean;
};

type EvidenceItem = {
  id: number;
  file_path?: string | null;
  url?: string | null;
};

type EvidenceListResponse = {
  items: EvidenceItem[];
};

type EvidenceDeleteResponse = {
  success: boolean;
};

type PillarAssessmentProps = {
  pillarKey: string;
  defaultTitle: string;
};

const COMPANY_API_BASE = ADMIN_API_BASE.replace("/admin", "/company");
const BACKEND_BASE = API_BASE.replace(/\/api$/, "");

export default function PillarAssessment({ pillarKey, defaultTitle }: PillarAssessmentProps) {
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

  const storageKey = useMemo(() => {
    if (typeof window === "undefined") return `company-assessment-${pillarKey}`;
    const userId = localStorage.getItem("user_id") || "anonymous";
    return `company-assessment-${userId}-${pillarKey}`;
  }, [pillarKey]);

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [title, setTitle] = useState(defaultTitle);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ answers: Record<string, string>; comments: Record<string, string> } | null>(
    null
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [evidenceByQuestion, setEvidenceByQuestion] = useState<Record<string, EvidenceItem[]>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [assessmentResponse, draftResponse, statusResponse] = await Promise.all([
          fetch(`${COMPANY_API_BASE}/assessments/${pillarKey}`, {
            headers: authHeaders,
          }),
          fetch(
            `${COMPANY_API_BASE}/assessments/${pillarKey}/draft${
              userId ? `?user_id=${encodeURIComponent(userId)}` : ""
            }`,
            {
            headers: authHeaders,
            }
          ),
          fetch(
            `${COMPANY_API_BASE}/assessments/${pillarKey}/submit-status${
              userId ? `?user_id=${encodeURIComponent(userId)}` : ""
            }`,
            {
              headers: authHeaders,
            }
          ),
        ]);
        if (!assessmentResponse.ok) {
          throw new Error("Failed to load assessments");
        }
        const data = (await assessmentResponse.json()) as PillarAssessmentResponse;
        const draftData = draftResponse.ok
          ? ((await draftResponse.json()) as DraftResponse)
          : { items: [] };
        const statusData = statusResponse.ok
          ? ((await statusResponse.json()) as SubmitStatusResponse)
          : { submitted: false };
        if (cancelled) return;

        setTitle(data.name || defaultTitle);
        const nextQuestions = data.questions.map((question) => ({
          id: String(question.id),
          title: question.title,
          detail: question.detail || undefined,
          choices: question.choices.map((choice) => ({
            id: String(choice.id),
            label: choice.label,
            score: choice.score,
          })),
        }));

        setQuestions(nextQuestions);

        const evidenceEntries = await Promise.all(
          data.questions.map(async (question) => {
            try {
              const response = await fetch(`${COMPANY_API_BASE}/assessments/${question.id}/evidence`, {
                headers: authHeaders,
              });
              if (!response.ok) {
                return [String(question.id), []] as const;
              }
              const payload = (await response.json()) as EvidenceListResponse;
              const normalizedItems = payload.items.map((item) => ({
                ...item,
                url: item.url && item.url.startsWith("/") ? `${BACKEND_BASE}${item.url}` : item.url,
              }));
              return [String(question.id), normalizedItems] as const;
            } catch (error) {
              console.error(error);
              return [String(question.id), []] as const;
            }
          })
        );
        if (!cancelled) {
          setEvidenceByQuestion(Object.fromEntries(evidenceEntries));
        }

        const answers: Record<string, string> = {};
        const comments: Record<string, string> = {};
        draftData.items.forEach((item) => {
          const assessmentId = String(item.assessment_id);
          if (item.evaluation_criteria_id) {
            answers[assessmentId] = String(item.evaluation_criteria_id);
          }
          if (item.performance_results) {
            comments[assessmentId] = item.performance_results;
          }
        });
        setDraft({ answers, comments });
        setIsSubmitted(Boolean(statusData.submitted));
      } catch (error) {
        if (!cancelled) {
          setTitle(defaultTitle);
          setQuestions([]);
          setDraft(null);
          setIsSubmitted(false);
          setEvidenceByQuestion({});
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
  }, [authHeaders, defaultTitle, pillarKey, userId]);

  const buildDraftItems = useCallback(
    (draft: { answers: Record<string, string>; comments: Record<string, string> }) =>
      questions
        .map((question) => {
          const answerId = draft.answers[question.id];
          const comment = draft.comments[question.id];
          if (!answerId && !comment) return null;
          return {
            assessment_id: Number(question.id),
            evaluation_criteria_id: answerId ? Number(answerId) : null,
            performance_results: comment || null,
          };
        })
        .filter((item): item is {
          assessment_id: number;
          evaluation_criteria_id: number | null;
          performance_results: string | null;
        } => item !== null),
    [questions]
  );

  const saveDraft = useCallback(
    async (draft: { answers: Record<string, string>; comments: Record<string, string> }) => {
      if (!questions.length) return;
      const items = buildDraftItems(draft);
      if (!items.length) return;

      try {
        await fetch(`${COMPANY_API_BASE}/assessments/${pillarKey}/auto-save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ items, user_id: userId ? Number(userId) : undefined }),
        });
      } catch (error) {
        console.error(error);
      }
    },
    [authHeaders, pillarKey, questions.length, userId, buildDraftItems]
  );

  const submitPillar = useCallback(async () => {
    try {
      const response = await fetch(`${COMPANY_API_BASE}/assessments/${pillarKey}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ user_id: userId ? Number(userId) : undefined }),
      });
      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error(error);
    }
  }, [authHeaders, pillarKey, userId]);

  const handleAutoSave = useCallback(
    async (draft: { answers: Record<string, string>; comments: Record<string, string> }) => {
      await saveDraft(draft);
    },
    [saveDraft]
  );

  const handleSubmit = useCallback(
    async (draft: { answers: Record<string, string>; comments: Record<string, string> }) => {
      await saveDraft(draft);
      await submitPillar();
    },
    [saveDraft, submitPillar]
  );

  const uploadEvidence = useCallback(
    async (assessmentId: string, files: File[]) => {
      if (!files.length) return;
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        const response = await fetch(`${COMPANY_API_BASE}/assessments/${assessmentId}/evidence`, {
          method: "POST",
          headers: {
            ...authHeaders,
          },
          body: formData,
        });
        if (response.ok) {
          const payload = (await response.json()) as EvidenceListResponse;
          const normalizedItems = payload.items.map((item) => ({
            ...item,
            url: item.url && item.url.startsWith("/") ? `${BACKEND_BASE}${item.url}` : item.url,
          }));
          setEvidenceByQuestion((prev) => {
            const existing = prev[assessmentId] || [];
            return {
              ...prev,
              [assessmentId]: [...existing, ...normalizedItems],
            };
          });
        }
      } catch (error) {
        console.error(error);
      }
    },
    [authHeaders]
  );

  const deleteEvidence = useCallback(
    async (assessmentId: string, evidenceId: number) => {
      try {
        const response = await fetch(
          `${COMPANY_API_BASE}/assessments/${assessmentId}/evidence/${evidenceId}`,
          {
            method: "DELETE",
            headers: {
              ...authHeaders,
            },
          }
        );
        if (!response.ok) return;
        const payload = (await response.json()) as EvidenceDeleteResponse;
        if (!payload.success) return;

        setEvidenceByQuestion((prev) => {
          const existing = prev[assessmentId] || [];
          return {
            ...prev,
            [assessmentId]: existing.filter((item) => item.id !== evidenceId),
          };
        });
      } catch (error) {
        console.error(error);
      }
    },
    [authHeaders]
  );



  if (loading) {
    return <div className="text-sm text-gray-500">Loading assessment...</div>;
  }

  if (questions.length === 0) {
    return <div className="text-sm text-gray-500">No assessment questions available.</div>;
  }

  return (
    <AssessmentSection
      title={title}
      subtitle=""
      questions={questions}
      storageKey={storageKey}
      onAutoSave={handleAutoSave}
      onSubmit={handleSubmit}
      onUploadEvidence={uploadEvidence}
      onDeleteEvidence={deleteEvidence}
      isSubmitted={isSubmitted}
      initialDraft={draft || undefined}
      evidenceByQuestion={evidenceByQuestion}
    />
  );
}
