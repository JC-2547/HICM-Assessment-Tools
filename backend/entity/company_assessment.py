from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, ForeignKey, String

from database.database import Base


class CompanyAssessmentTable(Base):
    __tablename__ = "company_assessments"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    performance_results = Column(String(1000), nullable=True)
    evaluation_criteria_id = Column(Integer, ForeignKey("evaluation_criteria.id"), nullable=True)
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class CompanyAssessment(BaseModel):
    id: int
    company_id: int
    assessment_id: int
    performance_results: str | None = None
    evaluation_criteria_id: int | None = None
    status_id: int | None = None
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
