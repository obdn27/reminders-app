from sqlalchemy.orm import Session

from app.crud.daily_goals import get_daily_goals, upsert_daily_goals
from app.models.user import User


def _to_response(row):
    return {
        'id': row.id,
        'userId': row.user_id,
        'jobWorkMinutesGoal': row.job_work_minutes_goal,
        'movementMinutesGoal': row.movement_minutes_goal,
        'dailyJobTaskGoal': row.daily_job_task_goal,
        'createdAt': row.created_at,
        'updatedAt': row.updated_at,
    }


def ensure_default_daily_goals(db: Session, *, user: User):
    existing = get_daily_goals(db, user.id)
    if existing:
        return existing

    return upsert_daily_goals(
        db,
        user_id=user.id,
        job_work_minutes_goal=60,
        movement_minutes_goal=20,
        daily_job_task_goal=True,
    )


def get_user_daily_goals(db: Session, *, user: User) -> dict:
    row = get_daily_goals(db, user.id) or ensure_default_daily_goals(db, user=user)
    return _to_response(row)


def put_user_daily_goals(db: Session, *, user: User, payload) -> dict:
    row = upsert_daily_goals(
        db,
        user_id=user.id,
        job_work_minutes_goal=payload.jobWorkMinutesGoal,
        movement_minutes_goal=payload.movementMinutesGoal,
        daily_job_task_goal=payload.dailyJobTaskGoal,
    )
    return _to_response(row)
