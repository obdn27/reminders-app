"""
LLM service stubs for MVP.

For now we use deterministic template formatting.
Later this module can call an LLM provider without changing route/service contracts.
"""


def generate_weekly_summary_template(*, days_goals_met: int, most_missed_area: str, drift_detected: bool) -> str:
    drift_text = 'Drift appeared midweek.' if drift_detected else 'Drift remained controlled this week.'
    return (
        f'You met your daily minimums on {days_goals_met} of 7 days. '
        f'{most_missed_area.replace("_", " ").title()} was the most missed area. '
        f'{drift_text} Keep the baseline simple and consistent.'
    )


def generate_reminder_copy_template(*, reminder_type: str) -> tuple[str, str]:
    templates = {
        'light_reminder': ('You have been off track', 'You have not been on track the past few days. Try adjusting the plan so it fits again.'),
        'direct_reminder': ('You have been off track', 'You have not been on track the past few days. Try resetting your sprint or adjusting the daily targets.'),
        'checkin': ('Check in today', 'You have not been on track for the past few days. Try resetting your sprint or changing the daily targets.'),
        'reset_prompt': ('Start again today', 'You have been inactive for a while. Start again from today if the current sprint no longer fits.'),
        'weekly_review_ready': ('Weekly review ready', 'Your weekly review is ready to read.'),
    }
    return templates.get(reminder_type, ('Reminder', 'Open the app for your check-in.'))
