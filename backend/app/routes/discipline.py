from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.services.daily_progress_service import recommit_discipline_state

router = APIRouter(prefix='/discipline', tags=['discipline'])


@router.post('/recommit')
def recommit_route(
    as_of_date: date | None = Query(default=None, alias='asOfDate'),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return recommit_discipline_state(db, user=current_user, target_date=as_of_date)
