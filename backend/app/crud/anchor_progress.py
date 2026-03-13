from datetime import date

from sqlalchemy.orm import Session

from app.models.daily_anchor_progress import DailyAnchorProgress


def get_anchor_progress_rows(db: Session, *, user_id: int, target_date: date) -> list[DailyAnchorProgress]:
    return (
        db.query(DailyAnchorProgress)
        .filter(DailyAnchorProgress.user_id == user_id, DailyAnchorProgress.date == target_date)
        .all()
    )


def get_anchor_progress_row(
    db: Session,
    *,
    anchor_id: int,
    user_id: int,
    target_date: date,
) -> DailyAnchorProgress | None:
    return (
        db.query(DailyAnchorProgress)
        .filter(
            DailyAnchorProgress.anchor_id == anchor_id,
            DailyAnchorProgress.user_id == user_id,
            DailyAnchorProgress.date == target_date,
        )
        .first()
    )


def create_or_get_anchor_progress_row(
    db: Session,
    *,
    anchor_id: int,
    user_id: int,
    target_date: date,
) -> DailyAnchorProgress:
    row = get_anchor_progress_row(db, anchor_id=anchor_id, user_id=user_id, target_date=target_date)
    if row:
        return row

    row = DailyAnchorProgress(anchor_id=anchor_id, user_id=user_id, date=target_date)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def save_anchor_progress_row(db: Session, row: DailyAnchorProgress) -> DailyAnchorProgress:
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
