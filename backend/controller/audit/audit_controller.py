from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import SessionLocal
from entity.company import CompanyTable
from entity.company_submit import CompanySubmitTable
from entity.company_assessment_result import CompanyAssessmentResultTable
from entity.status import StatusTable
from midlewere.midlewere import require_auth

router = APIRouter(prefix="/api/audit", tags=["audit"])


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


class SubmissionItem(BaseModel):
	company_id: int
	company_name: str
	submitted_at: datetime
	status: str
	score: float


@router.get("/submissions", response_model=list[SubmissionItem])
def list_submissions(
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	rows = (
		db.query(CompanySubmitTable)
		.filter(CompanySubmitTable.delete_at.is_(None))
		.order_by(CompanySubmitTable.company_id.asc(), CompanySubmitTable.created_at.desc())
		.all()
	)

	latest_by_company: dict[int, CompanySubmitTable] = {}
	for row in rows:
		if row.company_id not in latest_by_company:
			latest_by_company[row.company_id] = row

	company_ids = list(latest_by_company.keys())
	companies = (
		db.query(CompanyTable)
		.filter(CompanyTable.id.in_(company_ids), CompanyTable.delete_at.is_(None))
		.all()
	) if company_ids else []
	company_map = {company.id: company for company in companies}

	status_ids = list({row.status_id for row in latest_by_company.values()})
	statuses = (
		db.query(StatusTable)
		.filter(StatusTable.id.in_(status_ids), StatusTable.delete_at.is_(None))
		.all()
	) if status_ids else []
	status_map = {status.id: status for status in statuses}

	results = (
		db.query(CompanyAssessmentResultTable)
		.filter(CompanyAssessmentResultTable.company_id.in_(company_ids))
		.all()
	) if company_ids else []
	score_map: dict[int, float] = {}
	for result in results:
		score_map[result.company_id] = score_map.get(result.company_id, 0) + (result.score or 0)

	items: list[SubmissionItem] = []
	for company_id, submit in latest_by_company.items():
		company = company_map.get(company_id)
		if not company:
			continue
		status = status_map.get(submit.status_id)
		items.append(
			SubmissionItem(
				company_id=company_id,
				company_name=company.company_name,
				submitted_at=submit.created_at,
				status=status.name if status else "Submitted",
				score=round(score_map.get(company_id, 0), 2),
			)
		)

	return items
