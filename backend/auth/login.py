from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.auth import create_access_token, hash_password, verify_password
from database.database import SessionLocal
from entity.role import RoleTable
from entity.user import UserTable

# router = APIRouter(prefix="/api", tags=["auth"])
router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    roleid: int
    role_name: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserTable).filter(UserTable.username == payload.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not verify_password(payload.password, user.password):
        if user.password != payload.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        user.password = hash_password(payload.password)
        db.add(user)
        db.commit()
        db.refresh(user)

    role = db.query(RoleTable).filter(RoleTable.id == user.roleid).first()
    role_name = role.name if role else ""

    token = create_access_token({"sub": str(user.id), "roleid": user.roleid})
    return LoginResponse(
        access_token=token,
        user_id=user.id,
        roleid=user.roleid,
        role_name=role_name,
    )
