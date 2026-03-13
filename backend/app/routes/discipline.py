from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, get_request_target_date
from app.services.daily_progress_service import reset_discipline_state

router = APIRouter(prefix='/discipline', tags=['discipline'])


@router.post('/reset')
def reset_route(
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return reset_discipline_state(db, user=current_user, target_date=as_of_date)


@router.post('/recommit')
def recommit_route(
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return reset_discipline_state(db, user=current_user, target_date=as_of_date)
