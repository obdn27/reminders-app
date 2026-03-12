from datetime import date, timedelta
from types import SimpleNamespace

from sqlalchemy.orm import Session

from app.crud.daily_goals import get_daily_goals
from app.crud.daily_progress import (
    create_or_get_daily_progress,
    get_daily_progress_in_range,
    get_or_create_discipline_state,
    get_recent_daily_progress,
    save_daily_progress,
    save_discipline_state,
)
from app.models.user import User
from app.services.rule_engine import (
    compute_daily_progress_status,
    compute_miss_streak,
    compute_reminder_state,
    detect_drift,
)
from app.utils.time import user_local_date


def _split_flags(value: str | None) -> list[str]:
    if not value:
        return []
    return [item for item in value.split(',') if item]


def _parse_anchor(value: str | None) -> date | None:
    if not value:
        return None
    for item in value.split(','):
        if item.startswith('anchor:'):
            raw = item.replace('anchor:', '', 1)
            try:
                return date.fromisoformat(raw)
            except ValueError:
                return None
    return None


def _merge_anchor_and_flags(anchor_date: date | None, drift_flags: list[str]) -> str | None:
    items: list[str] = []
    if anchor_date:
        items.append(f'anchor:{anchor_date.isoformat()}')
    items.extend(drift_flags)
    return ','.join(items) if items else None


def _to_progress_response(progress):
    return {
        'id': progress.id,
        'userId': progress.user_id,
        'date': progress.date,
        'jobWorkMinutesCompleted': progress.job_work_minutes_completed,
        'movementMinutesCompleted': progress.movement_minutes_completed,
        'dailyJobTaskCompleted': progress.daily_job_task_completed,
        'goalsMetCount': progress.goals_met_count,
        'totalGoalsCount': progress.total_goals_count,
        'overallStatus': progress.overall_status,
        'reminderState': progress.reminder_state,
        'driftFlags': _split_flags(progress.drift_flags),
        'missStreak': progress.miss_streak,
        'createdAt': progress.created_at,
        'updatedAt': progress.updated_at,
    }


def _to_rule_state(reminder_state: str | None, miss_streak: int, drift_flags: list[str]):
    return {
        'reminderState': reminder_state,
        'missStreak': miss_streak,
        'driftFlags': drift_flags,
    }


def _to_history_row(progress):
    return {
        'id': progress.id,
        'date': progress.date,
        'jobWorkMinutesCompleted': progress.job_work_minutes_completed,
        'movementMinutesCompleted': progress.movement_minutes_completed,
        'jobTaskCompleted': progress.daily_job_task_completed,
        'overallStatus': progress.overall_status,
    }


def _ensure_goals(db: Session, user: User):
    goals = get_daily_goals(db, user.id)
    if goals:
        return goals

    from app.services.daily_goals_service import ensure_default_daily_goals

    return ensure_default_daily_goals(db, user=user)


def _recompute_counts(progress, goals):
    goals_met = 0
    total = 2

    if progress.job_work_minutes_completed >= goals.job_work_minutes_goal:
        goals_met += 1
    if progress.movement_minutes_completed >= goals.movement_minutes_goal:
        goals_met += 1

    if goals.daily_job_task_goal:
        total += 1
        if progress.daily_job_task_completed:
            goals_met += 1

    progress.goals_met_count = goals_met
    progress.total_goals_count = total
    progress.overall_status = compute_daily_progress_status(
        goals_met_count=goals_met,
        total_goals_count=total,
    )


def _normalize_recent_days(
    recent: list,
    *,
    reference_date: date,
    sprint_start_date: date | None = None,
    window_days: int = 14,
) -> list:
    if not recent:
        if not sprint_start_date or reference_date <= sprint_start_date:
            return []
        normalized = []
        cursor = reference_date - timedelta(days=1)
        min_date = max(sprint_start_date, reference_date - timedelta(days=window_days))
        while cursor >= min_date and len(normalized) < window_days:
            normalized.append(
                SimpleNamespace(
                    date=cursor,
                    job_work_minutes_completed=0,
                    movement_minutes_completed=0,
                    daily_job_task_completed=False,
                    goals_met_count=0,
                    total_goals_count=3,
                )
            )
            cursor -= timedelta(days=1)
        return normalized

    ordered = sorted(recent, key=lambda row: row.date, reverse=True)
    normalized = []
    cursor = reference_date - timedelta(days=1)

    for row in ordered:
        while cursor > row.date and len(normalized) < window_days:
            normalized.append(
                SimpleNamespace(
                    date=cursor,
                    job_work_minutes_completed=0,
                    movement_minutes_completed=0,
                    daily_job_task_completed=False,
                    goals_met_count=0,
                    total_goals_count=3,
                )
            )
            cursor -= timedelta(days=1)

        if len(normalized) >= window_days:
            break

        normalized.append(row)
        cursor = row.date - timedelta(days=1)
        if len(normalized) >= window_days:
            break

    return normalized


def _normalize_reminder_type(rule_state: str | None) -> str | None:
    if not rule_state:
        return None
    if rule_state == 'cooldown':
        return 'cooldown_notice'
    return rule_state


def _recompute_rule_state(db: Session, *, user: User, today_progress, reference_date: date):
    discipline = get_or_create_discipline_state(db, user.id)
    anchor_date = _parse_anchor(discipline.drift_flags)
    recent = get_recent_daily_progress(db, user.id, days=14)
    scoped_recent = [
        row
        for row in recent
        if row.date < reference_date and (anchor_date is None or row.date > anchor_date)
    ]
    normalized_recent = _normalize_recent_days(
        scoped_recent,
        reference_date=reference_date,
        sprint_start_date=user.sprint_start_date,
        window_days=14,
    )

    miss_streak = compute_miss_streak(normalized_recent)
    drift_flags = detect_drift(normalized_recent)
    reminder_state = compute_reminder_state(miss_streak=miss_streak, drift_flags=drift_flags)

    today_progress.miss_streak = miss_streak
    today_progress.reminder_state = reminder_state
    today_progress.drift_flags = ','.join(drift_flags) if drift_flags else None

    discipline.miss_streak = miss_streak
    discipline.reminder_state = reminder_state
    discipline.drift_flags = _merge_anchor_and_flags(anchor_date, drift_flags)
    save_discipline_state(db, discipline)

    reminder_type = _normalize_reminder_type(reminder_state)
    if reminder_type:
        from app.services.reminder_service import create_reminder_if_needed

        create_reminder_if_needed(
            db,
            user=user,
            reminder_type=reminder_type,
            target_date=reference_date,
        )

    return _to_rule_state(reminder_state, miss_streak, drift_flags)


def get_today_progress(db: Session, *, user: User, target_date: date | None = None) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    goals = _ensure_goals(db, user)
    row = create_or_get_daily_progress(db, user.id, target_date)
    _recompute_counts(row, goals)
    rule_state = _recompute_rule_state(db, user=user, today_progress=row, reference_date=target_date)
    row = save_daily_progress(db, row)

    return {
        'dailyProgress': _to_progress_response(row),
        'ruleState': rule_state,
    }


def patch_today_progress(db: Session, *, user: User, payload, target_date: date | None = None) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    goals = _ensure_goals(db, user)
    row = create_or_get_daily_progress(db, user.id, target_date)

    if payload.dailyJobTaskCompleted is not None:
        row.daily_job_task_completed = payload.dailyJobTaskCompleted
    if payload.movementMinutesCompleted is not None:
        row.movement_minutes_completed = payload.movementMinutesCompleted

    _recompute_counts(row, goals)
    rule_state = _recompute_rule_state(db, user=user, today_progress=row, reference_date=target_date)
    row = save_daily_progress(db, row)

    return {'dailyProgress': _to_progress_response(row), 'ruleState': rule_state}


def apply_session_completion(
    db: Session,
    *,
    user: User,
    session_type: str,
    completed_minutes: int,
    target_date: date | None = None,
) -> tuple[dict, dict]:
    target_date = target_date or user_local_date(user.timezone)
    goals = _ensure_goals(db, user)
    row = create_or_get_daily_progress(db, user.id, target_date)

    if session_type == 'movement':
        row.movement_minutes_completed += completed_minutes
    else:
        row.job_work_minutes_completed += completed_minutes

    _recompute_counts(row, goals)
    rule_state = _recompute_rule_state(db, user=user, today_progress=row, reference_date=target_date)
    row = save_daily_progress(db, row)

    return _to_progress_response(row), rule_state


def evaluate_progress_for_date(db: Session, *, user: User, target_date: date) -> dict:
    goals = _ensure_goals(db, user)
    row = create_or_get_daily_progress(db, user.id, target_date)
    _recompute_counts(row, goals)
    rule_state = _recompute_rule_state(db, user=user, today_progress=row, reference_date=target_date)
    row = save_daily_progress(db, row)
    return {'dailyProgress': _to_progress_response(row), 'ruleState': rule_state}


def get_progress_history(
    db: Session,
    *,
    user: User,
    limit: int = 30,
    target_date: date | None = None,
) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    start_date = target_date - timedelta(days=max(0, limit - 1))
    rows = get_daily_progress_in_range(
        db,
        user_id=user.id,
        start_date=start_date,
        end_date=target_date,
    )
    by_date = {row.date: row for row in rows}

    history = []
    cursor = target_date
    while cursor >= start_date and len(history) < limit:
        row = by_date.get(cursor)
        if row is None:
            synthetic = SimpleNamespace(
                id=f'synthetic-{cursor.isoformat()}',
                date=cursor,
                job_work_minutes_completed=0,
                movement_minutes_completed=0,
                daily_job_task_completed=False,
                overall_status='inactive' if cursor == target_date else 'behind',
            )
            history.append(_to_history_row(synthetic))
        else:
            history.append(_to_history_row(row))
        cursor -= timedelta(days=1)

    return {'history': history}


def recommit_discipline_state(db: Session, *, user: User, target_date: date | None = None) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    row = create_or_get_daily_progress(db, user.id, target_date)
    discipline = get_or_create_discipline_state(db, user.id)

    row.miss_streak = 0
    row.reminder_state = None
    row.drift_flags = None
    row = save_daily_progress(db, row)

    discipline.miss_streak = 0
    discipline.reminder_state = None
    discipline.drift_flags = _merge_anchor_and_flags(target_date, [])
    save_discipline_state(db, discipline)

    return {
        'ok': True,
        'dailyProgress': _to_progress_response(row),
        'ruleState': _to_rule_state(None, 0, []),
    }
