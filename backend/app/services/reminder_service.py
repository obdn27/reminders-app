from datetime import date

from sqlalchemy.orm import Session

from app.crud.reminders import (
    create_reminder_event,
    get_existing_reminder_for_day,
    get_latest_reminder,
    get_pending_reminders,
    get_reminder_by_id,
    mark_reminder_opened,
)
from app.models.user import User
from app.services.llm_service import generate_reminder_copy_template


def _to_response(row):
    return {
        'id': row.id,
        'userId': row.user_id,
        'date': row.date,
        'type': row.type,
        'title': row.title,
        'body': row.body,
        'delivered': row.delivered,
        'opened': row.opened,
        'createdAt': row.created_at,
    }


def create_reminder_if_needed(
    db: Session,
    *,
    user: User,
    reminder_type: str,
    target_date: date,
) -> dict | None:
    if not reminder_type:
        return None

    if get_existing_reminder_for_day(
        db,
        user_id=user.id,
        target_date=target_date,
        reminder_type=reminder_type,
    ):
        return None

    title, body = generate_reminder_copy_template(reminder_type=reminder_type)
    row = create_reminder_event(
        db,
        user_id=user.id,
        target_date=target_date,
        reminder_type=reminder_type,
        title=title,
        body=body,
        delivered=False,
    )
    return _to_response(row)


def create_weekly_review_ready_event(db: Session, *, user: User, target_date: date) -> dict | None:
    return create_reminder_if_needed(
        db,
        user=user,
        reminder_type='weekly_review_ready',
        target_date=target_date,
    )


def latest_reminder(db: Session, *, user: User) -> dict | None:
    row = get_latest_reminder(db, user_id=user.id)
    return _to_response(row) if row else None


def pending_reminders(db: Session, *, user: User) -> list[dict]:
    rows = get_pending_reminders(db, user_id=user.id)
    return [_to_response(row) for row in rows]


def open_reminder(db: Session, *, user: User, reminder_id: int) -> dict | None:
    row = get_reminder_by_id(db, reminder_id=reminder_id, user_id=user.id)
    if not row:
        return None
    row = mark_reminder_opened(db, reminder=row)
    return _to_response(row)
