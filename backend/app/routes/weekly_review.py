from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.services.weekly_review_service import (
    generate_weekly_review_for_user,
    latest_weekly_review,
    weekly_review_history,
)
from app.utils.time import user_local_date, week_range_for_date

router = APIRouter(prefix='/weekly-review', tags=['weekly-review'])


@router.get('/latest')
def get_latest_weekly_review_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {'review': latest_weekly_review(db, user=current_user)}


@router.get('/history')
def get_weekly_review_history_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {'reviews': weekly_review_history(db, user=current_user)}


@router.post('/generate')
def generate_weekly_review_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    today = user_local_date(current_user.timezone)
    week_start_date, week_end_date = week_range_for_date(today)
    review = generate_weekly_review_for_user(
        db,
        user=current_user,
        week_start_date=week_start_date,
        week_end_date=week_end_date,
    )
    return {'review': review}
