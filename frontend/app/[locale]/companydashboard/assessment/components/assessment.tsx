"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RiDeleteBin5Line} from "react-icons/ri";

type Choice = {
	id: string;
	label: string;
	score: number;
};

type EvidenceItem = {
	id: number;
	file_path?: string | null;
	url?: string | null;
};

export type AssessmentQuestion = {
	id: string;
	title: string;
	detail?: string;
	choices: Choice[];

};

type AssessmentSectionProps = {
	title: string;
	subtitle?: string;
	questions: AssessmentQuestion[];
	storageKey?: string;
	onAutoSave?: (draft: {
		answers: Record<string, string>;
		comments: Record<string, string>;
	}) => void;
	onSubmit?: (draft: {
		answers: Record<string, string>;
		comments: Record<string, string>;
	}) => void;
	onUploadEvidence?: (assessmentId: string, files: File[]) => Promise<void>;
	onDeleteEvidence?: (assessmentId: string, evidenceId: number) => Promise<void>;
	isSubmitted?: boolean;
	initialDraft?: {
		answers: Record<string, string>;
		comments: Record<string, string>;
	};
	evidenceByQuestion?: Record<string, EvidenceItem[]>;
};

export default function AssessmentSection({
	title,
	subtitle,
	questions,
	storageKey,
	onAutoSave,
	onSubmit,
	onUploadEvidence,
	onDeleteEvidence,
	isSubmitted,
	initialDraft,
	evidenceByQuestion,
}: AssessmentSectionProps) {
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [comments, setComments] = useState<Record<string, string>>({});
	const saveTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const validIds = new Set(questions.map((question) => question.id));

		if (storageKey) {
			const raw = localStorage.getItem(storageKey);
			if (raw) {
				try {
					const parsed = JSON.parse(raw) as {
						answers?: Record<string, string>;
						comments?: Record<string, string>;
					};
					const nextAnswers = Object.fromEntries(
						Object.entries(parsed.answers || {}).filter(([id]) => validIds.has(id))
					);
					const nextComments = Object.fromEntries(
						Object.entries(parsed.comments || {}).filter(([id]) => validIds.has(id))
					);
					setAnswers(nextAnswers);
					setComments(nextComments);
					return;
				} catch (error) {
					console.error(error);
				}
			}
		}

		if (initialDraft) {
			const nextAnswers = Object.fromEntries(
				Object.entries(initialDraft.answers || {}).filter(([id]) => validIds.has(id))
			);
			const nextComments = Object.fromEntries(
				Object.entries(initialDraft.comments || {}).filter(([id]) => validIds.has(id))
			);
			setAnswers(nextAnswers);
			setComments(nextComments);
		}
	}, [questions, storageKey, initialDraft]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!storageKey && !onAutoSave) return;
		if (saveTimeoutRef.current) {
			window.clearTimeout(saveTimeoutRef.current);
		}
		saveTimeoutRef.current = window.setTimeout(() => {
			try {
				if (storageKey) {
					localStorage.setItem(
						storageKey,
						JSON.stringify({ answers, comments })
					);
				}
				onAutoSave?.({ answers, comments });
			} catch (error) {
				console.error(error);
			}
		}, 400);
		return () => {
			if (saveTimeoutRef.current) {
				window.clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [answers, comments, storageKey, onAutoSave]);

	const scoreByQuestion = useMemo(() => {
		const map: Record<string, number> = {};
		questions.forEach((question) => {
			const choiceId = answers[question.id];
			const choice = question.choices.find((item) => item.id === choiceId);
			map[question.id] = choice ? choice.score : 0;
		});
		return map;
	}, [answers, questions]);

	const getEvidenceLabel = (item: EvidenceItem) => {
		const raw = item.url || item.file_path || "file";
		const normalized = raw.split("?")[0];
		const parts = normalized.split(/[\\/]/);
		return parts[parts.length - 1] || "file";
	};

	const handleDeleteEvidence = async (assessmentId: string, evidenceId: number) => {
		if (!onDeleteEvidence) return;
		await onDeleteEvidence(assessmentId, evidenceId);
	};

	return (
		<div className="space-y-6">
			<div
				className="w-full max-w-[300px] bg-[#2E86DE] px-4 py-2 text-left text-sm font-semibold text-white"
				style={{ clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)" }}
			>
				{title}
			</div>
			{subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}

			<div className="space-y-4">
				{questions.map((question, index) => (
					<div
						key={question.id}
						className={`rounded border border-gray-200 bg-white p-4 shadow-sm${isSubmitted ? " opacity-80" : ""
							}`}
					>
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className="text-sm font-semibold text-gray-900">
									{index + 1}. {question.title}
								</p>
								{question.detail ? (
									<p className="mt-1 text-sm text-gray-600">{question.detail}</p>
								) : null}
							</div>
							<span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
								คะแนน: {scoreByQuestion[question.id]}
							</span>
						</div>

						<div className="mt-4 flex flex-col gap-3">
							{question.choices.map((choice) => (
								<label
									key={choice.id}
									className={
										answers[question.id] === choice.id
											? "flex cursor-pointer items-center gap-2 rounded border border-blue-500 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
											: "flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-blue-300"
									}
								>
									<input
										type="radio"
										name={`question-${question.id}`}
										className="h-4 w-4"
										checked={answers[question.id] === choice.id}
										disabled={isSubmitted}
										onChange={() =>
											setAnswers((prev) => ({ ...prev, [question.id]: choice.id }))
										}
									/>
									{choice.label}
								</label>
							))}
						</div>

						<div className="mt-2 flex flex-col gap-1">
							<div>
								<label className="text-xs font-semibold text-gray-600">ผลการดำเนินงาน</label>
								<textarea
									className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
									rows={3}
									value={comments[question.id] || ""}
									disabled={isSubmitted}
									onChange={(event) =>
										setComments((prev) => ({ ...prev, [question.id]: event.target.value }))
									}
									placeholder="Add notes for this question"
								/>
							</div>
							<div>
								<label className="text-xs font-semibold text-gray-600">หลักฐาน</label>
								<div className="mt-1 space-y-2">
									{(evidenceByQuestion?.[question.id] || []).length ? (
										<div className="flex max-h-28 flex-col overflow-y-auto rounded border border-gray-200 bg-white px-3 py-2">
											<ul className="space-y-1 text-xs text-gray-700">
												{(evidenceByQuestion?.[question.id] || []).map((item) => {
													const label = getEvidenceLabel(item);
													return (
														
														<li
															key={item.id}
															className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1"
														>
															<div className="flex items-center gap-2 flex flex-cols">
																<span className="inline-flex h-4 w-4 items-center justify-center rounded bg-blue-100 text-[10px] font-semibold text-blue-700">
																	F
																</span>
																{item.url ? (
																	<a
																		href={item.url}
																		target="_blank"
																		rel="noreferrer"
																		className="text-blue-600 hover:underline flex"
																	>
																		{label}
																	</a>
																) : (
																	<span>{label}</span>
																)}
															</div>
															<button
																type="button"
																disabled={isSubmitted}
																onClick={() => handleDeleteEvidence(question.id, item.id)}
																className={
																	isSubmitted
																		? "cursor-not-allowed text-xs text-gray-400"
																		: "text-xs font-semibold text-rose-600 hover:text-rose-700"
																}
															>
																<RiDeleteBin5Line size={15}/>
															</button>
														</li>
													);
												})}
											</ul>
										</div>
									) : (
										<p className="text-xs text-gray-500">ไม่มีไฟล์</p>
									)}
									<div className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
										<div className="flex flex-wrap items-center justify-between gap-3">
											<div>
												<p className="text-sm font-semibold text-slate-700">เพิ่มไฟล์หลักฐาน</p>
												<p className="text-xs text-slate-500">PDF หรือรูปภาพ, สามารถเลือกหลายไฟล์ได้</p>
											</div>
											<label
												htmlFor={`evidence-${question.id}`}
												className={
													isSubmitted
														? "cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400"
														: "cursor-pointer rounded border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-300"
												}
											>
												เพิ่มไฟล์
											</label>
										</div>
										<input
											id={`evidence-${question.id}`}
											type="file"
											className="sr-only"
											multiple
											accept="image/*,application/pdf"
											disabled={isSubmitted}
											onChange={async (event) => {
												const list = Array.from(event.target.files || []);
												if (!list.length) return;
												await onUploadEvidence?.(question.id, list);
												event.target.value = "";
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="flex flex-wrap items-center justify-end gap-3">
				{isSubmitted ? (
					<span className="rounded bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
						Submitted
					</span>
				) : null}
				<button
					className={
						isSubmitted
							? "cursor-not-allowed rounded bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-600"
							: "rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
					}
					disabled={isSubmitted}
					onClick={() => onSubmit?.({ answers, comments })}
				>
					{isSubmitted ? "Submitted" : "Submit section"}
				</button>
			</div>
		</div>
	);
}
