from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.services.session_service import create_completed_session

router = APIRouter(prefix='/sessions', tags=['sessions'])


class CreateSessionRequest(BaseModel):
    type: str = Field(pattern='^(focus|movement)$')
    category: str
    plannedMinutes: int = Field(ge=1, le=240)
    completedMinutes: int = Field(ge=1, le=240)
    completedAt: datetime | None = None


@router.post('')
def create_session_route(
    payload: CreateSessionRequest,
    as_of_date: date | None = Query(default=None, alias='asOfDate'),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_completed_session(
        db,
        user=current_user,
        session_type=payload.type,
        category=payload.category,
        planned_minutes=payload.plannedMinutes,
        completed_minutes=payload.completedMinutes,
        target_date=as_of_date,
    )
