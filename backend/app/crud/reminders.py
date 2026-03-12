from datetime import date

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.reminder_event import ReminderEvent


def get_existing_reminder_for_day(db: Session, *, user_id: int, target_date: date, reminder_type: str) -> ReminderEvent | None:
    return (
        db.query(ReminderEvent)
        .filter(
            ReminderEvent.user_id == user_id,
            ReminderEvent.date == target_date,
            ReminderEvent.type == reminder_type,
        )
        .first()
    )


def create_reminder_event(
    db: Session,
    *,
    user_id: int,
    target_date: date,
    reminder_type: str,
    title: str,
    body: str,
    delivered: bool = False,
) -> ReminderEvent:
    row = ReminderEvent(
        user_id=user_id,
        date=target_date,
        type=reminder_type,
        title=title,
        body=body,
        delivered=delivered,
        opened=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_latest_reminder(db: Session, *, user_id: int) -> ReminderEvent | None:
    return (
        db.query(ReminderEvent)
        .filter(ReminderEvent.user_id == user_id)
        .order_by(desc(ReminderEvent.created_at), desc(ReminderEvent.id))
        .first()
    )


def get_pending_reminders(db: Session, *, user_id: int) -> list[ReminderEvent]:
    return (
        db.query(ReminderEvent)
        .filter(ReminderEvent.user_id == user_id, ReminderEvent.opened == False)  # noqa: E712
        .order_by(desc(ReminderEvent.created_at), desc(ReminderEvent.id))
        .all()
    )


def get_reminder_by_id(db: Session, *, reminder_id: int, user_id: int) -> ReminderEvent | None:
    return (
        db.query(ReminderEvent)
        .filter(ReminderEvent.id == reminder_id, ReminderEvent.user_id == user_id)
        .first()
    )


def mark_reminder_opened(db: Session, *, reminder: ReminderEvent) -> ReminderEvent:
    reminder.opened = True
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder
