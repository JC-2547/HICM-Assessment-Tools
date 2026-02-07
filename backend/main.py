from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from sqlalchemy import text

from auth.login import router as auth_router
from controller.admin.usermanagement_controller import router as admin_router
from controller.admin.aessessment_controller import router as assessment_router
from controller.company.aessesment_controller import router as company_assessment_router
from controller.company.file_assessment_controller import router as company_file_router
from controller.audit.audit_controller import router as audit_router
from controller.audit.audit_viwe_assessment import router as audit_view_router
from controller.audit.audit_score_controller import router as audit_score_router
from database.database import engine
from database.migrate import migrate

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    migrate()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],  # Next.js
    allow_origins=["*"],  # Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(admin_router)
app.include_router(assessment_router)
app.include_router(company_assessment_router)
app.include_router(company_file_router)
app.include_router(audit_router)
app.include_router(audit_view_router)
app.include_router(audit_score_router)

uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

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

