from datetime import date, timedelta

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.daily_progress import DailyProgress
from app.models.discipline_state import UserDisciplineState


def get_daily_progress_by_date(db: Session, user_id: int, target_date: date) -> DailyProgress | None:
    return (
        db.query(DailyProgress)
        .filter(DailyProgress.user_id == user_id, DailyProgress.date == target_date)
        .first()
    )


def create_or_get_daily_progress(db: Session, user_id: int, target_date: date) -> DailyProgress:
    existing = get_daily_progress_by_date(db, user_id, target_date)
    if existing:
        return existing

    row = DailyProgress(user_id=user_id, date=target_date)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def save_daily_progress(db: Session, row: DailyProgress) -> DailyProgress:
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_recent_daily_progress(
    db: Session,
    user_id: int,
    *,
    days: int = 14,
    reference_date: date | None = None,
) -> list[DailyProgress]:
    anchor_date = reference_date or date.today()
    since = anchor_date - timedelta(days=days)
    return (
        db.query(DailyProgress)
        .filter(
            DailyProgress.user_id == user_id,
            DailyProgress.date >= since,
            DailyProgress.date < anchor_date,
        )
        .order_by(desc(DailyProgress.date))
        .all()
    )


def get_daily_progress_in_range(
    db: Session,
    *,
    user_id: int,
    start_date: date,
    end_date: date,
) -> list[DailyProgress]:
    return (
        db.query(DailyProgress)
        .filter(
            DailyProgress.user_id == user_id,
            DailyProgress.date >= start_date,
            DailyProgress.date <= end_date,
        )
        .order_by(DailyProgress.date.asc())
        .all()
    )


def get_daily_progress_history(db: Session, *, user_id: int, limit: int = 30) -> list[DailyProgress]:
    return (
        db.query(DailyProgress)
        .filter(DailyProgress.user_id == user_id)
        .order_by(desc(DailyProgress.date), desc(DailyProgress.id))
        .limit(limit)
        .all()
    )


def get_earliest_daily_progress_date(db: Session, *, user_id: int) -> date | None:
    return (
        db.query(func.min(DailyProgress.date))
        .filter(DailyProgress.user_id == user_id)
        .scalar()
    )


def get_or_create_discipline_state(db: Session, user_id: int) -> UserDisciplineState:
    state = db.query(UserDisciplineState).filter(UserDisciplineState.user_id == user_id).first()
    if state:
        return state

    state = UserDisciplineState(user_id=user_id, miss_streak=0)
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


def save_discipline_state(db: Session, state: UserDisciplineState) -> UserDisciplineState:
    db.add(state)
    db.commit()
    db.refresh(state)
    return state
