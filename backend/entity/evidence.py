from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey

from database.database import Base


class EvidenceTable(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)
    company_assessment_id = Column(
        Integer, ForeignKey("company_assessments.id"), nullable=False
    )
    url = Column(String(500), nullable=True)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class Evidence(BaseModel):
    id: int
    company_assessment_id: int
    url: str | None = None
    file_path: str | None = None
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
