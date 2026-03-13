from __future__ import annotations

from app.models.daily_progress import DailyProgress


def compute_daily_progress_status(*, goals_met_count: int, total_goals_count: int) -> str:
    if total_goals_count <= 0:
        return 'inactive'
    if goals_met_count <= 0:
        return 'behind'
    if goals_met_count >= total_goals_count:
        return 'complete'
    return 'on_track'


def _enabled_goal_parts(goals) -> dict:
    return {
        'job': goals.job_work_minutes_goal > 0,
        'movement': goals.movement_minutes_goal > 0,
        'task': bool(goals.daily_job_task_goal),
    }


def compute_day_completion_score(progress: DailyProgress, goals) -> float:
    enabled = _enabled_goal_parts(goals)
    total_parts = sum(1 for is_enabled in enabled.values() if is_enabled)
    if total_parts <= 0:
        return 0.0

    total_score = 0.0
    if enabled['job']:
        total_score += min(progress.job_work_minutes_completed / max(goals.job_work_minutes_goal, 1), 1.0)
    if enabled['movement']:
        total_score += min(progress.movement_minutes_completed / max(goals.movement_minutes_goal, 1), 1.0)
    if enabled['task']:
        total_score += 1.0 if progress.daily_job_task_completed else 0.0

    return total_score / total_parts


def classify_day(progress: DailyProgress, goals) -> str:
    enabled = _enabled_goal_parts(goals)
    if progress.goals_met_count >= progress.total_goals_count:
        return 'stable'

    near_full = progress.goals_met_count >= max(1, progress.total_goals_count - 1)
    strong_job_effort = enabled['job'] and progress.job_work_minutes_completed >= max(1, int(goals.job_work_minutes_goal * 0.5))
    some_movement = enabled['movement'] and progress.movement_minutes_completed > 0
    task_done = enabled['task'] and progress.daily_job_task_completed

    if near_full or strong_job_effort or some_movement or task_done:
        return 'partial'

    return 'missed'


def compute_miss_streak(recent_progress: list[DailyProgress], goals) -> int:
    streak = 0
    for row in recent_progress:
        classification = classify_day(row, goals)
        if classification == 'stable':
            break
        if classification == 'missed':
            streak += 1
            continue
        break
    return streak


def compute_completion_rate(recent_progress: list[DailyProgress], goals, *, days: int = 7) -> int:
    window = recent_progress[:days]
    if not window:
        return 0
    total = sum(compute_day_completion_score(row, goals) for row in window)
    return int(round((total / len(window)) * 100))


def detect_drift(recent_progress: list[DailyProgress], goals) -> list[str]:
    flags: list[str] = []
    if not recent_progress:
        return flags

    recent_week = recent_progress[:7]
    classifications = [classify_day(row, goals) for row in recent_week]

    missed_days = sum(1 for item in classifications if item == 'missed')
    partial_days = sum(1 for item in classifications if item == 'partial')

    if missed_days >= 2:
        flags.append('repeated_missed_days')
    if partial_days >= 3:
        flags.append('repeated_partial_days')

    recent_three = recent_progress[:3]
    if len(recent_three) >= 3 and all(row.job_work_minutes_completed == 0 for row in recent_three):
        flags.append('zero_job_work_recently')
    if len(recent_three) >= 3 and all(row.movement_minutes_completed == 0 for row in recent_three):
        flags.append('zero_movement_recently')

    if len(recent_progress) >= 6:
        recent_rate = compute_completion_rate(recent_progress[:3], goals, days=3)
        prior_rate = compute_completion_rate(recent_progress[3:6], goals, days=3)
        if recent_rate + 20 <= prior_rate:
            flags.append('declining_completion_rate')

    if len(classifications) >= 4 and classifications[:4] in (
        ['stable', 'missed', 'stable', 'missed'],
        ['missed', 'stable', 'missed', 'stable'],
    ):
        flags.append('boom_bust_pattern')

    latest = classifications[0]
    prior_two = classifications[1:3]
    if latest == 'partial' and prior_two and all(item == 'missed' for item in prior_two):
        flags.append('recovery_started')
    if latest == 'stable' and any(item in ('missed', 'partial') for item in classifications[1:4]):
        flags.append('recovery_stable')

    return flags


def compute_stability_state(
    *,
    current_classification: str,
    miss_streak: int,
    completion_rate: int,
    drift_flags: list[str],
) -> str:
    severe_drift = any(
        flag in drift_flags
        for flag in ['repeated_missed_days', 'zero_job_work_recently', 'zero_movement_recently', 'declining_completion_rate']
    )

    if miss_streak >= 4 or (completion_rate < 20 and severe_drift):
        return 'inactive'

    if miss_streak >= 2 or severe_drift:
        return 'drifting'

    if current_classification in ('partial', 'missed') or 'repeated_partial_days' in drift_flags or completion_rate < 75:
        return 'fragile'

    return 'stable'


def compute_reminder_state(
    *,
    stability_state: str,
    current_classification: str,
    miss_streak: int,
    drift_flags: list[str],
) -> str | None:
    recovery_mode = any(flag in drift_flags for flag in ['recovery_started', 'recovery_stable'])

    if stability_state == 'stable':
        return None

    if stability_state == 'fragile':
        if current_classification == 'stable' or recovery_mode or (miss_streak == 0 and not drift_flags):
            return None
        return 'light_reminder'

    if stability_state == 'drifting':
        if recovery_mode:
            return 'light_reminder'
        if miss_streak >= 3:
            return 'checkin'
        return 'direct_reminder'

    if stability_state == 'inactive':
        if recovery_mode or current_classification == 'partial':
            return 'direct_reminder'
        return 'reset_prompt'

    return None
