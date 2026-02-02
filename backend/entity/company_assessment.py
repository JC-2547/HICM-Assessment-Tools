from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, ForeignKey

from database.database import Base


class CompanyAssessmentTable(Base):
    __tablename__ = "company_assessments"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=True)
    auditor_id = Column(Integer, ForeignKey("auditors.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class CompanyAssessment(BaseModel):
    id: int
    company_id: int
    assessment_id: int
    status_id: int | None = None
    auditor_id: int | None = None
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
