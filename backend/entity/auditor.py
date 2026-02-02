from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, ForeignKey

from database.database import Base


class AuditorTable(Base):
    __tablename__ = "auditors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class Auditor(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
