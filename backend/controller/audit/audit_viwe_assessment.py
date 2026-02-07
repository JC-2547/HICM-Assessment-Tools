from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import SessionLocal
from entity.assessment import AssessmentTable
from entity.auditor import AuditorTable
from entity.auditor_score import AuditorScoreTable
from entity.auditor_submit import AuditorSubmitTable
from entity.company import CompanyTable
from entity.company_assessment import CompanyAssessmentTable
from entity.company_assessment_result import CompanyAssessmentResultTable
from entity.company_submit import CompanySubmitTable
from entity.evidence import EvidenceTable
from entity.evaluation_criteria import EvaluationCriteriaTable
from entity.pillars import PillarsTable
from entity.point import PointTable
from entity.status import StatusTable
from midlewere.midlewere import require_auth

router = APIRouter(prefix="/api/audit", tags=["audit"])


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


def build_public_url(file_path: str | None) -> str | None:
	if not file_path:
		return None
	file_name = Path(file_path).name
	if not file_name:
		return None
	return f"/uploads/evidence/{file_name}"


class QuestionItem(BaseModel):
	id: int
	question: str
	description: str | None = None
	performance_results: str | None = None
	answer: str | None = None
	score: float | None = None
	criteria_options: list["CriteriaOption"]
	evidence: list[str]
	auditor_score_criteria_id: int | None = None
	auditor_score_value: float | None = None


class CriteriaOption(BaseModel):
	id: int
	name: str
	score: float | None = None
	selected: bool


class PillarItem(BaseModel):
	title: str
	questions: list[QuestionItem]


class SubmissionDetailResponse(BaseModel):
	company_id: int
	company_name: str
	company_type: str | None = None
	company_number_of_employees: int | None = None
	company_address: str | None = None
	company_evaluation: str | None = None
	company_job_position: str | None = None
	company_date_assessment: datetime | None = None
	company_round_assessment: str | None = None
	submitted_at: datetime | None = None
	status: str
	score: float
	auditor_submitted: bool = False
	auditor_submitted_at: datetime | None = None
	pillars: list[PillarItem]


@router.get("/submissions/{company_id}", response_model=SubmissionDetailResponse)
def get_submission_detail(
	company_id: int,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	user_id = user.get("sub")
	auditor_id: int | None = None
	if user_id:
		auditor_row = (
			db.query(AuditorTable)
			.filter(AuditorTable.user_id == int(user_id), AuditorTable.delete_at.is_(None))
			.first()
		)
		if auditor_row:
			auditor_id = auditor_row.id
	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.id == company_id, CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	latest_submit = (
		db.query(CompanySubmitTable)
		.filter(
			CompanySubmitTable.company_id == company_id,
			CompanySubmitTable.delete_at.is_(None),
		)
		.order_by(CompanySubmitTable.created_at.desc())
		.first()
	)
	status_name = "Submitted"
	if latest_submit:
		status_row = (
			db.query(StatusTable)
			.filter(StatusTable.id == latest_submit.status_id)
			.first()
		)
		if status_row:
			status_name = status_row.name

	auditor_submit = None
	if auditor_id:
		auditor_submit = (
			db.query(AuditorSubmitTable)
			.filter(
				AuditorSubmitTable.auditor_id == auditor_id,
				AuditorSubmitTable.company_id == company_id,
				AuditorSubmitTable.delete_at.is_(None),
			)
			.order_by(AuditorSubmitTable.created_at.desc())
			.first()
		)

	results = (
		db.query(CompanyAssessmentResultTable)
		.filter(
			CompanyAssessmentResultTable.company_id == company_id,
			CompanyAssessmentResultTable.delete_at.is_(None),
		)
		.all()
	)
	overall_score = round(sum(result.score or 0 for result in results), 2)

	pillars = (
		db.query(PillarsTable)
		.filter(PillarsTable.delete_at.is_(None))
		.order_by(PillarsTable.id.asc())
		.all()
	)

	pillar_items: list[PillarItem] = []
	for pillar in pillars:
		assessments = (
			db.query(AssessmentTable)
			.filter(
				AssessmentTable.pillar_id == pillar.id,
				AssessmentTable.delete_at.is_(None),
			)
			.order_by(AssessmentTable.id.asc())
			.all()
		)
		assessment_ids = [assessment.id for assessment in assessments]
		if not assessment_ids:
			continue

		company_rows = (
			db.query(CompanyAssessmentTable)
			.filter(
				CompanyAssessmentTable.company_id == company_id,
				CompanyAssessmentTable.assessment_id.in_(assessment_ids),
				CompanyAssessmentTable.delete_at.is_(None),
			)
			.all()
		)
		company_map = {row.assessment_id: row for row in company_rows}
		company_assessment_ids = [row.id for row in company_rows]
		auditor_score_map: dict[int, AuditorScoreTable] = {}
		if auditor_id and company_assessment_ids:
			auditor_scores = (
				db.query(AuditorScoreTable)
				.filter(
					AuditorScoreTable.auditor_id == auditor_id,
					AuditorScoreTable.company_assessment_id.in_(company_assessment_ids),
					AuditorScoreTable.delete_at.is_(None),
				)
				.all()
			)
			auditor_score_map = {row.company_assessment_id: row for row in auditor_scores}
		evidence_rows = (
			db.query(EvidenceTable)
			.filter(
				EvidenceTable.company_assessment_id.in_(company_assessment_ids),
				EvidenceTable.delete_at.is_(None),
			)
			.order_by(EvidenceTable.created_at.asc())
			.all()
		) if company_assessment_ids else []
		evidence_map: dict[int, list[str]] = {}
		company_assessment_to_assessment = {row.id: row.assessment_id for row in company_rows}
		for row in evidence_rows:
			assessment_id = company_assessment_to_assessment.get(row.company_assessment_id)
			if not assessment_id:
				continue
			url = row.url or build_public_url(row.file_path)
			if not url:
				continue
			evidence_map.setdefault(assessment_id, []).append(url)
		criteria_rows = (
			db.query(EvaluationCriteriaTable)
			.filter(
				EvaluationCriteriaTable.assessment_id.in_(assessment_ids),
				EvaluationCriteriaTable.delete_at.is_(None),
			)
			.all()
		)
		criteria_map = {row.id: row for row in criteria_rows}
		criteria_by_assessment: dict[int, list[EvaluationCriteriaTable]] = {}
		for row in criteria_rows:
			criteria_by_assessment.setdefault(row.assessment_id, []).append(row)
		point_ids = [row.point_id for row in criteria_rows if row.point_id]
		points = (
			db.query(PointTable)
			.filter(PointTable.id.in_(point_ids), PointTable.delete_at.is_(None))
			.all()
		) if point_ids else []
		point_map = {row.id: row for row in points}

		questions: list[QuestionItem] = []
		for assessment in assessments:
			company_row = company_map.get(assessment.id)
			selected_criteria_id = (
				company_row.evaluation_criteria_id
				if company_row and company_row.evaluation_criteria_id
				else None
			)
			criteria_list = criteria_by_assessment.get(assessment.id, [])
			criteria_options = []
			for criteria in criteria_list:
				point = point_map.get(criteria.point_id) if criteria.point_id else None
				criteria_options.append(
					CriteriaOption(
						id=criteria.id,
						name=criteria.name,
						score=point.score if point else None,
						selected=criteria.id == selected_criteria_id,
					)
				)
			selected_option = next((opt for opt in criteria_options if opt.selected), None)

			company_assessment_id = company_row.id if company_row else None
			auditor_score_row = auditor_score_map.get(company_assessment_id) if company_assessment_id else None
			auditor_score_criteria_id = auditor_score_row.evaluation_criteria_id if auditor_score_row else None
			auditor_criteria = criteria_map.get(auditor_score_criteria_id) if auditor_score_criteria_id else None
			auditor_point = point_map.get(auditor_criteria.point_id) if auditor_criteria and auditor_criteria.point_id else None
			auditor_score_value = auditor_point.score if auditor_point else None
			questions.append(
				QuestionItem(
					id=assessment.id,
					question=assessment.title,
					description=assessment.description,
					performance_results=company_row.performance_results if company_row else None,
					answer=selected_option.name if selected_option else None,
					score=selected_option.score if selected_option else None,
					criteria_options=criteria_options,
					evidence=evidence_map.get(assessment.id, []),
					auditor_score_criteria_id=auditor_score_criteria_id,
					auditor_score_value=auditor_score_value,
				)
			)

		pillar_items.append(PillarItem(title=pillar.name, questions=questions))

	return SubmissionDetailResponse(
		company_id=company.id,
		company_name=getattr(company, "company_name", None) or getattr(company, "name", ""),
		company_type=getattr(company, "type_company", None),
		company_number_of_employees=getattr(company, "Number_of_employees", None),
		company_address=getattr(company, "address", None),
		company_evaluation=getattr(company, "evaluation", None),
		company_job_position=getattr(company, "job_position", None),
		company_date_assessment=getattr(company, "date_assessment", None),
		company_round_assessment=getattr(company, "round_assessment", None),
		submitted_at=latest_submit.created_at if latest_submit else None,
		status=status_name,
		score=overall_score,
		auditor_submitted=auditor_submit is not None,
		auditor_submitted_at=auditor_submit.created_at if auditor_submit else None,
		pillars=pillar_items,
	)
