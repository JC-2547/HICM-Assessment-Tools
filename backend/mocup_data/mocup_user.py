import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from auth.auth import hash_password
from database.database import SessionLocal
from database.migrate import migrate
from entity.role import RoleTable
from entity.user import UserTable


def seed_user(username: str, password: str, roleid: int) -> None:
	db = SessionLocal()
	try:
		existing = db.query(UserTable).filter(UserTable.username == username).first()
		if existing:
			existing.password = hash_password(password)
			existing.roleid = roleid
			db.add(existing)
			db.commit()
			db.refresh(existing)
			print(f"Updated user '{username}' (id={existing.id}).")
			return

		user = UserTable(
			username=username,
			password=hash_password(password),
			roleid=roleid,
		)
		db.add(user)
		db.commit()
		db.refresh(user)
		print(f"Created user '{username}' with id={user.id}.")
	finally:
		db.close()

def _get_role_id(db, role_name: str) -> int | None:
	role = db.query(RoleTable).filter(RoleTable.name == role_name).first()
	return role.id if role else None


def seed_default_users() -> None:
	db = SessionLocal()
	try:
		role_map = {name: _get_role_id(db, name) for name in ["admin", "company", "audit"]}
		missing = [name for name, rid in role_map.items() if rid is None]
		if missing:
			print(f"Missing roles: {', '.join(missing)}. Run mocup_role.py first.")
			return

		seed_user("admin", "12345678", role_map["admin"])
		seed_user("companytest", "12345678", role_map["company"])
		seed_user("audittest", "12345678", role_map["audit"])
	finally:
		db.close()


if __name__ == "__main__":
	migrate()
	seed_default_users()
