from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import delete

from app.config import settings
from app.core.security import hash_password
from app.crud.anchor_progress import create_or_get_anchor_progress_row, save_anchor_progress_row
from app.crud.daily_anchors import replace_daily_anchors
from app.crud.daily_goals import upsert_daily_goals
from app.crud.daily_progress import create_or_get_daily_progress, get_or_create_discipline_state, save_daily_progress, save_discipline_state
from app.db import SessionLocal
from app.models.daily_anchor import DailyAnchor
from app.models.daily_progress import DailyProgress
from app.models.reminder_event import ReminderEvent
from app.models.session import SessionRecord
from app.models.user import User
from app.models.weekly_review import WeeklyReview
from app.services.anchor_catalog import get_anchor_config
from app.services.daily_progress_service import evaluate_progress_for_date

UTC = timezone.utc
PASSWORD = '12345678'


def at_noon(target_date: date) -> datetime:
    return datetime.combine(target_date, time(hour=12, minute=0, tzinfo=UTC))


def ensure_user(db, *, email: str, name: str, start_date: date, goal_context: str = 'getting_a_job'):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.execute(delete(DailyAnchor).where(DailyAnchor.user_id == existing.id))
        db.execute(delete(ReminderEvent).where(ReminderEvent.user_id == existing.id))
        db.execute(delete(SessionRecord).where(SessionRecord.user_id == existing.id))
        db.execute(delete(WeeklyReview).where(WeeklyReview.user_id == existing.id))
        db.execute(delete(DailyProgress).where(DailyProgress.user_id == existing.id))
        discipline = get_or_create_discipline_state(db, existing.id)
        discipline.reminder_state = None
        discipline.miss_streak = 0
        discipline.drift_flags = None
        save_discipline_state(db, discipline)
        existing.name = name
        existing.hashed_password = hash_password(PASSWORD)
        existing.timezone = 'UTC'
        existing.goal_context = goal_context
        existing.tone_preference = 'direct'
        existing.sprint_mode_enabled = True
        existing.sprint_start_date = start_date
        existing.sprint_end_date = date(2026, 4, 30)
        existing.has_completed_onboarding = True
        existing.created_at = at_noon(start_date)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        user = existing
    else:
        user = User(
            email=email,
            hashed_password=hash_password(PASSWORD),
            name=name,
            timezone='UTC',
            goal_context=goal_context,
            tone_preference='direct',
            sprint_mode_enabled=True,
            sprint_start_date=start_date,
            sprint_end_date=date(2026, 4, 30),
            has_completed_onboarding=True,
            created_at=at_noon(start_date),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def set_anchors(db, *, user: User, anchors: list[dict]):
    normalized_anchors = []
    for anchor in anchors:
        category = anchor.get('category') or anchor.get('anchorType')
        config = get_anchor_config(category) or {}
        normalized_anchors.append(
            {
                'id': anchor.get('id'),
                'category': category,
                'label': anchor.get('label') or config.get('title') or category.replace('_', ' ').title(),
                'anchorType': category,
                'targetValue': anchor['targetValue'],
                'targetUnit': anchor.get('targetUnit') or config.get('target_unit'),
                'trackingType': anchor.get('trackingType') or config.get('tracking_type'),
                'reminderTime': anchor.get('reminderTime'),
                'nextAnchorId': anchor.get('nextAnchorId'),
                'active': anchor.get('active', True),
            }
        )

    replace_daily_anchors(db, user_id=user.id, anchors=normalized_anchors)
    job_work_minutes = sum(
        anchor['targetValue']
        for anchor in normalized_anchors
        if anchor['anchorType'] in {'deep_work', 'upskilling'} and anchor['targetUnit'] == 'minutes'
    )
    movement_minutes = next(
        (
            anchor['targetValue']
            for anchor in normalized_anchors
            if anchor['anchorType'] == 'movement' and anchor['targetUnit'] == 'minutes'
        ),
        0,
    )
    daily_task_enabled = any(
        anchor['anchorType'] in {'job_applications', 'chores_admin', 'meals_cooking'} for anchor in normalized_anchors
    )
    upsert_daily_goals(
        db,
        user_id=user.id,
        job_work_minutes_goal=job_work_minutes,
        movement_minutes_goal=movement_minutes,
        daily_job_task_goal=daily_task_enabled,
    )


def set_day(db, *, user: User, target_date: date, job_minutes: int, movement_minutes: int, task_done: bool):
    row = create_or_get_daily_progress(db, user.id, target_date)
    row.job_work_minutes_completed = job_minutes
    row.movement_minutes_completed = movement_minutes
    row.daily_job_task_completed = task_done
    row.created_at = at_noon(target_date)
    row.updated_at = at_noon(target_date)
    save_daily_progress(db, row)
    _sync_anchor_progress_for_day(
        db,
        user=user,
        target_date=target_date,
        job_minutes=job_minutes,
        movement_minutes=movement_minutes,
        task_done=task_done,
    )
    return evaluate_progress_for_date(db, user=user, target_date=target_date)


def _sync_anchor_progress_for_day(db, *, user: User, target_date: date, job_minutes: int, movement_minutes: int, task_done: bool):
    anchors = db.query(DailyAnchor).filter(DailyAnchor.user_id == user.id).order_by(DailyAnchor.display_order.asc()).all()
    remaining_job_minutes = job_minutes

    for anchor in anchors:
        row = create_or_get_anchor_progress_row(db, anchor_id=anchor.id, user_id=user.id, target_date=target_date)

        if anchor.anchor_type == 'movement':
            row.progress_value = movement_minutes
        elif anchor.tracking_type == 'session':
            consumed = min(remaining_job_minutes, anchor.target_value)
            row.progress_value = consumed
            remaining_job_minutes = max(0, remaining_job_minutes - consumed)
        elif anchor.tracking_type == 'count':
            row.progress_value = anchor.target_value if task_done else 0
        else:
            row.progress_value = 1 if task_done else 0

        row.completed = row.progress_value >= anchor.target_value if anchor.tracking_type != 'boolean' else row.progress_value > 0
        save_anchor_progress_row(db, row)


def seed_perfect_month(db):
    start = date(2026, 2, 10)
    user = ensure_user(db, email='gigachad@gmail.com', name='Gigachad', start_date=start)
    set_anchors(
        db,
        user=user,
        anchors=[
            {'anchorType': 'deep_work', 'targetValue': 60, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(9, 30), 'active': True},
            {'anchorType': 'movement', 'targetValue': 20, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(18, 30), 'active': True},
            {'anchorType': 'job_applications', 'targetValue': 2, 'targetUnit': 'count', 'trackingType': 'count', 'reminderTime': time(15, 0), 'active': True},
        ],
    )
    day = start
    while day <= date(2026, 3, 13):
        set_day(db, user=user, target_date=day, job_minutes=90, movement_minutes=25, task_done=True)
        day += timedelta(days=1)


def seed_fragile_account(db):
    start = date(2026, 2, 18)
    user = ensure_user(db, email='fragile.flow@gmail.com', name='Fragile Flow', start_date=start)
    set_anchors(
        db,
        user=user,
        anchors=[
            {'anchorType': 'deep_work', 'targetValue': 60, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(9, 30), 'active': True},
            {'anchorType': 'movement', 'targetValue': 20, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(18, 30), 'active': True},
            {'anchorType': 'chores_admin', 'targetValue': 1, 'targetUnit': 'completion', 'trackingType': 'boolean', 'reminderTime': time(19, 0), 'active': True},
        ],
    )
    day = start
    while day <= date(2026, 3, 13):
        if day in {date(2026, 3, 6), date(2026, 3, 9), date(2026, 3, 11)}:
            set_day(db, user=user, target_date=day, job_minutes=35, movement_minutes=10, task_done=False)
        else:
            set_day(db, user=user, target_date=day, job_minutes=65, movement_minutes=20, task_done=True)
        day += timedelta(days=1)


def seed_drifting_account(db):
    start = date(2026, 2, 20)
    user = ensure_user(db, email='drifting.dan@gmail.com', name='Drifting Dan', start_date=start)
    set_anchors(
        db,
        user=user,
        anchors=[
            {'anchorType': 'deep_work', 'targetValue': 60, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(9, 30), 'active': True},
            {'anchorType': 'movement', 'targetValue': 20, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(18, 30), 'active': True},
            {'anchorType': 'job_applications', 'targetValue': 2, 'targetUnit': 'count', 'trackingType': 'count', 'reminderTime': time(15, 0), 'active': True},
        ],
    )
    pattern = [
        (date(2026, 3, 13), 30, 5, False),
        (date(2026, 3, 12), 0, 0, False),
        (date(2026, 3, 11), 0, 0, False),
        (date(2026, 3, 10), 35, 0, False),
        (date(2026, 3, 9), 70, 20, True),
        (date(2026, 3, 8), 20, 0, False),
        (date(2026, 3, 7), 0, 0, False),
    ]
    for offset in range((date(2026, 3, 6) - start).days + 1):
        day = start + timedelta(days=offset)
        set_day(db, user=user, target_date=day, job_minutes=70, movement_minutes=20, task_done=True)
    for target, job, move, task in pattern:
        set_day(db, user=user, target_date=target, job_minutes=job, movement_minutes=move, task_done=task)


def seed_inactive_account(db):
    start = date(2026, 2, 14)
    user = ensure_user(db, email='inactive.ian@gmail.com', name='Inactive Ian', start_date=start)
    set_anchors(
        db,
        user=user,
        anchors=[
            {'anchorType': 'deep_work', 'targetValue': 60, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(9, 30), 'active': True},
            {'anchorType': 'movement', 'targetValue': 20, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(18, 30), 'active': True},
            {'anchorType': 'chores_admin', 'targetValue': 1, 'targetUnit': 'completion', 'trackingType': 'boolean', 'reminderTime': time(19, 0), 'active': True},
        ],
    )
    day = start
    while day <= date(2026, 3, 5):
        set_day(db, user=user, target_date=day, job_minutes=65, movement_minutes=20, task_done=True)
        day += timedelta(days=1)
    while day <= date(2026, 3, 13):
        set_day(db, user=user, target_date=day, job_minutes=0, movement_minutes=0, task_done=False)
        day += timedelta(days=1)


def seed_recovering_account(db):
    start = date(2026, 2, 16)
    user = ensure_user(db, email='pranavpasula@gmail.com', name='Pranav', start_date=start)
    set_anchors(
        db,
        user=user,
        anchors=[
            {'anchorType': 'deep_work', 'targetValue': 60, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(9, 30), 'active': True},
            {'anchorType': 'movement', 'targetValue': 20, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(18, 30), 'active': True},
            {'anchorType': 'upskilling', 'targetValue': 30, 'targetUnit': 'minutes', 'trackingType': 'session', 'reminderTime': time(11, 0), 'active': True},
        ],
    )
    day = start
    while day <= date(2026, 3, 5):
        set_day(db, user=user, target_date=day, job_minutes=65, movement_minutes=20, task_done=True)
        day += timedelta(days=1)
    set_day(db, user=user, target_date=date(2026, 3, 6), job_minutes=0, movement_minutes=0, task_done=False)
    set_day(db, user=user, target_date=date(2026, 3, 7), job_minutes=0, movement_minutes=0, task_done=False)
    set_day(db, user=user, target_date=date(2026, 3, 8), job_minutes=35, movement_minutes=5, task_done=False)
    set_day(db, user=user, target_date=date(2026, 3, 9), job_minutes=45, movement_minutes=10, task_done=True)
    set_day(db, user=user, target_date=date(2026, 3, 10), job_minutes=60, movement_minutes=20, task_done=True)
    set_day(db, user=user, target_date=date(2026, 3, 11), job_minutes=60, movement_minutes=20, task_done=True)
    set_day(db, user=user, target_date=date(2026, 3, 12), job_minutes=70, movement_minutes=20, task_done=True)
    set_day(db, user=user, target_date=date(2026, 3, 13), job_minutes=60, movement_minutes=20, task_done=True)


def main():
    print('Using DEV_TIME_TRAVEL_KEY:', settings.DEV_TIME_TRAVEL_KEY)
    db = SessionLocal()
    try:
        seed_perfect_month(db)
        seed_fragile_account(db)
        seed_drifting_account(db)
        seed_inactive_account(db)
        seed_recovering_account(db)
        print('Seeded demo accounts:')
        for email in [
            'gigachad@gmail.com',
            'fragile.flow@gmail.com',
            'drifting.dan@gmail.com',
            'inactive.ian@gmail.com',
            'pranavpasula@gmail.com',
        ]:
            print(f'  - {email} / {PASSWORD}')
    finally:
        db.close()


if __name__ == '__main__':
    main()
