from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.crud.daily_progress import (
    create_or_get_daily_progress,
    get_or_create_discipline_state,
    save_daily_progress,
    save_discipline_state,
)
from app.models.user import User
from app.services.daily_goals_service import ensure_default_daily_goals
from app.services.daily_progress_service import evaluate_progress_for_date, get_today_progress


def _ensure_goals(db: Session, user: User):
    return ensure_default_daily_goals(db, user=user)


def _apply_day_type(db: Session, *, user: User, target_date: date, day_type: str):
    goals = _ensure_goals(db, user)
    row = create_or_get_daily_progress(db, user.id, target_date)

    if day_type == 'stable':
        row.job_work_minutes_completed = goals.job_work_minutes_goal
        row.movement_minutes_completed = goals.movement_minutes_goal
        row.daily_job_task_completed = bool(goals.daily_job_task_goal)
    elif day_type == 'partial':
        row.job_work_minutes_completed = max(1, int(goals.job_work_minutes_goal * 0.5))
        row.movement_minutes_completed = max(0, int(goals.movement_minutes_goal * 0.25))
        row.daily_job_task_completed = False
    else:
        row.job_work_minutes_completed = 0
        row.movement_minutes_completed = 0
        row.daily_job_task_completed = False

    save_daily_progress(db, row)
    return evaluate_progress_for_date(db, user=user, target_date=target_date)


def _set_anchor(db: Session, *, user: User, anchor_date: date):
    discipline = get_or_create_discipline_state(db, user.id)
    discipline.miss_streak = 0
    discipline.reminder_state = None
    discipline.drift_flags = f'anchor:{anchor_date.isoformat()}'
    save_discipline_state(db, discipline)


def inspect_rule_state(db: Session, *, user: User, target_date: date):
    return get_today_progress(db, user=user, target_date=target_date)


def simulate_scenario(db: Session, *, user: User, scenario: str, target_date: date):
    if scenario == 'stable':
        _set_anchor(db, user=user, anchor_date=target_date - timedelta(days=1))
        return _apply_day_type(db, user=user, target_date=target_date, day_type='stable')

    if scenario == 'partial':
        _set_anchor(db, user=user, anchor_date=target_date - timedelta(days=1))
        return _apply_day_type(db, user=user, target_date=target_date, day_type='partial')

    if scenario == 'missed':
        _set_anchor(db, user=user, anchor_date=target_date - timedelta(days=1))
        return _apply_day_type(db, user=user, target_date=target_date, day_type='missed')

    if scenario == 'drift':
        _set_anchor(db, user=user, anchor_date=target_date - timedelta(days=6))
        pattern = ['partial', 'missed', 'missed', 'partial', 'missed', 'stable']
        for offset, day_type in enumerate(pattern):
            _apply_day_type(
                db,
                user=user,
                target_date=target_date - timedelta(days=offset),
                day_type=day_type,
            )
        return get_today_progress(db, user=user, target_date=target_date)

    if scenario == 'inactive':
        _set_anchor(db, user=user, anchor_date=target_date - timedelta(days=8))
        for offset in range(7):
            _apply_day_type(
                db,
                user=user,
                target_date=target_date - timedelta(days=offset),
                day_type='missed',
            )
        return get_today_progress(db, user=user, target_date=target_date)

    raise ValueError(f'Unsupported scenario: {scenario}')
