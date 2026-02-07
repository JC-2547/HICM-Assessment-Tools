from sqlalchemy import text

from database.database import Base, engine
from entity.assessment import AssessmentTable
from entity.auditor import AuditorTable
from entity.auditor_score import AuditorScoreTable
from entity.company import CompanyTable
from entity.company_assessment import CompanyAssessmentTable
from entity.evaluation_criteria import EvaluationCriteriaTable
from entity.evidence import EvidenceTable
from entity.pillars import PillarsTable
from entity.point import PointTable
from entity.role import RoleTable
from entity.status import StatusTable
from entity.user import UserTable
from entity.company_submit import CompanySubmitTable
from entity.company_assessment_result import CompanyAssessmentResultTable
from entity.auditor_submit import AuditorSubmitTable


def migrate() -> None:
	Base.metadata.create_all(bind=engine)
	with engine.begin() as connection:
		connection.execute(
			text("ALTER TABLE pillars ADD COLUMN IF NOT EXISTS key VARCHAR(255)")
		)
		connection.execute(
			text(
				"""
				DO $$
				BEGIN
				    IF EXISTS (
				        SELECT 1
				        FROM information_schema.columns
				        WHERE table_name = 'pillars'
				          AND column_name = 'assessment_id'
				    ) THEN
				        ALTER TABLE pillars ALTER COLUMN assessment_id DROP NOT NULL;
				    END IF;
				END $$;
				"""
			)
		)
		connection.execute(
			text("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS pillar_id INTEGER")
		)
		connection.execute(
			text(
				"ALTER TABLE evaluation_criteria ADD COLUMN IF NOT EXISTS assessment_id INTEGER"
			)
		)
		connection.execute(
			text(
				"ALTER TABLE evaluation_criteria ADD COLUMN IF NOT EXISTS point_id INTEGER"
			)
		)
		connection.execute(
			text(
				"""
				DO $$
				BEGIN
				    IF EXISTS (
				        SELECT 1
				        FROM information_schema.columns
				        WHERE table_name = 'evaluation_criteria'
				          AND column_name = 'pillar_id'
				    ) THEN
				        ALTER TABLE evaluation_criteria ALTER COLUMN pillar_id DROP NOT NULL;
				    END IF;
				END $$;
				"""
			)
		)
		connection.execute(
			text(
				"ALTER TABLE evidences ADD COLUMN IF NOT EXISTS company_assessment_id INTEGER"
			)
		)
		connection.execute(
			text(
				"ALTER TABLE company_submits ADD COLUMN IF NOT EXISTS status_id INTEGER"
			)
		)


if __name__ == "__main__":
	migrate()
