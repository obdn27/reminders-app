from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.schemas.daily_goals import DailyGoalsResponse, UpsertDailyGoalsRequest
from app.services.daily_goals_service import get_user_daily_goals, put_user_daily_goals

router = APIRouter(prefix='/daily-goals', tags=['daily-goals'])


@router.get('', response_model=DailyGoalsResponse)
def get_daily_goals_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_daily_goals(db, user=current_user)


@router.put('', response_model=DailyGoalsResponse)
def put_daily_goals_route(
    payload: UpsertDailyGoalsRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return put_user_daily_goals(db, user=current_user, payload=payload)
