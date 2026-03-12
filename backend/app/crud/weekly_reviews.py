from datetime import date

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.weekly_review import WeeklyReview


def get_weekly_review_for_range(
    db: Session,
    *,
    user_id: int,
    week_start_date: date,
    week_end_date: date,
) -> WeeklyReview | None:
    return (
        db.query(WeeklyReview)
        .filter(
            WeeklyReview.user_id == user_id,
            WeeklyReview.week_start_date == week_start_date,
            WeeklyReview.week_end_date == week_end_date,
        )
        .first()
    )


def create_weekly_review(
    db: Session,
    *,
    user_id: int,
    week_start_date: date,
    week_end_date: date,
    days_goals_met: int,
    longest_streak: int,
    most_missed_area: str,
    drift_detected: bool,
    summary_text: str,
) -> WeeklyReview:
    row = WeeklyReview(
        user_id=user_id,
        week_start_date=week_start_date,
        week_end_date=week_end_date,
        days_goals_met=days_goals_met,
        longest_streak=longest_streak,
        most_missed_area=most_missed_area,
        drift_detected=drift_detected,
        summary_text=summary_text,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_latest_weekly_review(db: Session, *, user_id: int) -> WeeklyReview | None:
    return (
        db.query(WeeklyReview)
        .filter(WeeklyReview.user_id == user_id)
        .order_by(desc(WeeklyReview.week_end_date), desc(WeeklyReview.id))
        .first()
    )


def get_weekly_review_history(db: Session, *, user_id: int, limit: int = 12) -> list[WeeklyReview]:
    return (
        db.query(WeeklyReview)
        .filter(WeeklyReview.user_id == user_id)
        .order_by(desc(WeeklyReview.week_end_date), desc(WeeklyReview.id))
        .limit(limit)
        .all()
    )
