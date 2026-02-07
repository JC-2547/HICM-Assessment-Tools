from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, Float, ForeignKey

from database.database import Base


class CompanyAssessmentResultTable(Base):
	__tablename__ = "company_assessment_results"

	id = Column(Integer, primary_key=True, index=True)
	company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
	pillar_id = Column(Integer, ForeignKey("pillars.id"), nullable=False)
	score = Column(Float, nullable=True)
	created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
	updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
	delete_at = Column(DateTime, nullable=True)


class CompanyAssessmentResult(BaseModel):
	id: int
	company_id: int
	pillar_id: int
	score: float | None = None
	created_at: datetime
	updated_at: datetime
	delete_at: datetime | None = None
