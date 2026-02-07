from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, Float, ForeignKey

from database.database import Base


class AuditorScoreTable(Base):
    __tablename__ = "auditor_scores"

    id = Column(Integer, primary_key=True, index=True)
    auditor_id = Column(Integer, ForeignKey("auditors.id"), nullable=False)
    company_assessment_id = Column(
        Integer, ForeignKey("company_assessments.id"), nullable=False
    )
    evaluation_criteria_id = Column(Integer, ForeignKey("evaluation_criteria.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class AuditorScore(BaseModel):
    id: int
    auditor_id: int
    company_assessment_id: int
    evaluation_criteria_id: int
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
