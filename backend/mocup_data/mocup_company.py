import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import SessionLocal
from database.migrate import migrate
from entity.company import CompanyTable
from entity.user import UserTable


def seed_company(company_name: str, username: str) -> None:
	db = SessionLocal()
	try:
		user = db.query(UserTable).filter(UserTable.username == username).first()
		if not user:
			print(f"User '{username}' not found. Run mocup_user.py first.")
			return

		existing = db.query(CompanyTable).filter(CompanyTable.name == company_name).first()
		if existing:
			print(f"Company '{company_name}' already exists (id={existing.id}).")
			return

		company = CompanyTable(name=company_name, user_id=user.id)
		db.add(company)
		db.commit()
		db.refresh(company)
		print(f"Created company '{company_name}' with id={company.id}.")
	finally:
		db.close()


if __name__ == "__main__":
	migrate()
	seed_company("Company Test", "companytest")
