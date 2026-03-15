from datetime import date

from sqlalchemy.orm import Session

from app.crud.anchor_progress import get_anchor_progress_rows_in_range
from app.crud.daily_anchors import get_daily_anchors
from app.crud.daily_progress import get_daily_progress_in_range
from app.crud.weekly_reviews import (
    create_weekly_review,
    get_latest_weekly_review,
    get_weekly_review_for_range,
    get_weekly_review_history,
    update_weekly_review,
)
from app.services.llm_service import generate_weekly_summary_template
from app.models.user import User
from app.services.anchor_catalog import get_anchor_config
from app.utils.time import previous_week_range


def _humanize_area(value: str | None) -> str:
    labels = {
        'job_work': 'Deep work',
        'movement': 'Movement',
        'daily_job_task': 'Daily task',
        'none': 'None',
    }
    return labels.get(value or 'none', (value or 'none').replace('_', ' ').title())


def _sprint_day_count(user: User, target_date: date) -> int | None:
    if not user.sprint_start_date:
        return None
    return max(1, (target_date - user.sprint_start_date).days + 1)


def _build_anchor_breakdown(db: Session, *, user: User, week_start_date: date, week_end_date: date) -> list[dict]:
    anchors = [anchor for anchor in get_daily_anchors(db, user.id) if anchor.active]
    if not anchors:
        return []

    rows = get_anchor_progress_rows_in_range(
        db,
        user_id=user.id,
        start_date=week_start_date,
        end_date=week_end_date,
    )
    completion_by_anchor = {}
    for row in rows:
        if row.completed:
            completion_by_anchor[row.anchor_id] = completion_by_anchor.get(row.anchor_id, 0) + 1

    breakdown = []
    for anchor in anchors:
        config = get_anchor_config(anchor.anchor_type) or {}
        breakdown.append(
            {
                'anchorId': anchor.id,
                'label': config.get('title', anchor.anchor_type.replace('_', ' ').title()),
                'daysMet': completion_by_anchor.get(anchor.id, 0),
                'totalDays': 7,
            }
        )
    return breakdown


def _to_response(row, *, anchor_breakdown: list[dict] | None = None):
    return {
        'id': row.id,
        'userId': row.user_id,
        'weekStartDate': row.week_start_date,
        'weekEndDate': row.week_end_date,
        'daysGoalsMet': row.days_goals_met,
        'longestStreak': row.longest_streak,
        'mostMissedArea': row.most_missed_area,
        'mostMissedAreaLabel': _humanize_area(row.most_missed_area),
        'driftDetected': row.drift_detected,
        'summaryText': row.summary_text,
        'anchorBreakdown': anchor_breakdown or [],
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
    target_date: date | None = None,
) -> dict | None:
    if week_start_date is None or week_end_date is None:
        week_start_date, week_end_date = previous_week_range()

    if target_date:
        sprint_day = _sprint_day_count(user, target_date)
        if sprint_day is not None and sprint_day < 7:
            return None

    existing = get_weekly_review_for_range(
        db,
        user_id=user.id,
        week_start_date=week_start_date,
        week_end_date=week_end_date,
    )

    rows = get_daily_progress_in_range(
        db,
        user_id=user.id,
        start_date=week_start_date,
        end_date=week_end_date,
    )

    days_goals_met = sum(1 for r in rows if r.overall_status == 'complete')
    longest_streak = _compute_longest_streak(rows)
    anchor_breakdown = _build_anchor_breakdown(
        db,
        user=user,
        week_start_date=week_start_date,
        week_end_date=week_end_date,
    )
    if anchor_breakdown:
        weakest_anchor = min(anchor_breakdown, key=lambda item: item['daysMet'])
        most_missed_area = weakest_anchor['label']
    else:
        most_missed_area = _compute_most_missed_area(rows) if rows else 'none'
    drift_detected = any((r.drift_flags or '') != '' for r in rows)

    summary_text = generate_weekly_summary_template(
        days_goals_met=days_goals_met,
        most_missed_area=most_missed_area,
        drift_detected=drift_detected,
    )

    if existing:
        review = update_weekly_review(
            db,
            row=existing,
            days_goals_met=days_goals_met,
            longest_streak=longest_streak,
            most_missed_area=most_missed_area,
            drift_detected=drift_detected,
            summary_text=summary_text,
        )
    else:
        review = create_weekly_review(
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
    return _to_response(review, anchor_breakdown=anchor_breakdown)


def latest_weekly_review(db: Session, *, user: User, week_start_date: date | None = None, week_end_date: date | None = None) -> dict | None:
    row = None
    if week_start_date is not None and week_end_date is not None:
        row = get_weekly_review_for_range(
            db,
            user_id=user.id,
            week_start_date=week_start_date,
            week_end_date=week_end_date,
        )
    if row is None:
        row = get_latest_weekly_review(db, user_id=user.id)
    if row is None:
        return None
    anchor_breakdown = _build_anchor_breakdown(
        db,
        user=user,
        week_start_date=row.week_start_date,
        week_end_date=row.week_end_date,
    )
    return _to_response(row, anchor_breakdown=anchor_breakdown)


def weekly_review_history(db: Session, *, user: User) -> list[dict]:
    rows = get_weekly_review_history(db, user_id=user.id)
    return [
        _to_response(
            row,
            anchor_breakdown=_build_anchor_breakdown(
                db,
                user=user,
                week_start_date=row.week_start_date,
                week_end_date=row.week_end_date,
            ),
        )
        for row in rows
    ]
