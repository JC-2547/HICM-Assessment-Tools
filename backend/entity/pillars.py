from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey

from database.database import Base


class PillarsTable(Base):
    __tablename__ = "pillars"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    key = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class Pillars(BaseModel):
    id: int
    assessment_id: int | None = None
    key: str
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
