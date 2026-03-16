from sqlalchemy.orm import Session

from app.crud.daily_anchors import get_daily_anchors, replace_daily_anchors
from app.crud.daily_goals import upsert_daily_goals
from app.models.user import User
from app.services.anchor_catalog import get_anchor_config

WORK_MINUTE_ANCHORS = {'deep_work', 'upskilling'}
TASK_STYLE_ANCHORS = {'job_applications', 'chores_admin', 'meals_cooking'}


def _to_response(row):
    return {
        'id': row.id,
        'userId': row.user_id,
        'category': row.category,
        'label': row.label,
        'anchorType': row.anchor_type,
        'targetValue': row.target_value,
        'targetUnit': row.target_unit,
        'trackingType': row.tracking_type,
        'reminderTime': row.reminder_time,
        'nextAnchorId': row.next_anchor_id,
        'active': row.active,
        'displayOrder': row.display_order,
        'createdAt': row.created_at,
        'updatedAt': row.updated_at,
    }


def derive_legacy_daily_goals(anchors: list[dict]) -> dict:
    job_work_minutes_goal = sum(
        anchor['targetValue']
        for anchor in anchors
        if anchor['category'] in WORK_MINUTE_ANCHORS and anchor['targetUnit'] == 'minutes'
    )
    movement_minutes_goal = next(
        (
            anchor['targetValue']
            for anchor in anchors
            if anchor['category'] == 'movement' and anchor['targetUnit'] == 'minutes'
        ),
        0,
    )
    daily_job_task_goal = any(anchor['category'] in TASK_STYLE_ANCHORS for anchor in anchors)

    return {
        'job_work_minutes_goal': max(0, job_work_minutes_goal),
        'movement_minutes_goal': max(0, movement_minutes_goal),
        'daily_job_task_goal': daily_job_task_goal,
    }


def get_user_anchors(db: Session, *, user: User) -> dict:
    rows = get_daily_anchors(db, user.id)
    return {'anchors': [_to_response(row) for row in rows]}


def put_user_anchors(db: Session, *, user: User, payload) -> dict:
    anchors = []
    for anchor in payload.anchors:
        raw = anchor.model_dump()
        config = get_anchor_config(raw['category'])
        if not config:
            raise ValueError('Unsupported anchor type')
        raw['anchorType'] = raw['category']
        raw['targetUnit'] = config['target_unit']
        raw['trackingType'] = config['tracking_type']
        raw['label'] = raw['label'].strip()
        anchors.append(raw)
    rows = replace_daily_anchors(db, user_id=user.id, anchors=anchors)

    derived_goals = derive_legacy_daily_goals(anchors)
    upsert_daily_goals(
        db,
        user_id=user.id,
        job_work_minutes_goal=derived_goals['job_work_minutes_goal'],
        movement_minutes_goal=derived_goals['movement_minutes_goal'],
        daily_job_task_goal=derived_goals['daily_job_task_goal'],
    )

    return {'anchors': [_to_response(row) for row in rows]}
