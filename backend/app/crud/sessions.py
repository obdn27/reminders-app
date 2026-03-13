from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.session import SessionRecord


def create_session_record(
    db: Session,
    *,
    user_id: int,
    session_type: str,
    anchor_type: str | None,
    category: str,
    planned_minutes: int,
    completed_minutes: int,
) -> SessionRecord:
    record = SessionRecord(
        user_id=user_id,
        session_type=session_type,
        anchor_type=anchor_type,
        category=category,
        planned_minutes=planned_minutes,
        completed_minutes=completed_minutes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_today_minutes_by_type(db: Session, *, user_id: int, session_type: str) -> int:
    total = (
        db.query(func.coalesce(func.sum(SessionRecord.completed_minutes), 0))
        .filter(SessionRecord.user_id == user_id)
        .filter(SessionRecord.session_type == session_type)
        .filter(func.date(SessionRecord.completed_at) == date.today())
        .scalar()
    )
    return int(total or 0)
