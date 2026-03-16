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
    existing_rows = get_daily_anchors(db, user_id)
    existing_by_id = {row.id: row for row in existing_rows}
    existing_by_category = {row.category: row for row in existing_rows}
    rows: list[DailyAnchor] = []

    for index, anchor in enumerate(anchors):
        row = None
        requested_id = anchor.get('id')
        if requested_id is not None:
            row = existing_by_id.get(int(requested_id))
        if row is None:
            row = existing_by_category.get(anchor['category'])
        if row is None:
            row = DailyAnchor(user_id=user_id)
            db.add(row)

        row.category = anchor['category']
        row.label = anchor['label']
        row.anchor_type = anchor['anchorType']
        row.target_value = anchor['targetValue']
        row.target_unit = anchor['targetUnit']
        row.tracking_type = anchor['trackingType']
        row.reminder_time = anchor.get('reminderTime')
        row.active = anchor.get('active', True)
        row.display_order = index
        row.next_anchor_id = None
        rows.append(row)

    db.flush()

    id_map = {row.id: row for row in rows if row.id is not None}
    category_map = {row.category: row for row in rows}
    for anchor, row in zip(anchors, rows):
        next_anchor_id = anchor.get('nextAnchorId')
        if next_anchor_id is not None and int(next_anchor_id) in id_map:
            row.next_anchor_id = id_map[int(next_anchor_id)].id
            continue

        next_category = anchor.get('nextAnchorCategory')
        if next_category and next_category in category_map:
            row.next_anchor_id = category_map[next_category].id

    db.flush()

    for existing in existing_rows:
        if existing.id not in {row.id for row in rows if row.id is not None}:
            db.delete(existing)

    db.commit()

    for row in rows:
        db.refresh(row)

    return rows
