from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def user_local_date(timezone_name: str | None) -> date:
    tz_name = timezone_name or 'UTC'
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = timezone.utc
    return datetime.now(tz).date()


def week_range_for_date(target: date) -> tuple[date, date]:
    week_start = target - timedelta(days=target.weekday())
    week_end = week_start + timedelta(days=6)
    return week_start, week_end


def previous_week_range(reference: date | None = None) -> tuple[date, date]:
    ref = reference or date.today()
    this_week_start, _ = week_range_for_date(ref)
    prev_week_end = this_week_start - timedelta(days=1)
    prev_week_start = prev_week_end - timedelta(days=6)
    return prev_week_start, prev_week_end
