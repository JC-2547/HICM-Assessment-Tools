import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import SessionLocal
from database.migrate import migrate
from entity.status import StatusTable


def seed_statuses() -> None:
	db = SessionLocal()
	try:
		statuses = ["savedraft", "submit"]
		for name in statuses:
			existing = db.query(StatusTable).filter(StatusTable.name == name).first()
			if existing:
				print(f"Status '{name}' already exists (id={existing.id}).")
				continue

			status = StatusTable(name=name)
			db.add(status)
			db.commit()
			db.refresh(status)
			print(f"Created status '{name}' with id={status.id}.")
	finally:
		db.close()


if __name__ == "__main__":
	migrate()
	seed_statuses()
