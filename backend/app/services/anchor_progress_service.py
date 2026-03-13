from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.crud.anchor_progress import (
    create_or_get_anchor_progress_row,
    get_anchor_progress_rows,
    save_anchor_progress_row,
)
from app.crud.daily_anchors import get_daily_anchors
from app.models.user import User
from app.services.anchor_catalog import get_anchor_config
from app.services.daily_progress_service import evaluate_progress_for_date
from app.utils.time import user_local_date


def _time_to_string(value) -> str | None:
    if not value:
        return None
    return value.strftime('%H:%M')


def _row_to_response(anchor, row):
    config = get_anchor_config(anchor.anchor_type) or {}
    title = config.get('title', anchor.anchor_type.replace('_', ' ').title())
    return {
        'anchorId': anchor.id,
        'anchorType': anchor.anchor_type,
        'title': title,
        'trackingType': anchor.tracking_type,
        'targetValue': anchor.target_value,
        'targetUnit': anchor.target_unit,
        'reminderTime': _time_to_string(anchor.reminder_time),
        'progressValue': row.progress_value if row else 0,
        'completed': row.completed if row else False,
    }


def _sync_row_completion(anchor, row):
    if anchor.tracking_type == 'boolean':
        row.completed = row.progress_value > 0
    else:
        row.completed = row.progress_value >= anchor.target_value


def get_today_anchor_progress(db: Session, *, user: User, target_date: date | None = None) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    anchors = [anchor for anchor in get_daily_anchors(db, user.id) if anchor.active]
    rows = {row.anchor_id: row for row in get_anchor_progress_rows(db, user_id=user.id, target_date=target_date)}
    items = [_row_to_response(anchor, rows.get(anchor.id)) for anchor in anchors]

    completed_anchors = sum(1 for item in items if item['completed'])
    return {
        'date': target_date,
        'anchors': items,
        'completedAnchors': completed_anchors,
        'totalAnchors': len(items),
    }


def update_anchor_progress(db: Session, *, user: User, payload, target_date: date | None = None) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    anchors = {anchor.id: anchor for anchor in get_daily_anchors(db, user.id) if anchor.active}
    anchor = anchors.get(payload.anchorId)
    if not anchor:
        raise ValueError('Anchor not found')

    row = create_or_get_anchor_progress_row(db, anchor_id=anchor.id, user_id=user.id, target_date=target_date)

    if payload.progressValue is not None:
        row.progress_value = payload.progressValue
    elif payload.incrementBy is not None:
        row.progress_value += payload.incrementBy

    if payload.completed is not None:
        if anchor.tracking_type == 'boolean':
            row.progress_value = 1 if payload.completed else 0
        row.completed = payload.completed

    _sync_row_completion(anchor, row)
    save_anchor_progress_row(db, row)
    evaluate_progress_for_date(db, user=user, target_date=target_date)
    return get_today_anchor_progress(db, user=user, target_date=target_date)


def apply_session_progress(
    db: Session,
    *,
    user: User,
    anchor_type: str | None,
    session_type: str,
    completed_minutes: int,
    target_date: date | None = None,
) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    if not anchor_type:
        return get_today_anchor_progress(db, user=user, target_date=target_date)

    anchors = [anchor for anchor in get_daily_anchors(db, user.id) if anchor.active and anchor.anchor_type == anchor_type]
    if not anchors:
        return get_today_anchor_progress(db, user=user, target_date=target_date)

    anchor = anchors[0]
    if anchor.tracking_type != 'session':
        return get_today_anchor_progress(db, user=user, target_date=target_date)

    if session_type == 'movement' and anchor.anchor_type != 'movement':
        return get_today_anchor_progress(db, user=user, target_date=target_date)

    row = create_or_get_anchor_progress_row(db, anchor_id=anchor.id, user_id=user.id, target_date=target_date)
    row.progress_value += completed_minutes
    _sync_row_completion(anchor, row)
    save_anchor_progress_row(db, row)
    evaluate_progress_for_date(db, user=user, target_date=target_date)
    return get_today_anchor_progress(db, user=user, target_date=target_date)


def get_anchor_progress_history(db: Session, *, user: User, limit: int = 7, target_date: date | None = None) -> dict:
    target_date = target_date or user_local_date(user.timezone)
    anchors = [anchor for anchor in get_daily_anchors(db, user.id) if anchor.active]
    if not anchors:
        return {'history': []}

    start_date = target_date - timedelta(days=max(0, limit - 1))
    history = []
    cursor = target_date

    while cursor >= start_date:
        rows = {row.anchor_id: row for row in get_anchor_progress_rows(db, user_id=user.id, target_date=cursor)}
        completed_anchors = sum(1 for anchor in anchors if rows.get(anchor.id) and rows[anchor.id].completed)
        total_anchors = len(anchors)
        completion_rate = int(round((completed_anchors / total_anchors) * 100)) if total_anchors else 0
        history.append(
            {
                'date': cursor,
                'completionRate': completion_rate,
                'completedAnchors': completed_anchors,
                'totalAnchors': total_anchors,
            }
        )
        cursor -= timedelta(days=1)

    return {'history': history}
