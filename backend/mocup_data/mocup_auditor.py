import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import SessionLocal
from database.migrate import migrate
from entity.auditor import AuditorTable
from entity.user import UserTable


def seed_auditor(username: str) -> None:
	db = SessionLocal()
	try:
		user = db.query(UserTable).filter(UserTable.username == username).first()
		if not user:
			print(f"User '{username}' not found. Run mocup_user.py first.")
			return

		existing = db.query(AuditorTable).filter(AuditorTable.user_id == user.id).first()
		if existing:
			print(f"Auditor for user '{username}' already exists (id={existing.id}).")
			return

		auditor = AuditorTable(user_id=user.id)
		db.add(auditor)
		db.commit()
		db.refresh(auditor)
		print(f"Created auditor for user '{username}' with id={auditor.id}.")
	finally:
		db.close()


if __name__ == "__main__":
	migrate()
	seed_auditor("audittest")
