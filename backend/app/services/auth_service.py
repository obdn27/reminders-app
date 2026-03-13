from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.core.tokens import create_access_token, create_refresh_token, decode_token
from app.crud.users import create_user, get_user_by_email, get_user_by_id
from app.models.user import User


def _to_user_response(user: User) -> dict:
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


def signup(db: Session, *, email: str, password: str, name: str | None = None) -> dict:
    existing = get_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already exists')

    user = create_user(db, email=email, hashed_password=hash_password(password), name=name)
    return issue_tokens_for_user(user)


def authenticate_user(db: Session, *, email: str, password: str) -> dict:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    return issue_tokens_for_user(user)


def issue_tokens_for_user(user: User) -> dict:
    return {
        'accessToken': create_access_token(user.id),
        'refreshToken': create_refresh_token(user.id),
        'tokenType': 'bearer',
        'user': _to_user_response(user),
    }


def refresh_access_token(db: Session, *, refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if payload.get('type') != 'refresh':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token type')

    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    user = get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')

    return {
        'accessToken': create_access_token(user.id),
        'refreshToken': create_refresh_token(user.id),
        'tokenType': 'bearer',
    }


def get_current_user_profile(user: User) -> dict:
    return _to_user_response(user)
