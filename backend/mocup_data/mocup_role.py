import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import SessionLocal
from database.migrate import migrate
from entity.role import RoleTable


def seed_roles() -> None:
	db = SessionLocal()
	try:
		roles = ["admin", "company", "audit"]
		for name in roles:
			existing = db.query(RoleTable).filter(RoleTable.name == name).first()
			if existing:
				print(f"Role '{name}' already exists (id={existing.id}).")
				continue

			role = RoleTable(name=name)
			db.add(role)
			db.commit()
			db.refresh(role)
			print(f"Created role '{name}' with id={role.id}.")
	finally:
		db.close()


if __name__ == "__main__":
	migrate()
	seed_roles()
