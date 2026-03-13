from sqlalchemy.orm import Session

from app.crud.users import update_user_profile
from app.models.user import User


def to_profile_response(user: User) -> dict:
    return {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'goalContext': user.goal_context,
        'timezone': user.timezone,
        'tonePreference': user.tone_preference,
        'sprintModeEnabled': user.sprint_mode_enabled,
        'sprintStartDate': user.sprint_start_date,
        'sprintEndDate': user.sprint_end_date,
        'hasCompletedOnboarding': user.has_completed_onboarding,
        'createdAt': user.created_at,
    }


def update_profile(db: Session, *, user: User, payload) -> dict:
    updated = update_user_profile(
        db,
        user=user,
        name=payload.name,
        goal_context=payload.goalContext,
        timezone=payload.timezone,
        tone_preference=payload.tonePreference,
        sprint_mode_enabled=payload.sprintModeEnabled,
        sprint_start_date=payload.sprintStartDate,
        sprint_end_date=payload.sprintEndDate,
        has_completed_onboarding=payload.hasCompletedOnboarding,
    )
    return to_profile_response(updated)
