from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, get_request_target_date
from app.schemas.daily_progress import PatchTodayProgressRequest
from app.services.daily_progress_service import (
    get_progress_history,
    get_today_progress,
    patch_today_progress,
)

router = APIRouter(prefix='/daily-progress', tags=['daily-progress'])


@router.get('/today')
def get_today_progress_route(
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = get_today_progress(db, user=current_user, target_date=as_of_date)
    return result


@router.patch('/today')
def patch_today_progress_route(
    payload: PatchTodayProgressRequest,
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = patch_today_progress(db, user=current_user, payload=payload, target_date=as_of_date)
    return result


@router.post('/complete-job-task')
def complete_job_task_route(
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload = PatchTodayProgressRequest(dailyJobTaskCompleted=True)
    result = patch_today_progress(db, user=current_user, payload=payload, target_date=as_of_date)
    return result


@router.get('/history')
def daily_progress_history_route(
    limit: int = Query(default=30, ge=1, le=180),
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_progress_history(db, user=current_user, limit=limit, target_date=as_of_date)
