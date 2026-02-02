from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.auth import hash_password
from database.database import SessionLocal
from entity.role import RoleTable
from entity.user import UserTable

router = APIRouter(prefix="/api/admin", tags=["admin"])


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


class RoleResponse(BaseModel):
	id: int
	name: str


class UserResponse(BaseModel):
	id: int
	username: str
	roleid: int
	role_name: str


class CreateUserRequest(BaseModel):
	username: str
	password: str
	roleid: int


class UpdateUserRequest(BaseModel):
	username: str | None = None
	password: str | None = None
	roleid: int | None = None


@router.get("/roles", response_model=list[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
	roles = db.query(RoleTable).order_by(RoleTable.id.asc()).all()
	return [RoleResponse(id=role.id, name=role.name) for role in roles]


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
	users = (
		db.query(UserTable, RoleTable)
		.join(RoleTable, RoleTable.id == UserTable.roleid)
		.filter(UserTable.delete_at.is_(None))
		.order_by(UserTable.id.asc())
		.all()
	)

	return [
		UserResponse(
			id=user.id,
			username=user.username,
			roleid=user.roleid,
			role_name=role.name,
		)
		for user, role in users
	]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: CreateUserRequest, db: Session = Depends(get_db)):
	existing = db.query(UserTable).filter(UserTable.username == payload.username).first()
	if existing:
		raise HTTPException(status_code=400, detail="Username already exists")

	role = db.query(RoleTable).filter(RoleTable.id == payload.roleid).first()
	if not role:
		raise HTTPException(status_code=400, detail="Invalid role")

	user = UserTable(
		username=payload.username,
		password=hash_password(payload.password),
		roleid=payload.roleid,
	)
	db.add(user)
	db.commit()
	db.refresh(user)

	return UserResponse(
		id=user.id,
		username=user.username,
		roleid=user.roleid,
		role_name=role.name,
	)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, payload: UpdateUserRequest, db: Session = Depends(get_db)):
	user = db.query(UserTable).filter(UserTable.id == user_id).first()
	if not user or user.delete_at is not None:
		raise HTTPException(status_code=404, detail="User not found")

	if payload.username:
		existing = (
			db.query(UserTable)
			.filter(UserTable.username == payload.username, UserTable.id != user_id)
			.first()
		)
		if existing:
			raise HTTPException(status_code=400, detail="Username already exists")
		user.username = payload.username

	if payload.password:
		user.password = hash_password(payload.password)

	if payload.roleid is not None:
		role = db.query(RoleTable).filter(RoleTable.id == payload.roleid).first()
		if not role:
			raise HTTPException(status_code=400, detail="Invalid role")
		user.roleid = payload.roleid

	db.add(user)
	db.commit()
	db.refresh(user)

	role = db.query(RoleTable).filter(RoleTable.id == user.roleid).first()
	return UserResponse(
		id=user.id,
		username=user.username,
		roleid=user.roleid,
		role_name=role.name if role else "",
	)


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
	user = db.query(UserTable).filter(UserTable.id == user_id).first()
	if not user or user.delete_at is not None:
		raise HTTPException(status_code=404, detail="User not found")

	user.delete_at = datetime.utcnow()
	db.add(user)
	db.commit()

	return {"status": "deleted"}
