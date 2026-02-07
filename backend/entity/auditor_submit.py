from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, ForeignKey

from database.database import Base


class AuditorSubmitTable(Base):
	__tablename__ = "auditor_submits"

	id = Column(Integer, primary_key=True, index=True)
	auditor_id = Column(Integer, ForeignKey("auditors.id"), nullable=False)
	company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
	status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False)
	created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
	updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
	delete_at = Column(DateTime, nullable=True)


class AuditorSubmit(BaseModel):
	id: int
	auditor_id: int
	company_id: int
	status_id: int
	created_at: datetime
	updated_at: datetime
	delete_at: datetime | None = None