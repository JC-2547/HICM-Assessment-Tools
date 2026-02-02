from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, Float, ForeignKey, String

from database.database import Base


class PointTable(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, index=True)
    criteria_id = Column(Integer, ForeignKey("evaluation_criteria.id"), nullable=False)
    label = Column(String(255), nullable=False)
    score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class Point(BaseModel):
    id: int
    criteria_id: int
    label: str
    score: float
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
