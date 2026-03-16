from sqlalchemy.orm import Session

from app.crud.sessions import create_session_record
from app.crud.daily_anchors import get_daily_anchors
from app.models.user import User
from app.services.anchor_progress_service import apply_session_progress
from app.services.daily_progress_service import apply_session_completion


def create_completed_session(
    db: Session,
    *,
    user: User,
    session_type: str,
    anchor_type: str | None,
    category: str,
    planned_minutes: int,
    completed_minutes: int,
    target_date=None,
) -> dict:
    anchors_by_type = {
        anchor.anchor_type: anchor
        for anchor in get_daily_anchors(db, user.id)
        if anchor.active
    }
    selected_anchor = anchors_by_type.get(anchor_type) if anchor_type else None
    saved = create_session_record(
        db,
        user_id=user.id,
        session_type=session_type,
        anchor_type=anchor_type,
        category=category,
        planned_minutes=planned_minutes,
        completed_minutes=completed_minutes,
    )

    daily_progress, rule_state = apply_session_completion(
        db,
        user=user,
        session_type=session_type,
        completed_minutes=completed_minutes,
        target_date=target_date,
    )
    anchor_progress = apply_session_progress(
        db,
        user=user,
        anchor_type=anchor_type,
        session_type=session_type,
        completed_minutes=completed_minutes,
        target_date=target_date,
    )

    return {
        'session': {
            'id': saved.id,
            'type': saved.session_type,
            'anchorType': saved.anchor_type,
            'label': selected_anchor.label if selected_anchor else category,
            'category': saved.category,
            'plannedMinutes': saved.planned_minutes,
            'completedMinutes': saved.completed_minutes,
            'completedAt': saved.completed_at,
            'nextAnchorId': selected_anchor.next_anchor_id if selected_anchor else None,
            'nextAnchorLabel': anchors_by_type.get(selected_anchor.next_anchor_id).label
            if selected_anchor and selected_anchor.next_anchor_id and anchors_by_type.get(selected_anchor.next_anchor_id)
            else None,
        },
        'dailyProgress': daily_progress,
        'anchorProgress': anchor_progress,
        'ruleState': rule_state,
    }
