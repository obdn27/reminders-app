from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.daily_anchor import DailyAnchor


def get_daily_anchors(db: Session, user_id: int) -> list[DailyAnchor]:
    return (
        db.query(DailyAnchor)
        .filter(DailyAnchor.user_id == user_id)
        .order_by(DailyAnchor.display_order.asc(), DailyAnchor.id.asc())
        .all()
    )


def replace_daily_anchors(db: Session, *, user_id: int, anchors: list[dict]) -> list[DailyAnchor]:
    db.execute(delete(DailyAnchor).where(DailyAnchor.user_id == user_id))

    rows: list[DailyAnchor] = []
    for index, anchor in enumerate(anchors):
        row = DailyAnchor(
            user_id=user_id,
            anchor_type=anchor['anchorType'],
            target_value=anchor['targetValue'],
            target_unit=anchor['targetUnit'],
            tracking_type=anchor['trackingType'],
            reminder_time=anchor.get('reminderTime'),
            active=anchor.get('active', True),
            display_order=index,
        )
        db.add(row)
        rows.append(row)

    db.commit()

    for row in rows:
        db.refresh(row)

    return rows
