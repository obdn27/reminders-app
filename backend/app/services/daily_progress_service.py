from datetime import date, timedelta
from types import SimpleNamespace

from sqlalchemy.orm import Session

from app.crud.daily_goals import get_daily_goals
from app.crud.anchor_progress import get_anchor_progress_rows
from app.crud.daily_progress import (
    create_or_get_daily_progress,
    get_earliest_daily_progress_date,
    get_daily_progress_in_range,
    get_or_create_discipline_state,
    get_recent_daily_progress,
    save_daily_progress,
    save_discipline_state,
)
from app.models.user import User
from app.services.rule_engine import (
    classify_day,
    compute_completion_rate,
    compute_daily_progress_status,
    compute_miss_streak,
    compute_reminder_state,
    compute_stability_state,
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


def _to_progress_response(progress, *, metrics: dict | None = None):
    metrics = metrics or {}
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
        'dailyClassification': metrics.get('dailyClassification'),
        'stabilityState': metrics.get('stabilityState'),
        'reminderState': progress.reminder_state,
        'driftFlags': _split_flags(progress.drift_flags),
        'missStreak': progress.miss_streak,
        'completionRate': metrics.get('completionRate', 0),
        'completedAnchorsToday': metrics.get('completedAnchorsToday', 0),
        'consistencyStreak': metrics.get('consistencyStreak', 0),
        'longestStreak': metrics.get('longestStreak', 0),
        'lastActiveDate': metrics.get('lastActiveDate'),
        'retentionState': metrics.get('retentionState', 'steady'),
        'createdAt': progress.created_at,
        'updatedAt': progress.updated_at,
    }


def _to_rule_state(
    *,
    dailyClassification: str,
    stabilityState: str,
    reminderState: str | None,
    missStreak: int,
    driftFlags: list[str],
    completionRate: int,
    consistencyStreak: int,
    longestStreak: int,
    lastActiveDate: date | None,
    retentionState: str,
    **_,
):
    return {
        'dailyClassification': dailyClassification,
        'stabilityState': stabilityState,
        'reminderState': reminderState,
        'missStreak': missStreak,
        'driftFlags': driftFlags,
        'completionRate': completionRate,
        'consistencyStreak': consistencyStreak,
        'longestStreak': longestStreak,
        'lastActiveDate': lastActiveDate,
        'retentionState': retentionState,
    }


def _to_history_row(progress, *, goals=None):
    daily_classification = classify_day(progress, goals) if goals is not None else None
    return {
        'id': progress.id,
        'date': progress.date,
        'jobWorkMinutesCompleted': progress.job_work_minutes_completed,
        'movementMinutesCompleted': progress.movement_minutes_completed,
        'jobTaskCompleted': progress.daily_job_task_completed,
        'overallStatus': progress.overall_status,
        'dailyClassification': daily_classification,
    }


def _ensure_goals(db: Session, user: User):
    goals = get_daily_goals(db, user.id)
    if goals:
        return goals

    from app.services.daily_goals_service import ensure_default_daily_goals

    return ensure_default_daily_goals(db, user=user)


def _get_effective_sprint_start_date(db: Session, *, user: User, target_date: date | None = None) -> date | None:
    sprint_start_date = user.sprint_start_date
    earliest_progress_date = get_earliest_daily_progress_date(db, user_id=user.id)

    if earliest_progress_date and (sprint_start_date is None or earliest_progress_date < sprint_start_date):
        user.sprint_start_date = earliest_progress_date
        db.add(user)
        db.commit()
        db.refresh(user)
        sprint_start_date = user.sprint_start_date

    if target_date and sprint_start_date and target_date < sprint_start_date and earliest_progress_date and earliest_progress_date <= target_date:
        user.sprint_start_date = earliest_progress_date
        db.add(user)
        db.commit()
        db.refresh(user)
        sprint_start_date = user.sprint_start_date

    return sprint_start_date


def _recompute_counts(progress, goals):
    goals_met = 0
    total = 0

    if goals.job_work_minutes_goal > 0:
        total += 1
        if progress.job_work_minutes_completed >= goals.job_work_minutes_goal:
            goals_met += 1
    if goals.movement_minutes_goal > 0:
        total += 1
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
    goals,
    reference_date: date,
    sprint_start_date: date | None = None,
    anchor_date: date | None = None,
    window_days: int = 14,
) -> list:
    total_goals_count = int(goals.job_work_minutes_goal > 0) + int(goals.movement_minutes_goal > 0) + int(bool(goals.daily_job_task_goal))
    if not recent:
        effective_floor = sprint_start_date
        if anchor_date:
            effective_floor = max(filter(None, [sprint_start_date, anchor_date + timedelta(days=1)]))
        if not effective_floor or reference_date <= effective_floor:
            return []
        normalized = []
        cursor = reference_date - timedelta(days=1)
        min_date = max(effective_floor, reference_date - timedelta(days=window_days))
        while cursor >= min_date and len(normalized) < window_days:
            normalized.append(
                SimpleNamespace(
                    date=cursor,
                    job_work_minutes_completed=0,
                    movement_minutes_completed=0,
                    daily_job_task_completed=False,
                    goals_met_count=0,
                    total_goals_count=total_goals_count,
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
                    total_goals_count=total_goals_count,
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


def _build_rule_metrics(
    db: Session,
    *,
    user: User,
    goals,
    today_progress,
    reference_date: date,
):
    discipline = get_or_create_discipline_state(db, user.id)
    completed_anchors_today = sum(
        1 for row in get_anchor_progress_rows(db, user_id=user.id, target_date=reference_date) if row.completed
    )
    anchor_date = _parse_anchor(discipline.drift_flags)
    recent = get_recent_daily_progress(db, user.id, days=14, reference_date=reference_date)
    scoped_recent = [row for row in recent if anchor_date is None or row.date > anchor_date]
    normalized_recent = _normalize_recent_days(
        scoped_recent,
        goals=goals,
        reference_date=reference_date,
        sprint_start_date=_get_effective_sprint_start_date(db, user=user, target_date=reference_date),
        anchor_date=anchor_date,
        window_days=14,
    )

    today_classification = classify_day(today_progress, goals)
    has_today_activity = any(
        [
            today_progress.job_work_minutes_completed > 0,
            today_progress.movement_minutes_completed > 0,
            today_progress.daily_job_task_completed,
        ]
    )
    trend_window = [today_progress, *normalized_recent] if has_today_activity else normalized_recent
    miss_streak = compute_miss_streak(normalized_recent, goals)
    drift_flags = detect_drift(trend_window, goals)
    completion_rate = compute_completion_rate(trend_window, goals, days=7)
    stability_state = compute_stability_state(
        current_classification=today_classification,
        miss_streak=miss_streak,
        completion_rate=completion_rate,
        drift_flags=drift_flags,
    )
    reminder_state = compute_reminder_state(
        stability_state=stability_state,
        current_classification=today_classification,
        miss_streak=miss_streak,
        drift_flags=drift_flags,
    )
    if completed_anchors_today > 0:
        if discipline.last_active_date != reference_date:
            gap_days = (reference_date - discipline.last_active_date).days if discipline.last_active_date else None
            if gap_days is not None and gap_days > 1:
                discipline.consistency_streak = 1
            else:
                discipline.consistency_streak = max(1, discipline.consistency_streak + 1)
            discipline.longest_streak = max(discipline.longest_streak, discipline.consistency_streak)
            discipline.last_active_date = reference_date
    elif discipline.last_active_date and (reference_date - discipline.last_active_date).days > 1:
        discipline.consistency_streak = 0

    discipline.retention_state = 'drifting' if miss_streak >= 3 else 'steady'

    today_progress.miss_streak = miss_streak
    today_progress.reminder_state = reminder_state
    today_progress.drift_flags = ','.join(drift_flags) if drift_flags else None

    discipline.miss_streak = miss_streak
    discipline.reminder_state = reminder_state
    discipline.drift_flags = _merge_anchor_and_flags(anchor_date, drift_flags)
    save_discipline_state(db, discipline)

    if reminder_state:
        from app.services.reminder_service import create_reminder_if_needed

        create_reminder_if_needed(
            db,
            user=user,
            reminder_type=reminder_state,
            target_date=reference_date,
        )

    return {
        'dailyClassification': today_classification,
        'stabilityState': stability_state,
        'reminderState': reminder_state,
        'missStreak': miss_streak,
        'driftFlags': drift_flags,
        'completionRate': completion_rate,
        'completedAnchorsToday': completed_anchors_today,
        'consistencyStreak': discipline.consistency_streak,
        'longestStreak': discipline.longest_streak,
        'lastActiveDate': discipline.last_active_date,
        'retentionState': discipline.retention_state,
    }


def get_today_progress(db: Session, *, user: User, target_date: date | None = None) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    goals = _ensure_goals(db, user)
    row = create_or_get_daily_progress(db, user.id, target_date)
    _recompute_counts(row, goals)
    rule_state = _build_rule_metrics(db, user=user, goals=goals, today_progress=row, reference_date=target_date)
    row = save_daily_progress(db, row)

    return {
        'dailyProgress': _to_progress_response(row, metrics=rule_state),
        'ruleState': _to_rule_state(**rule_state),
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
    rule_state = _build_rule_metrics(db, user=user, goals=goals, today_progress=row, reference_date=target_date)
    row = save_daily_progress(db, row)

    return {'dailyProgress': _to_progress_response(row, metrics=rule_state), 'ruleState': _to_rule_state(**rule_state)}


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
    rule_state = _build_rule_metrics(db, user=user, goals=goals, today_progress=row, reference_date=target_date)
    row = save_daily_progress(db, row)

    return _to_progress_response(row, metrics=rule_state), _to_rule_state(**rule_state)


def evaluate_progress_for_date(db: Session, *, user: User, target_date: date) -> dict:
    goals = _ensure_goals(db, user)
    row = create_or_get_daily_progress(db, user.id, target_date)
    _recompute_counts(row, goals)
    rule_state = _build_rule_metrics(db, user=user, goals=goals, today_progress=row, reference_date=target_date)
    row = save_daily_progress(db, row)
    return {'dailyProgress': _to_progress_response(row, metrics=rule_state), 'ruleState': _to_rule_state(**rule_state)}


def get_progress_history(
    db: Session,
    *,
    user: User,
    limit: int = 30,
    target_date: date | None = None,
) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    goals = _ensure_goals(db, user)
    sprint_start_date = _get_effective_sprint_start_date(db, user=user, target_date=target_date)
    if sprint_start_date and sprint_start_date > target_date:
        return {'history': []}

    computed_start = target_date - timedelta(days=max(0, limit - 1))
    start_date = max(computed_start, sprint_start_date) if sprint_start_date else computed_start
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
            total_goals_count = int(goals.job_work_minutes_goal > 0) + int(goals.movement_minutes_goal > 0) + int(bool(goals.daily_job_task_goal))
            synthetic = SimpleNamespace(
                id=f'synthetic-{cursor.isoformat()}',
                date=cursor,
                job_work_minutes_completed=0,
                movement_minutes_completed=0,
                daily_job_task_completed=False,
                goals_met_count=0,
                total_goals_count=total_goals_count,
                overall_status='inactive' if cursor == target_date else 'behind',
            )
            history.append(_to_history_row(synthetic, goals=goals))
        else:
            history.append(_to_history_row(row, goals=goals))
        cursor -= timedelta(days=1)

    return {'history': history}


def reset_discipline_state(db: Session, *, user: User, target_date: date | None = None) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    goals = _ensure_goals(db, user)
    row = create_or_get_daily_progress(db, user.id, target_date)
    discipline = get_or_create_discipline_state(db, user.id)

    row.miss_streak = 0
    row.reminder_state = None
    row.drift_flags = None
    row = save_daily_progress(db, row)

    discipline.miss_streak = 0
    discipline.reminder_state = None
    discipline.drift_flags = _merge_anchor_and_flags(target_date, [])
    discipline.retention_state = 'steady'
    save_discipline_state(db, discipline)

    _recompute_counts(row, goals)
    row = save_daily_progress(db, row)
    daily_classification = classify_day(row, goals)
    stability_state = 'stable' if daily_classification == 'stable' else 'fragile'
    rule_state = _to_rule_state(
        dailyClassification=daily_classification,
        stabilityState=stability_state,
        reminderState=None,
        missStreak=0,
        driftFlags=[],
        completionRate=0,
        consistencyStreak=discipline.consistency_streak,
        longestStreak=discipline.longest_streak,
        lastActiveDate=discipline.last_active_date,
        retentionState=discipline.retention_state,
    )

    return {
        'ok': True,
        'dailyProgress': _to_progress_response(
            row,
            metrics={
                'dailyClassification': daily_classification,
                'stabilityState': stability_state,
                'completionRate': 0,
            },
        ),
        'ruleState': rule_state,
    }


def recommit_discipline_state(db: Session, *, user: User, target_date: date | None = None) -> dict:
    return reset_discipline_state(db, user=user, target_date=target_date)
