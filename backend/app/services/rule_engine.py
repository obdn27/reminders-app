from app.models.daily_progress import DailyProgress


def compute_daily_progress_status(*, goals_met_count: int, total_goals_count: int) -> str:
    if goals_met_count <= 0:
        return 'behind'
    if goals_met_count >= total_goals_count:
        return 'complete'
    return 'on_track'


def did_meet_minimums(progress: DailyProgress) -> bool:
    return progress.goals_met_count >= progress.total_goals_count


def compute_miss_streak(recent_progress: list[DailyProgress]) -> int:
    streak = 0
    for row in recent_progress:
        if did_meet_minimums(row):
            break
        streak += 1
    return streak


def detect_drift(recent_progress: list[DailyProgress]) -> list[str]:
    flags: list[str] = []

    if len(recent_progress) >= 2 and all(not did_meet_minimums(r) for r in recent_progress[:2]):
        flags.append('multiple_missed_days')

    if len(recent_progress) >= 3 and all(r.job_work_minutes_completed == 0 for r in recent_progress[:3]):
        flags.append('zero_job_work_recently')

    if len(recent_progress) >= 3 and all(r.movement_minutes_completed == 0 for r in recent_progress[:3]):
        flags.append('zero_movement_recently')

    return flags


def compute_reminder_state(*, miss_streak: int, drift_flags: list[str]) -> str | None:
    if miss_streak >= 7:
        return 'recommit_prompt'
    if miss_streak >= 4:
        return 'cooldown'
    if miss_streak >= 3:
        return 'checkin_required'
    if miss_streak >= 2:
        return 'direct_reminder'
    if miss_streak == 1:
        return 'light_reminder'

    if drift_flags:
        return 'light_reminder'

    return None
