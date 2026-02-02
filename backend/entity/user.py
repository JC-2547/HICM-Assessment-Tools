from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey

from database.database import Base


class UserTable(Base):
	__tablename__ = "users"

	id = Column(Integer, primary_key=True, index=True)
	username = Column(String(50), unique=True, nullable=False)
	password = Column(String(255), nullable=False)
	roleid = Column(Integer, ForeignKey("roles.id"), nullable=False)
	created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
	updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
	delete_at = Column(DateTime, nullable=True)


class User(BaseModel):
	id: int
	username: str
	password: str
	roleid: int
	created_at: datetime
	updated_at: datetime
	delete_at: datetime | None = None
