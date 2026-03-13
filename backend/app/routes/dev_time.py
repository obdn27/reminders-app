from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.utils.time import advance_fake_time, get_dev_time_snapshot, reset_fake_time, set_fake_time

router = APIRouter(prefix='/dev/time', tags=['dev-time'])


def _require_debug():
    if not settings.APP_DEBUG:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Not found')


class SetDevTimeRequest(BaseModel):
    isoDatetime: datetime


class AdvanceDevTimeRequest(BaseModel):
    days: int = 0
    hours: int = 0
    minutes: int = 0
    seconds: int = 0


@router.get('')
def get_dev_time_route():
    _require_debug()
    return get_dev_time_snapshot()


@router.post('/set')
def set_dev_time_route(payload: SetDevTimeRequest):
    _require_debug()
    return set_fake_time(payload.isoDatetime)


@router.post('/advance')
def advance_dev_time_route(payload: AdvanceDevTimeRequest):
    _require_debug()
    return advance_fake_time(
        days=payload.days,
        hours=payload.hours,
        minutes=payload.minutes,
        seconds=payload.seconds,
    )


@router.post('/reset')
def reset_dev_time_route():
    _require_debug()
    return reset_fake_time()
