from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey

from database.database import Base


class CompanyTable(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    company_name = Column(String(255), nullable=False)
    type_company = Column(String(255), nullable=True)
    Number_of_employees = Column(Integer, nullable=True)
    address = Column(String(255), nullable=True)
    evaluation = Column(String(255), nullable=True)
    job_position = Column(String(255), nullable=True)
    date_assessment = Column(DateTime, nullable=True)
    round_assessment = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delete_at = Column(DateTime, nullable=True)


class Company(BaseModel):
    id: int
    user_id: int | None = None
    company_name: str
    type_company: str | None = None
    Number_of_employees: int | None = None
    address: str | None = None
    evaluation: str | None = None
    job_position: str | None = None
    date_assessment: datetime | None = None
    round_assessment: str | None = None
    created_at: datetime
    updated_at: datetime
    delete_at: datetime | None = None
