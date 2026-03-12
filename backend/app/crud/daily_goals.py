from sqlalchemy.orm import Session

from app.models.daily_goal import DailyGoalSetting


def get_daily_goals(db: Session, user_id: int) -> DailyGoalSetting | None:
    return db.query(DailyGoalSetting).filter(DailyGoalSetting.user_id == user_id).first()


def upsert_daily_goals(
    db: Session,
    *,
    user_id: int,
    job_work_minutes_goal: int,
    movement_minutes_goal: int,
    daily_job_task_goal: bool,
) -> DailyGoalSetting:
    row = get_daily_goals(db, user_id)
    if not row:
        row = DailyGoalSetting(
            user_id=user_id,
            job_work_minutes_goal=job_work_minutes_goal,
            movement_minutes_goal=movement_minutes_goal,
            daily_job_task_goal=daily_job_task_goal,
        )
        db.add(row)
    else:
        row.job_work_minutes_goal = job_work_minutes_goal
        row.movement_minutes_goal = movement_minutes_goal
        row.daily_job_task_goal = daily_job_task_goal

    db.commit()
    db.refresh(row)
    return row
