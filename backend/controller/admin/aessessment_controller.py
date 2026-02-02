from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import SessionLocal
from entity.assessment import AssessmentTable
from entity.evaluation_criteria import EvaluationCriteriaTable
from entity.pillars import PillarsTable

router = APIRouter(prefix="/api/admin", tags=["assessment"])


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


class ChoicePayload(BaseModel):
	label: str
	score: float


class QuestionPayload(BaseModel):
	title: str
	detail: str | None = None
	choices: list[ChoicePayload]
	assessment_id: int | None = None


class PillarPayload(BaseModel):
	name: str
	questions: list[QuestionPayload]


class ChoiceResponse(BaseModel):
	label: str
	score: float


class QuestionResponse(BaseModel):
	assessment_id: int
	title: str
	detail: str | None = None
	choices: list[ChoiceResponse]


class PillarResponse(BaseModel):
	name: str
	questions: list[QuestionResponse]



def get_or_create_pillar(db: Session, pillar_key: str, name: str) -> PillarsTable:
	pillar = (
		db.query(PillarsTable)
		.filter(
			PillarsTable.key == pillar_key,
			PillarsTable.delete_at.is_(None),
		)
		.first()
	)
	if pillar:
		if name and pillar.name != name:
			pillar.name = name
			db.add(pillar)
			db.commit()
			db.refresh(pillar)
		return pillar

	pillar = PillarsTable(
		assessment_id=None,
		key=pillar_key,
		name=name or pillar_key,
		description=None,
	)
	db.add(pillar)
	db.commit()
	db.refresh(pillar)
	return pillar


@router.get("/assessment-builder/{pillar_key}", response_model=PillarResponse)
def get_pillar_builder(pillar_key: str, db: Session = Depends(get_db)):
	pillar = get_or_create_pillar(db, pillar_key, pillar_key)

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
		questions.append(
			QuestionResponse(
				assessment_id=assessment.id,
				title=assessment.title,
				detail=assessment.description,
				choices=[
					ChoiceResponse(label=criteria.name, score=criteria.weight or 0)
					for criteria in criteria_rows
				],
			)
		)

	return PillarResponse(name=pillar.name, questions=questions)


@router.post("/assessment-builder/{pillar_key}", response_model=PillarResponse)
def save_pillar_builder(
	pillar_key: str,
	payload: PillarPayload,
	db: Session = Depends(get_db),
):
	pillar = get_or_create_pillar(db, pillar_key, payload.name)

	for question in payload.questions:
		assessment = AssessmentTable(
			pillar_id=pillar.id,
			title=question.title,
			description=question.detail,
		)
		db.add(assessment)
		db.commit()
		db.refresh(assessment)

		for choice in question.choices:
			criteria = EvaluationCriteriaTable(
				assessment_id=assessment.id,
				name=choice.label,
				description=None,
				weight=choice.score,
			)
			db.add(criteria)

		db.commit()

	return get_pillar_builder(pillar_key, db)


@router.put("/assessment-builder/{pillar_key}/{assessment_id}", response_model=QuestionResponse)
def update_assessment_builder(
	pillar_key: str,
	assessment_id: int,
	payload: QuestionPayload,
	db: Session = Depends(get_db),
):
	pillar = get_or_create_pillar(db, pillar_key, payload.title or pillar_key)
	assessment = (
		db.query(AssessmentTable)
		.filter(
			AssessmentTable.id == assessment_id,
			AssessmentTable.pillar_id == pillar.id,
			AssessmentTable.delete_at.is_(None),
		)
		.first()
	)
	if not assessment:
		raise ValueError("Assessment not found")

	assessment.title = payload.title
	assessment.description = payload.detail
	db.add(assessment)
	db.commit()
	db.refresh(assessment)

	criteria_rows = (
		db.query(EvaluationCriteriaTable)
		.filter(
			EvaluationCriteriaTable.assessment_id == assessment.id,
			EvaluationCriteriaTable.delete_at.is_(None),
		)
		.all()
	)
	for criteria in criteria_rows:
		criteria.delete_at = datetime.utcnow()
		db.add(criteria)
		db.commit()

	for choice in payload.choices:
		criteria = EvaluationCriteriaTable(
			assessment_id=assessment.id,
			name=choice.label,
			description=None,
			weight=choice.score,
		)
		db.add(criteria)
		db.commit()

	return QuestionResponse(
		assessment_id=assessment.id,
		title=assessment.title,
		detail=assessment.description,
		choices=[ChoiceResponse(label=choice.label, score=choice.score) for choice in payload.choices],
	)
