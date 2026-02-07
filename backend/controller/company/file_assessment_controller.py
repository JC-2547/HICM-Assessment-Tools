import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import SessionLocal
from entity.assessment import AssessmentTable
from entity.company import CompanyTable
from entity.company_assessment import CompanyAssessmentTable
from entity.evidence import EvidenceTable
from midlewere.midlewere import require_auth

router = APIRouter(prefix="/api/company", tags=["company-evidence"])


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


class EvidenceItem(BaseModel):
	id: int
	file_path: str | None = None
	url: str | None = None


class EvidenceUploadResponse(BaseModel):
	items: list[EvidenceItem]


class EvidenceListResponse(BaseModel):
	items: list[EvidenceItem]


class EvidenceDeleteResponse(BaseModel):
	success: bool


def ensure_upload_dir() -> Path:
	base_dir = Path(__file__).resolve().parents[3]
	upload_dir = base_dir / "uploads" / "evidence"
	upload_dir.mkdir(parents=True, exist_ok=True)
	return upload_dir


def build_public_url(file_path: str | None) -> str | None:
	if not file_path:
		return None
	file_name = Path(file_path).name
	if not file_name:
		return None
	return f"/uploads/evidence/{file_name}"


@router.post("/assessments/{assessment_id}/evidence", response_model=EvidenceUploadResponse)
def upload_evidence(
	assessment_id: int,
	files: List[UploadFile] = File(...),
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=401, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	assessment = (
		db.query(AssessmentTable)
		.filter(AssessmentTable.id == assessment_id, AssessmentTable.delete_at.is_(None))
		.first()
	)
	if not assessment:
		raise HTTPException(status_code=404, detail="Assessment not found")

	company_assessment = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company.id,
			CompanyAssessmentTable.assessment_id == assessment_id,
			CompanyAssessmentTable.delete_at.is_(None),
		)
		.first()
	)
	if not company_assessment:
		company_assessment = CompanyAssessmentTable(
			company_id=company.id,
			assessment_id=assessment_id,
			performance_results=None,
			created_at=datetime.utcnow(),
			updated_at=datetime.utcnow(),
		)
		db.add(company_assessment)
		db.flush()

	upload_dir = ensure_upload_dir()
	items: list[EvidenceItem] = []
	for file in files:
		if not file.filename:
			continue
		safe_name = f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
		file_path = upload_dir / safe_name
		with file_path.open("wb") as buffer:
			buffer.write(file.file.read())

		evidence = EvidenceTable(
			company_assessment_id=company_assessment.id,
			file_path=str(file_path),
			created_at=datetime.utcnow(),
			updated_at=datetime.utcnow(),
		)
		db.add(evidence)
		db.flush()
		items.append(
			EvidenceItem(
				id=evidence.id,
				file_path=evidence.file_path,
				url=build_public_url(evidence.file_path),
			)
		)

	db.commit()
	return EvidenceUploadResponse(items=items)


@router.get("/assessments/{assessment_id}/evidence", response_model=EvidenceListResponse)
def list_evidence(
	assessment_id: int,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=401, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	company_assessment = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company.id,
			CompanyAssessmentTable.assessment_id == assessment_id,
			CompanyAssessmentTable.delete_at.is_(None),
		)
		.first()
	)
	if not company_assessment:
		return EvidenceListResponse(items=[])

	evidence_rows = (
		db.query(EvidenceTable)
		.filter(
			EvidenceTable.company_assessment_id == company_assessment.id,
			EvidenceTable.delete_at.is_(None),
		)
		.order_by(EvidenceTable.created_at.asc())
		.all()
	)

	items = [
		EvidenceItem(
			id=row.id,
			file_path=row.file_path,
			url=build_public_url(row.file_path),
		)
		for row in evidence_rows
	]
	return EvidenceListResponse(items=items)


@router.delete(
	"/assessments/{assessment_id}/evidence/{evidence_id}",
	response_model=EvidenceDeleteResponse,
)
def delete_evidence(
	assessment_id: int,
	evidence_id: int,
	db: Session = Depends(get_db),
	user: dict = Depends(require_auth),
):
	resolved_user_id = user.get("sub")
	if not resolved_user_id:
		raise HTTPException(status_code=401, detail="Invalid token")

	company = (
		db.query(CompanyTable)
		.filter(CompanyTable.user_id == int(resolved_user_id), CompanyTable.delete_at.is_(None))
		.first()
	)
	if not company:
		raise HTTPException(status_code=404, detail="Company not found")

	company_assessment = (
		db.query(CompanyAssessmentTable)
		.filter(
			CompanyAssessmentTable.company_id == company.id,
			CompanyAssessmentTable.assessment_id == assessment_id,
			CompanyAssessmentTable.delete_at.is_(None),
		)
		.first()
	)
	if not company_assessment:
		raise HTTPException(status_code=404, detail="Assessment not found")

	evidence = (
		db.query(EvidenceTable)
		.filter(
			EvidenceTable.id == evidence_id,
			EvidenceTable.company_assessment_id == company_assessment.id,
			EvidenceTable.delete_at.is_(None),
		)
		.first()
	)
	if not evidence:
		raise HTTPException(status_code=404, detail="Evidence not found")

	if evidence.file_path:
		try:
			file_path = Path(evidence.file_path)
			if file_path.exists():
				file_path.unlink()
		except OSError:
			pass

	evidence.delete_at = datetime.utcnow()
	evidence.updated_at = datetime.utcnow()
	db.commit()
	return EvidenceDeleteResponse(success=True)
