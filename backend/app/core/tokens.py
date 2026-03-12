from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt

from app.config import settings


def _create_token(payload: Dict[str, Any], expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    to_encode = {**payload, 'iat': now, 'exp': now + expires_delta}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: int) -> str:
    return _create_token(
        {'sub': str(user_id), 'type': 'access'},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        {'sub': str(user_id), 'type': 'refresh'},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise ValueError('Invalid token') from exc
