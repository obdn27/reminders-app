from datetime import date

from sqlalchemy.orm import Session

from app.crud.daily_progress import get_daily_progress_in_range
from app.crud.weekly_reviews import (
    create_weekly_review,
    get_latest_weekly_review,
    get_weekly_review_for_range,
    get_weekly_review_history,
)
from app.services.llm_service import generate_weekly_summary_template
from app.models.user import User
from app.utils.time import previous_week_range


def _to_response(row):
    return {
        'id': row.id,
        'userId': row.user_id,
        'weekStartDate': row.week_start_date,
        'weekEndDate': row.week_end_date,
        'daysGoalsMet': row.days_goals_met,
        'longestStreak': row.longest_streak,
        'mostMissedArea': row.most_missed_area,
        'driftDetected': row.drift_detected,
        'summaryText': row.summary_text,
        'createdAt': row.created_at,
    }


def _compute_longest_streak(rows) -> int:
    best = 0
    current = 0
    for row in rows:
        if row.overall_status == 'complete':
            current += 1
            best = max(best, current)
        else:
            current = 0
    return best


def _compute_most_missed_area(rows) -> str:
    job_missed = sum(1 for r in rows if r.job_work_minutes_completed <= 0)
    movement_missed = sum(1 for r in rows if r.movement_minutes_completed <= 0)
    task_missed = sum(1 for r in rows if not r.daily_job_task_completed)

    area_scores = {
        'job_work': job_missed,
        'movement': movement_missed,
        'daily_job_task': task_missed,
    }
    return max(area_scores, key=area_scores.get)


def generate_weekly_review_for_user(
    db: Session,
    *,
    user: User,
    week_start_date: date | None = None,
    week_end_date: date | None = None,
) -> dict | None:
    if week_start_date is None or week_end_date is None:
        week_start_date, week_end_date = previous_week_range()

    existing = get_weekly_review_for_range(
        db,
        user_id=user.id,
        week_start_date=week_start_date,
        week_end_date=week_end_date,
    )
    if existing:
        return _to_response(existing)

    rows = get_daily_progress_in_range(
        db,
        user_id=user.id,
        start_date=week_start_date,
        end_date=week_end_date,
    )

    days_goals_met = sum(1 for r in rows if r.overall_status == 'complete')
    longest_streak = _compute_longest_streak(rows)
    most_missed_area = _compute_most_missed_area(rows) if rows else 'none'
    drift_detected = any((r.drift_flags or '') != '' for r in rows)

    summary_text = generate_weekly_summary_template(
        days_goals_met=days_goals_met,
        most_missed_area=most_missed_area,
        drift_detected=drift_detected,
    )

    created = create_weekly_review(
        db,
        user_id=user.id,
        week_start_date=week_start_date,
        week_end_date=week_end_date,
        days_goals_met=days_goals_met,
        longest_streak=longest_streak,
        most_missed_area=most_missed_area,
        drift_detected=drift_detected,
        summary_text=summary_text,
    )
    return _to_response(created)


def latest_weekly_review(db: Session, *, user: User) -> dict | None:
    row = get_latest_weekly_review(db, user_id=user.id)
    return _to_response(row) if row else None


def weekly_review_history(db: Session, *, user: User) -> list[dict]:
    rows = get_weekly_review_history(db, user_id=user.id)
    return [_to_response(row) for row in rows]
