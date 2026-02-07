from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import SessionLocal
from entity.assessment import AssessmentTable
from entity.company import CompanyTable
from entity.company_assessment import CompanyAssessmentTable
from entity.evaluation_criteria import EvaluationCriteriaTable
from entity.company_submit import CompanySubmitTable
from entity.company_assessment_result import CompanyAssessmentResultTable
from entity.pillars import PillarsTable
from entity.point import PointTable
from entity.status import StatusTable
from midlewere.midlewere import require_auth

router = APIRouter(prefix="/api/company", tags=["company-assessment"])


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


class ChoiceResponse(BaseModel):
	id: int
	label: str
	score: float
	point_id: int | None = None


class QuestionResponse(BaseModel):
	id: int
	title: str
	detail: str | None = None
	choices: list[ChoiceResponse]


class PillarAssessmentResponse(BaseModel):
	key: str
	name: str
	questions: list[QuestionResponse]


class DraftItem(BaseModel):
	assessment_id: int
	evaluation_criteria_id: int | None = None
	performance_results: str | None = None


class DraftPayload(BaseModel):
	user_id: int | None = None
	items: list[DraftItem]


class DraftResponse(BaseModel):
	saved: int


class DraftItemResponse(BaseModel):
	assessment_id: int
	evaluation_criteria_id: int | None = None
	performance_results: str | None = None


class DraftListResponse(BaseModel):
	items: list[DraftItemResponse]


class SubmitPayload(BaseModel):
	user_id: int | None = None


class SubmitResponse(BaseModel):
	updated: int


class SubmitStatusResponse(BaseModel):
	submitted: bool


class SummaryStatusResponse(BaseModel):
	completed: bool
	submitted: bool
	submitted_at: str | None = None
	total: int
	answered: int


class SummarySubmitPayload(BaseModel):
	user_id: int | None = None


class SummarySubmitResponse(BaseModel):
	submitted_at: str


class PillarResultResponse(BaseModel):
	key: str
	name: str
	weight: float | None = None
	score: float
	max_score: float


class SummaryResultResponse(BaseModel):
	overall_score: float
	max_score: float
	star_count: int
	pillars: list[PillarResultResponse]


@router.get("/assessments/{pillar_key}", response_model=PillarAssessmentResponse)
def get_assessments_by_pillar(pillar_key: str, db: Session = Depends(get_db)):
	pillar = (
		db.query(PillarsTable)
		.filter(PillarsTable.key == pillar_key, PillarsTable.delete_at.is_(None))
		.first()
	)
	if not pillar:
		raise HTTPException(status_code=404, detail="Pillar not found")

	assessments = (
		db.query(AssessmentTable)
		.filter(
			AssessmentTable.pillar_id == pillar.id,
			AssessmentTable.delete_at.is_(None),
		)
		.order_by(AssessmentTable.id.asc())
		.all()
	)

	questions: list[QuestionResponse] = []
	for assessment in assessments:
		criteria_rows = (
			db.query(EvaluationCriteriaTable)
			.filter(
				EvaluationCriteriaTable.assessment_id == assessment.id,
				EvaluationCriteriaTable.delete_at.is_(None),
			)
			.order_by(EvaluationCriteriaTable.id.asc())
			.all()
		)
		point_ids = [criteria.point_id for criteria in criteria_rows if criteria.point_id]
		points = (
			db.query(PointTable)
			.filter(PointTable.id.in_(point_ids), PointTable.delete_at.is_(None))
			.all()
		) if point_ids else []
		point_map = {point.id: point for point in points}

		questions.append(
			QuestionResponse(
				id=assessment.id,
				title=assessment.title,
				detail=assessment.description,
				choices=[
					ChoiceResponse(
						id=criteria.id,
						label=criteria.name,
						score=point_map.get(criteria.point_id).score
						if criteria.point_id and point_map.get(criteria.point_id)
						else 0,
						point_id=criteria.point_id,
					)
					for criteria in criteria_rows
				],
			)
		)

	return PillarAssessmentResponse(key=pillar.key, name=pillar.name, questions=questions)


@router.post("/assessments/{pillar_key}/auto-save", response_model=DraftResponse)
def auto_save_assessment(
	pillar_key: str,
	payload: DraftPayload,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = payload.user_id or user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	pillar = (
		db.query(PillarsTable)
		.filter(PillarsTable.key == pillar_key, PillarsTable.delete_at.is_(None))
		.first()
	)
	if not pillar:
		raise HTTPException(status_code=404, detail="Pillar not found")

	assessment_ids = [item.assessment_id for item in payload.items]
	assessments = (
		db.query(AssessmentTable)
		.filter(
			AssessmentTable.id.in_(assessment_ids),
			AssessmentTable.pillar_id == pillar.id,
			AssessmentTable.delete_at.is_(None),
		)
		.all()
	)
	assessment_map = {assessment.id: assessment for assessment in assessments}
	missing = [item_id for item_id in assessment_ids if item_id not in assessment_map]
	if missing:
		raise HTTPException(status_code=400, detail="Assessment not found")

	criteria_ids = [
		item.evaluation_criteria_id
		for item in payload.items
		if item.evaluation_criteria_id is not None
	]
	criteria_rows = (
		db.query(EvaluationCriteriaTable)
		.filter(
			EvaluationCriteriaTable.id.in_(criteria_ids),
			EvaluationCriteriaTable.delete_at.is_(None),
		)
		.all()
	) if criteria_ids else []
	criteria_map = {criteria.id: criteria for criteria in criteria_rows}

	status_row = (
		db.query(StatusTable)
		.filter(StatusTable.name == "save_draft", StatusTable.delete_at.is_(None))
		.first()
	)
	status_id = status_row.id if status_row else None

	submit_status = (
		db.query(StatusTable)
		.filter(StatusTable.name == "submit", StatusTable.delete_at.is_(None))
		.first()
	)
	if submit_status:
		submitted_count = (
			db.query(CompanyAssessmentTable)
			.filter(
				CompanyAssessmentTable.company_id == company.id,
				CompanyAssessmentTable.assessment_id.in_(assessment_ids),
				CompanyAssessmentTable.status_id == submit_status.id,
				CompanyAssessmentTable.delete_at.is_(None),
			)
			.count()
		)
		if submitted_count == len(assessment_ids):
			raise HTTPException(status_code=400, detail="Assessment already submitted")

	saved = 0
	for item in payload.items:
		assessment = assessment_map.get(item.assessment_id)
		if not assessment:
			continue
		criteria_id = item.evaluation_criteria_id
		if criteria_id is not None:
			criteria = criteria_map.get(criteria_id)
			if not criteria or criteria.assessment_id != assessment.id:
				raise HTTPException(status_code=400, detail="Invalid criteria")

		record = (
			db.query(CompanyAssessmentTable)
			.filter(
				CompanyAssessmentTable.company_id == company.id,
				CompanyAssessmentTable.assessment_id == assessment.id,
				CompanyAssessmentTable.delete_at.is_(None),
			)
			.first()
		)

		if record:
			record.evaluation_criteria_id = criteria_id
			record.performance_results = item.performance_results
			record.status_id = status_id
			db.add(record)
		else:
			record = CompanyAssessmentTable(
				company_id=company.id,
				assessment_id=assessment.id,
				evaluation_criteria_id=criteria_id,
				performance_results=item.performance_results,
				status_id=status_id,
			)
			db.add(record)
		saved += 1

	db.commit()
	return DraftResponse(saved=saved)


@router.get("/assessments/{pillar_key}/draft", response_model=DraftListResponse)
def get_draft_assessments(
	pillar_key: str,
	user_id: int | None = None,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = user_id or user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	pillar = (
		db.query(PillarsTable)
		.filter(PillarsTable.key == pillar_key, PillarsTable.delete_at.is_(None))
		.first()
	)
	if not pillar:
		raise HTTPException(status_code=404, detail="Pillar not found")

	rows = (
		db.query(CompanyAssessmentTable)
		.join(
			AssessmentTable,
			AssessmentTable.id == CompanyAssessmentTable.assessment_id,
		)
		.filter(
			CompanyAssessmentTable.company_id == company.id,
			CompanyAssessmentTable.delete_at.is_(None),
			AssessmentTable.pillar_id == pillar.id,
			AssessmentTable.delete_at.is_(None),
		)
		.order_by(CompanyAssessmentTable.assessment_id.asc())
		.all()
	)

	items = [
		DraftItemResponse(
			assessment_id=row.assessment_id,
			evaluation_criteria_id=row.evaluation_criteria_id,
			performance_results=row.performance_results,
		)
		for row in rows
	]

	return DraftListResponse(items=items)


@router.post("/assessments/{pillar_key}/submit", response_model=SubmitResponse)
def submit_pillar_assessments(
	pillar_key: str,
	payload: SubmitPayload,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = payload.user_id or user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	pillar = (
		db.query(PillarsTable)
		.filter(PillarsTable.key == pillar_key, PillarsTable.delete_at.is_(None))
		.first()
	)
	if not pillar:
		raise HTTPException(status_code=404, detail="Pillar not found")

	status_row = (
		db.query(StatusTable)
		.filter(StatusTable.name == "submit", StatusTable.delete_at.is_(None))
		.first()
	)
	if not status_row:
		raise HTTPException(status_code=400, detail="Submit status not found")

	assessments = (
		db.query(AssessmentTable)
		.filter(
			AssessmentTable.pillar_id == pillar.id,
			AssessmentTable.delete_at.is_(None),
		)
		.all()
	)
	assessment_ids = [assessment.id for assessment in assessments]

	rows = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company.id,
			CompanyAssessmentTable.assessment_id.in_(assessment_ids),
			CompanyAssessmentTable.delete_at.is_(None),
		)
		.all()
	)
	rows_map = {row.assessment_id: row for row in rows}

	updated = 0
	for assessment_id in assessment_ids:
		record = rows_map.get(assessment_id)
		if record:
			record.status_id = status_row.id
			db.add(record)
			updated += 1
		else:
			record = CompanyAssessmentTable(
				company_id=company.id,
				assessment_id=assessment_id,
				status_id=status_row.id,
			)
			db.add(record)
			updated += 1

	db.commit()
	return SubmitResponse(updated=updated)


@router.get("/assessments/{pillar_key}/submit-status", response_model=SubmitStatusResponse)
def get_submit_status(
	pillar_key: str,
	user_id: int | None = None,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = user_id or user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	pillar = (
		db.query(PillarsTable)
		.filter(PillarsTable.key == pillar_key, PillarsTable.delete_at.is_(None))
		.first()
	)
	if not pillar:
		raise HTTPException(status_code=404, detail="Pillar not found")

	status_row = (
		db.query(StatusTable)
		.filter(StatusTable.name == "submit", StatusTable.delete_at.is_(None))
		.first()
	)
	if not status_row:
		return SubmitStatusResponse(submitted=False)

	assessment_ids = [
		assessment.id
		for assessment in db.query(AssessmentTable)
		.filter(
			AssessmentTable.pillar_id == pillar.id,
			AssessmentTable.delete_at.is_(None),
		)
		.all()
	]
	if not assessment_ids:
		return SubmitStatusResponse(submitted=False)

	count = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company.id,
			CompanyAssessmentTable.assessment_id.in_(assessment_ids),
			CompanyAssessmentTable.status_id == status_row.id,
			CompanyAssessmentTable.delete_at.is_(None),
		)
		.count()
	)

	return SubmitStatusResponse(submitted=count == len(assessment_ids))


@router.get("/assessment-summary/status", response_model=SummaryStatusResponse)
def get_summary_status(
	user_id: int | None = None,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = user_id or user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	total = (
		db.query(AssessmentTable)
		.filter(AssessmentTable.delete_at.is_(None))
		.count()
	)

	answered = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company.id,
			CompanyAssessmentTable.delete_at.is_(None),
			CompanyAssessmentTable.evaluation_criteria_id.isnot(None),
		)
		.count()
	)

	latest_submit = (
		db.query(CompanySubmitTable)
		.filter(
			CompanySubmitTable.company_id == company.id,
			CompanySubmitTable.delete_at.is_(None),
		)
		.order_by(CompanySubmitTable.created_at.desc())
		.first()
	)

	return SummaryStatusResponse(
		completed=total > 0 and answered >= total,
		submitted=latest_submit is not None,
		submitted_at=latest_submit.created_at.isoformat() if latest_submit else None,
		total=total,
		answered=answered,
	)


@router.post("/assessment-summary/submit", response_model=SummarySubmitResponse)
def submit_assessment_summary(
	payload: SummarySubmitPayload,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = payload.user_id or user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	status_row = (
		db.query(StatusTable)
		.filter(StatusTable.name == "submit", StatusTable.delete_at.is_(None))
		.first()
	)
	if not status_row:
		raise HTTPException(status_code=400, detail="Submit status not found")

	total = (
		db.query(AssessmentTable)
		.filter(AssessmentTable.delete_at.is_(None))
		.count()
	)
	answered = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company.id,
			CompanyAssessmentTable.delete_at.is_(None),
			CompanyAssessmentTable.evaluation_criteria_id.isnot(None),
		)
		.count()
	)
	if total == 0 or answered < total:
		raise HTTPException(status_code=400, detail="Assessment not completed")

	record = CompanySubmitTable(company_id=company.id, status_id=status_row.id)
	db.add(record)
	db.commit()
	db.refresh(record)

	return SummarySubmitResponse(submitted_at=record.created_at.isoformat())


def map_point_to_score(point_score: float) -> float:
	lookup = {
		0.0: 0.0,
		0.25: 5.0,
		0.5: 10.0,
		0.75: 15.0,
		1.0: 20.0,
	}
	return lookup.get(round(point_score, 2), 0.0)


@router.get("/assessment-summary/results", response_model=SummaryResultResponse)
def get_assessment_summary_results(
	user_id: int | None = None,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = user_id or user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	pillars = (
		db.query(PillarsTable)
		.filter(PillarsTable.delete_at.is_(None))
		.order_by(PillarsTable.id.asc())
		.all()
	)

	results: list[PillarResultResponse] = []
	for pillar in pillars:
		assessments = (
			db.query(AssessmentTable)
			.filter(
				AssessmentTable.pillar_id == pillar.id,
				AssessmentTable.delete_at.is_(None),
			)
			.all()
		)
		assessment_ids = [assessment.id for assessment in assessments]
		if not assessment_ids:
			results.append(
				PillarResultResponse(
					key=pillar.key,
					name=pillar.name,
					weight=pillar.weight,
					score=0.0,
					max_score=float(pillar.weight or 0),
				)
			)
			continue

		company_rows = (
			db.query(CompanyAssessmentTable)
			.filter(
				CompanyAssessmentTable.company_id == company.id,
				CompanyAssessmentTable.assessment_id.in_(assessment_ids),
				CompanyAssessmentTable.delete_at.is_(None),
			)
			.all()
		)
		criteria_by_assessment = {
			row.assessment_id: row.evaluation_criteria_id
			for row in company_rows
			if row.evaluation_criteria_id
		}
		criteria_ids = list(criteria_by_assessment.values())
		criteria_rows = (
			db.query(EvaluationCriteriaTable)
			.filter(
				EvaluationCriteriaTable.id.in_(criteria_ids),
				EvaluationCriteriaTable.delete_at.is_(None),
			)
			.all()
		) if criteria_ids else []
		criteria_to_point = {row.id: row.point_id for row in criteria_rows if row.point_id}
		point_ids = list(criteria_to_point.values())
		point_rows = (
			db.query(PointTable)
			.filter(PointTable.id.in_(point_ids), PointTable.delete_at.is_(None))
			.all()
		) if point_ids else []
		point_scores = {row.id: row.score for row in point_rows}

		raw_score = 0.0
		for assessment_id in assessment_ids:
			criteria_id = criteria_by_assessment.get(assessment_id)
			if not criteria_id:
				continue
			point_id = criteria_to_point.get(criteria_id)
			if not point_id:
				continue
			point_score = point_scores.get(point_id)
			if point_score is None:
				continue
			raw_score += map_point_to_score(point_score)

		max_raw = float(len(assessment_ids) * 20)
		weight = float(pillar.weight or 0)
		if weight > 0 and max_raw > 0:
			weighted_score = (raw_score / max_raw) * weight
			max_score = weight
		else:
			weighted_score = raw_score
			max_score = max_raw

		result_row = (
			db.query(CompanyAssessmentResultTable)
			.filter(
				CompanyAssessmentResultTable.company_id == company.id,
				CompanyAssessmentResultTable.pillar_id == pillar.id,
				CompanyAssessmentResultTable.delete_at.is_(None),
			)
			.first()
		)
		if result_row:
			result_row.score = weighted_score
			db.add(result_row)
		else:
			db.add(
				CompanyAssessmentResultTable(
					company_id=company.id,
					pillar_id=pillar.id,
					score=weighted_score,
				)
			)

		results.append(
			PillarResultResponse(
				key=pillar.key,
				name=pillar.name,
				weight=pillar.weight,
				score=round(weighted_score, 2),
				max_score=round(max_score, 2),
			)
		)

	db.commit()

	overall_score = round(sum(item.score for item in results), 2)
	max_score = round(sum(item.max_score for item in results), 2)
	star_count = 0
	if max_score > 0:
		star_count = max(0, min(5, round((overall_score / max_score) * 5)))

	return SummaryResultResponse(
		overall_score=overall_score,
		max_score=max_score,
		star_count=star_count,
		pillars=results,
	)
