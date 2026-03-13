from datetime import date

from fastapi import Depends, Header, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.auth import resolve_user_from_bearer
from app.config import settings
from app.db import get_db

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    return resolve_user_from_bearer(db, credentials.credentials)


def get_request_target_date(
    as_of_date: date | None = Query(default=None, alias='asOfDate'),
    debug_date: date | None = Header(default=None, alias='X-Debug-Date'),
    dev_time_key: str | None = Header(default=None, alias='X-Dev-Time-Key'),
):
    target_date = debug_date or as_of_date
    if target_date and target_date < date.today() and dev_time_key != settings.DEV_TIME_TRAVEL_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Past-dated writes require the dev time key',
        )
    return target_date
