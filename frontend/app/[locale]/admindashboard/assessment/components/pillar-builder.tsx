"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMIN_API_BASE } from "@/app/auth/api";

type Question = {
  assessment_id?: number;
  title: string;
  detail: string;
  choices: { label: string; score: number; point_id?: number }[];
};

type PillarState = {
  name: string;
  questions: Question[];
};

type PillarBuilderProps = {
  pillarKey: string;
  defaultName: string;
};

type PointOption = {
  id: number;
  score: number;
};

function getStorageKey(key: string) {
  return `hicm:pillar:${key}`;
}

const API_BASE = ADMIN_API_BASE;

export default function PillarBuilder({ pillarKey, defaultName }: PillarBuilderProps) {
  const storageKey = useMemo(() => getStorageKey(pillarKey), [pillarKey]);
  const authHeaders = useMemo<Record<string, string>>(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);
  const [pillar, setPillar] = useState<PillarState>({
    name: defaultName,
    questions: [],
  });
  const [points, setPoints] = useState<PointOption[]>([]);
  const [newQuestion, setNewQuestion] = useState<Question>({
    assessment_id: undefined,
    title: "",
    detail: "",
    choices: [{ label: "", score: 0, point_id: undefined }],
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const normalizeChoices = (choices: Question["choices"]) =>
    choices.map((choice) => {
      if (choice.point_id) {
        return choice;
      }
      const match = points.find((point) => point.score === choice.score);
      return {
        ...choice,
        point_id: match?.id,
      };
    });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (typeof window === "undefined") return;
      try {
        const [pillarResponse, pointsResponse] = await Promise.all([
          fetch(
            `${API_BASE}/assessment-builder/${pillarKey}?name=${encodeURIComponent(defaultName)}`,
            {
              headers: authHeaders,
            }
          ),
          fetch(`${API_BASE}/points`, { headers: authHeaders }),
        ]);
        let pointsData: PointOption[] = [];
        if (pointsResponse.ok) {
          pointsData = (await pointsResponse.json()) as PointOption[];
          if (!cancelled) {
            setPoints(pointsData);
          }
        }
        const response = pillarResponse;
        if (response.ok) {
          const data = (await response.json()) as PillarState;
          const mappedQuestions = data.questions?.map((question) => ({
            ...question,
            choices: question.choices
              ? question.choices.map((choice) => {
                  if (choice.point_id) {
                    return choice;
                  }
                  const match = pointsData.find((point) => point.score === choice.score);
                  return { ...choice, point_id: match?.id };
                })
              : [],
          }));
          if (!cancelled) {
            setPillar({
              name: data.name || defaultName,
              questions: mappedQuestions || [],
            });
          }
          return;
        }
      } catch (error) {
        console.error(error);
      }

      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as PillarState;
          const normalized: PillarState = {
            ...parsed,
            name: parsed.name || defaultName,
            questions: parsed.questions.map((question) => ({
              ...question,
              choices: normalizeChoices(
                question.choices.map((choice) =>
                  typeof choice === "string"
                    ? { label: choice, score: 0, point_id: undefined }
                    : choice
                )
              ),
            })),
          };
          if (!cancelled) {
            setPillar(normalized);
          }
          return;
        } catch (error) {
          console.error(error);
        }
      }
      if (!cancelled) {
        setPillar({ name: defaultName, questions: [] });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [defaultName, storageKey, pillarKey, authHeaders]);

  const persistLocal = (next: PillarState) => {
    setPillar(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(next));
    }
  };

  const fetchPillar = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/assessment-builder/${pillarKey}?name=${encodeURIComponent(defaultName)}`,
        {
        headers: authHeaders,
        }
      );
      if (!response.ok) return;
      const data = (await response.json()) as PillarState;
      const mappedQuestions = data.questions?.map((question) => ({
        ...question,
        choices: normalizeChoices(question.choices || []),
      }));
      setPillar({ name: data.name || defaultName, questions: mappedQuestions || [] });
    } catch (error) {
      console.error(error);
    }
  };

  const updatePillarName = (value: string) => {
    persistLocal({ ...pillar, name: value });
  };

  const savePillarName = async () => {
    try {
      await fetch(`${API_BASE}/assessment-builder/${pillarKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ name: pillar.name, questions: [] }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const updateNewQuestionField = (field: "title" | "detail", value: string) => {
    setNewQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const updateNewChoice = (index: number, value: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, i) =>
        i === index ? { ...choice, label: value } : choice
      ),
    }));
  };

  const updateNewChoicePoint = (index: number, value: string) => {
    const pointId = value ? Number(value) : undefined;
    const point = points.find((item) => item.id === pointId);
    setNewQuestion((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, i) =>
        i === index
          ? {
              ...choice,
              point_id: pointId,
              score: point ? point.score : choice.score,
            }
          : choice
      ),
    }));
  };

  const addNewChoice = () => {
    setNewQuestion((prev) => ({
      ...prev,
      choices: [...prev.choices, { label: "", score: 0, point_id: undefined }],
    }));
  };

  const addQuestion = async () => {
    if (!newQuestion.title.trim()) {
      return;
    }
    if (editingIndex === null) {
      const payload = {
        name: pillar.name,
        questions: [
          {
            title: newQuestion.title,
            detail: newQuestion.detail,
            choices: newQuestion.choices,
          },
        ],
      };
      try {
        await fetch(`${API_BASE}/assessment-builder/${pillarKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error(error);
      }
    } else {
      const target = pillar.questions[editingIndex];
      if (target?.assessment_id) {
        try {
          await fetch(`${API_BASE}/assessment-builder/${pillarKey}/${target.assessment_id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              title: newQuestion.title,
              detail: newQuestion.detail,
              choices: newQuestion.choices,
            }),
          });
        } catch (error) {
          console.error(error);
        }
      }
      setEditingIndex(null);
    }
    setNewQuestion({
      assessment_id: undefined,
      title: "",
      detail: "",
      choices: [{ label: "", score: 0, point_id: undefined }],
    });
    await fetchPillar();
  };

  const removeQuestion = async (index: number) => {
    const target = pillar.questions[index];
    if (target?.assessment_id) {
      try {
        await fetch(`${API_BASE}/assessment-builder/${pillarKey}/${target.assessment_id}`, {
          method: "DELETE",
          headers: authHeaders,
        });
      } catch (error) {
        console.error(error);
      }
    }
    const next = {
      ...pillar,
      questions: pillar.questions.filter((_, i) => i !== index),
    };
    persistLocal(next);
  };

  const startEditQuestion = (index: number) => {
    const target = pillar.questions[index];
    if (!target) return;
    setEditingIndex(index);
    setNewQuestion({
      assessment_id: target.assessment_id,
      title: target.title,
      detail: target.detail,
      choices: target.choices.length
        ? normalizeChoices(target.choices.map((choice) => ({ ...choice })))
        : [{ label: "", score: 0, point_id: undefined }],
    });
  };

  const resetForm = () => {
    setNewQuestion({
      assessment_id: undefined,
      title: "",
      detail: "",
      choices: [{ label: "", score: 0, point_id: undefined }],
    });
    setEditingIndex(null);
  };

  return (
    <div className="rounded-lg bg-white p-5 shadow sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Pillar name</label>
        <input
          className="w-full rounded border border-gray-300 p-2 text-sm sm:max-w-sm"
          value={pillar.name}
          onChange={(event) => updatePillarName(event.target.value)}
          onBlur={savePillarName}
        />
      </div>

      <div className="mt-6 rounded border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-700">
          {editingIndex === null ? "Add question" : "Edit question"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Question title</label>
            <input
              className="mt-2 w-full rounded border border-gray-300 p-2 text-sm"
              value={newQuestion.title}
              onChange={(event) => updateNewQuestionField("title", event.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Details</label>
            <textarea
              className="mt-2 w-full rounded border border-gray-300 p-2 text-sm"
              rows={4}
              value={newQuestion.detail}
              onChange={(event) => updateNewQuestionField("detail", event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Choices</p>
          {newQuestion.choices.map((choice, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_200px]">
              <input
                className="w-full rounded border border-gray-300 p-2 text-sm"
                placeholder={`Choice ${index + 1}`}
                value={choice.label}
                onChange={(event) => updateNewChoice(index, event.target.value)}
              />
              <select
                className="w-full rounded border border-gray-300 p-2 text-sm"
                value={choice.point_id ?? ""}
                onChange={(event) => updateNewChoicePoint(index, event.target.value)}
              >
                <option value="">Select point</option>
                {points.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.score}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button
            className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            onClick={addNewChoice}
          >
            Add choice
          </button>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={addQuestion}
            disabled={
              !newQuestion.title.trim() ||
              newQuestion.choices.some((choice) => !choice.point_id)
            }
          >
            {editingIndex === null ? "Add question" : "Save changes"}
          </button>
          <button
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={resetForm}
          >
            {editingIndex === null ? "Clear" : "Cancel"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700">Questions</h2>
        <div className="mt-3 space-y-3">
          {pillar.questions.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              No questions added yet.
            </div>
          ) : (
            pillar.questions.map((question, index) => (
              <div key={`${question.title}-${index}`} className="rounded border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{question.title}</p>
                    {question.detail ? (
                      <p className="mt-1 text-sm text-gray-600">{question.detail}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      onClick={() => startEditQuestion(index)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => removeQuestion(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
                  {question.choices
                    .filter((choice) => choice.label.trim())
                    .map((choice, choiceIndex) => (
                      <li key={`${choice.label}-${choiceIndex}`}>
                        {choice.label} <span className="text-gray-500">(Score: {choice.score})</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
