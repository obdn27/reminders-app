from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, get_request_target_date
from app.services.weekly_review_service import (
    generate_weekly_review_for_user,
    latest_weekly_review,
    weekly_review_history,
)
from app.utils.time import user_local_date, week_range_for_date

router = APIRouter(prefix='/weekly-review', tags=['weekly-review'])


@router.get('/latest')
def get_latest_weekly_review_route(
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_date = as_of_date or user_local_date(current_user.timezone)
    week_start_date, week_end_date = week_range_for_date(target_date)
    return {
        'review': generate_weekly_review_for_user(
            db,
            user=current_user,
            week_start_date=week_start_date,
            week_end_date=week_end_date,
            target_date=target_date,
        )
    }


@router.get('/history')
def get_weekly_review_history_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {'reviews': weekly_review_history(db, user=current_user)}


@router.post('/generate')
def generate_weekly_review_route(
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_date = as_of_date or user_local_date(current_user.timezone)
    week_start_date, week_end_date = week_range_for_date(target_date)
    review = generate_weekly_review_for_user(
        db,
        user=current_user,
        week_start_date=week_start_date,
        week_end_date=week_end_date,
        target_date=target_date,
    )
    return {'review': review}
