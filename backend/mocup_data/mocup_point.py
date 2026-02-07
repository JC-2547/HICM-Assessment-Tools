import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database.database import SessionLocal
from entity.point import PointTable


def seed_points() -> None:
	db = SessionLocal()
	try:
		scores = [0, 0.25, 0.5, 0.75, 1.0]
		for score in scores:
			existing = (
				db.query(PointTable)
				.filter(PointTable.score == score, PointTable.delete_at.is_(None))
				.first()
			)
			if existing:
				existing.updated_at = datetime.utcnow()
				db.add(existing)
			else:
				db.add(PointTable(score=score))
		db.commit()
	finally:
		db.close()


if __name__ == "__main__":
	seed_points()
