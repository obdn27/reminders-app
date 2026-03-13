from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

_fake_now_utc: datetime | None = None


def _coerce_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_effective_utcnow() -> datetime:
    return _fake_now_utc or datetime.now(timezone.utc)


def utcnow() -> datetime:
    return get_effective_utcnow()


def get_dev_time_snapshot() -> dict:
    effective_now = get_effective_utcnow()
    return {
        'fakeEnabled': _fake_now_utc is not None,
        'effectiveNow': effective_now.isoformat(),
        'realNow': datetime.now(timezone.utc).isoformat(),
    }


def set_fake_time(value: datetime) -> dict:
    global _fake_now_utc
    _fake_now_utc = _coerce_utc(value)
    return get_dev_time_snapshot()


def advance_fake_time(*, days: int = 0, hours: int = 0, minutes: int = 0, seconds: int = 0) -> dict:
    global _fake_now_utc
    baseline = get_effective_utcnow()
    _fake_now_utc = baseline + timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)
    return get_dev_time_snapshot()


def reset_fake_time() -> dict:
    global _fake_now_utc
    _fake_now_utc = None
    return get_dev_time_snapshot()


def user_local_date(timezone_name: str | None) -> date:
    tz_name = timezone_name or 'UTC'
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = timezone.utc
    return get_effective_utcnow().astimezone(tz).date()


def week_range_for_date(target: date) -> tuple[date, date]:
    week_start = target - timedelta(days=target.weekday())
    week_end = week_start + timedelta(days=6)
    return week_start, week_end


def previous_week_range(reference: date | None = None) -> tuple[date, date]:
    ref = reference or get_effective_utcnow().date()
    this_week_start, _ = week_range_for_date(ref)
    prev_week_end = this_week_start - timedelta(days=1)
    prev_week_start = prev_week_end - timedelta(days=6)
    return prev_week_start, prev_week_end
