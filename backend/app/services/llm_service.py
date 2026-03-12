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
        'light_reminder': ('Quick nudge', 'You missed a baseline day. Reset and protect today.'),
        'direct_reminder': ('Discipline warning', 'Two missed days in a row. Recommit today.'),
        'checkin_required': ('Check-in required', 'Three missed days. Open the app and recommit.'),
        'cooldown': ('Cooldown', 'You are in cooldown. We will reduce reminder frequency.'),
        'cooldown_notice': ('Cooldown', 'You are in cooldown. We will reduce reminder frequency.'),
        'recommit_prompt': ('Recommit prompt', 'Inactivity detected. Restart your sprint today.'),
        'weekly_review_ready': ('Weekly review ready', 'Your weekly review is ready to read.'),
    }
    return templates.get(reminder_type, ('Reminder', 'Open the app for your check-in.'))
