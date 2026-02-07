from datetime import datetime
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database.database import SessionLocal
from entity.pillars import PillarsTable


def seed_pillars() -> None:
	db = SessionLocal()
	try:
		pillars = [
			{"key": "pillar-1", "name": "Health Promotion (H1)", "weight": 300.0}, 
			{"key": "pillar-2", "name": "Industrial Safety & Environment (I2)", "weight": 300.0},
			{"key": "pillar-3", "name": "Community Engagement (C3)", "weight": 200.0},
			{"key": "pillar-4", "name": "Management & Sustainability (M4)", "weight": 200.0},
		]

		for pillar in pillars:
			existing = (
				db.query(PillarsTable)
				.filter(PillarsTable.key == pillar["key"], PillarsTable.delete_at.is_(None))
				.first()
			)
			if existing:
				existing.name = pillar["name"]
				existing.weight = pillar["weight"]
				existing.updated_at = datetime.utcnow()
				db.add(existing)
			else:
				db.add(PillarsTable(key=pillar["key"], name=pillar["name"], weight=pillar["weight"]))

		db.commit()
	finally:
		db.close()


if __name__ == "__main__":
	seed_pillars()
