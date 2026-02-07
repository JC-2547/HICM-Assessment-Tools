from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import SessionLocal
from entity.auditor import AuditorTable
from entity.auditor_score import AuditorScoreTable
from entity.auditor_submit import AuditorSubmitTable
from entity.company import CompanyTable
from entity.company_assessment import CompanyAssessmentTable
from entity.evaluation_criteria import EvaluationCriteriaTable
from entity.point import PointTable
from entity.status import StatusTable
from midlewere.midlewere import require_auth

router = APIRouter(prefix="/api/audit", tags=["audit-score"])


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


class ScoreItem(BaseModel):
	assessment_id: int
	evaluation_criteria_id: int


class SubmitScoresRequest(BaseModel):
	scores: list[ScoreItem]


class SubmitScoresResponse(BaseModel):
	processed: int
	created: int
	updated: int


class AuditorScoreView(BaseModel):
	assessment_id: int
	company_assessment_id: int
	evaluation_criteria_id: int
	score: float | None = None
	updated_at: datetime | None = None


@router.post("/submissions/{company_id}/scores", response_model=SubmitScoresResponse)
def submit_auditor_scores(
	company_id: int,
	payload: SubmitScoresRequest,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	if not payload.scores:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No scores provided")

	user_id = user.get("sub")
	if not user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	auditor = (
		db.query(AuditorTable)
		.filter(AuditorTable.user_id == int(user_id), AuditorTable.delete_at.is_(None))
		.first()
	)
	if not auditor:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Auditor not found")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.id == company_id, CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

	existing_submit = (
		db.query(AuditorSubmitTable)
		.filter(
			AuditorSubmitTable.auditor_id == auditor.id,
			AuditorSubmitTable.company_id == company_id,
			AuditorSubmitTable.delete_at.is_(None),
		)
		.first()
	)
	if existing_submit:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Scores already submitted")

	assessment_ids = {item.assessment_id for item in payload.scores}
	criteria_ids = {item.evaluation_criteria_id for item in payload.scores}

	company_assessments = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company_id,
			CompanyAssessmentTable.assessment_id.in_(assessment_ids),
			CompanyAssessmentTable.delete_at.is_(None),
		)
		.all()
	)
	company_assessment_map = {row.assessment_id: row for row in company_assessments}
	missing_assessments = assessment_ids - set(company_assessment_map.keys())
	if missing_assessments:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=f"Assessments not found for company: {sorted(missing_assessments)}",
		)

	criteria_rows = (
		db.query(EvaluationCriteriaTable)
		.filter(
			EvaluationCriteriaTable.id.in_(criteria_ids),
			EvaluationCriteriaTable.delete_at.is_(None),
		)
		.all()
	)
	criteria_map = {row.id: row for row in criteria_rows}
	missing_criteria = criteria_ids - set(criteria_map.keys())
	if missing_criteria:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=f"Criteria not found: {sorted(missing_criteria)}",
		)

	status_row = (
		db.query(StatusTable)
		.filter(StatusTable.name == "submit", StatusTable.delete_at.is_(None))
		.first()
	)
	if not status_row:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Submit status not found")

	# Validate that each criteria belongs to the corresponding assessment
	for item in payload.scores:
		criteria = criteria_map.get(item.evaluation_criteria_id)
		if not criteria or criteria.assessment_id != item.assessment_id:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"Criteria {item.evaluation_criteria_id} does not belong to assessment {item.assessment_id}",
			)

	created = 0
	updated = 0
	for item in payload.scores:
		company_assessment = company_assessment_map[item.assessment_id]
		existing = (
			db.query(AuditorScoreTable)
			.filter(
				AuditorScoreTable.auditor_id == auditor.id,
				AuditorScoreTable.company_assessment_id == company_assessment.id,
				AuditorScoreTable.delete_at.is_(None),
			)
			.first()
		)
		if existing:
			existing.evaluation_criteria_id = item.evaluation_criteria_id
			existing.updated_at = datetime.utcnow()
			updated += 1
		else:
			record = AuditorScoreTable(
				auditor_id=auditor.id,
				company_assessment_id=company_assessment.id,
				evaluation_criteria_id=item.evaluation_criteria_id,
			)
			db.add(record)
			created += 1

	submit_record = AuditorSubmitTable(
		auditor_id=auditor.id,
		company_id=company.id,
		status_id=status_row.id,
	)
	db.add(submit_record)

	db.commit()

	return SubmitScoresResponse(
		processed=len(payload.scores),
		created=created,
		updated=updated,
	)


@router.get("/submissions/{company_id}/auditor-scores", response_model=list[AuditorScoreView])
def get_auditor_scores_for_company(
	company_id: int,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	user_id = user.get("sub")
	if not user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	auditor = (
		db.query(AuditorTable)
		.filter(AuditorTable.user_id == int(user_id), AuditorTable.delete_at.is_(None))
		.first()
	)
	if not auditor:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Auditor not found")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.id == company_id, CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

	company_assessments = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company_id,
			CompanyAssessmentTable.delete_at.is_(None),
		)
		.all()
	)
	if not company_assessments:
		return []

	company_assessment_ids = [row.id for row in company_assessments]
	assessment_id_map = {row.id: row.assessment_id for row in company_assessments}

	auditor_scores = (
		db.query(AuditorScoreTable)
		.filter(
			AuditorScoreTable.auditor_id == auditor.id,
			AuditorScoreTable.company_assessment_id.in_(company_assessment_ids),
			AuditorScoreTable.delete_at.is_(None),
		)
		.all()
	)
	if not auditor_scores:
		return []

	criteria_ids = {row.evaluation_criteria_id for row in auditor_scores}
	criteria_rows = (
		db.query(EvaluationCriteriaTable)
		.filter(
			EvaluationCriteriaTable.id.in_(criteria_ids),
			EvaluationCriteriaTable.delete_at.is_(None),
		)
		.all()
	)
	criteria_map = {row.id: row for row in criteria_rows}
	point_ids = [row.point_id for row in criteria_rows if row.point_id]
	point_rows = (
		db.query(PointTable)
		.filter(PointTable.id.in_(point_ids), PointTable.delete_at.is_(None))
		.all()
	) if point_ids else []
	point_map = {row.id: row for row in point_rows}

	result: list[AuditorScoreView] = []
	for row in auditor_scores:
		criteria = criteria_map.get(row.evaluation_criteria_id)
		point = point_map.get(criteria.point_id) if criteria and criteria.point_id else None
		result.append(
			AuditorScoreView(
				assessment_id=assessment_id_map.get(row.company_assessment_id),
				company_assessment_id=row.company_assessment_id,
				evaluation_criteria_id=row.evaluation_criteria_id,
				score=point.score if point else None,
				updated_at=row.updated_at,
			)
		)

	return result
