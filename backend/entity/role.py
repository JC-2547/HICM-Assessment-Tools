from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String

from database.database import Base


class RoleTable(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class Role(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
