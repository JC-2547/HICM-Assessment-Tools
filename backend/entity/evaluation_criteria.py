from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, Text, Float, ForeignKey

from database.database import Base


class EvaluationCriteriaTable(Base):
    __tablename__ = "evaluation_criteria"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class EvaluationCriteria(BaseModel):
    id: int
    assessment_id: int
    name: str
    description: str | None = None
    weight: float | None = None
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
