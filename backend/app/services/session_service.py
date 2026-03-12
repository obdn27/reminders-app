from sqlalchemy.orm import Session

from app.crud.sessions import create_session_record
from app.models.user import User
from app.services.daily_progress_service import apply_session_completion


def create_completed_session(
    db: Session,
    *,
    user: User,
    session_type: str,
    category: str,
    planned_minutes: int,
    completed_minutes: int,
    target_date=None,
) -> dict:
    saved = create_session_record(
        db,
        user_id=user.id,
        session_type=session_type,
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

    return {
        'session': {
            'id': saved.id,
            'type': saved.session_type,
            'category': saved.category,
            'plannedMinutes': saved.planned_minutes,
            'completedMinutes': saved.completed_minutes,
            'completedAt': saved.completed_at,
        },
        'dailyProgress': daily_progress,
        'ruleState': rule_state,
    }
