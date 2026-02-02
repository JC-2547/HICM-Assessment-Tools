from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from auth.login import router as auth_router
from controller.admin.usermanagement_controller import router as admin_router
from controller.admin.aessessment_controller import router as assessment_router
from database.database import engine
from database.migrate import migrate

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    migrate()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(assessment_router)

@app.get("/")
def root():
    return {"message": "Backend running"}


@app.get("/api/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as error:
        return {"status": "error", "database": "disconnected", "detail": str(error)}


@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)

