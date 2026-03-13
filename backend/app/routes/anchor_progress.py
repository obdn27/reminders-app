from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, get_request_target_date
from app.schemas.anchor_progress import AnchorProgressHistoryResponse, TodayAnchorProgressResponse, UpdateAnchorProgressRequest
from app.services.anchor_progress_service import get_anchor_progress_history, get_today_anchor_progress, update_anchor_progress

router = APIRouter(prefix='/anchor-progress', tags=['anchor-progress'])


@router.get('/today', response_model=TodayAnchorProgressResponse)
def get_today_anchor_progress_route(
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_today_anchor_progress(db, user=current_user, target_date=as_of_date)


@router.patch('/today', response_model=TodayAnchorProgressResponse)
def update_anchor_progress_route(
    payload: UpdateAnchorProgressRequest,
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return update_anchor_progress(db, user=current_user, payload=payload, target_date=as_of_date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get('/history', response_model=AnchorProgressHistoryResponse)
def get_anchor_progress_history_route(
    limit: int = Query(default=7, ge=1, le=60),
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_anchor_progress_history(db, user=current_user, limit=limit, target_date=as_of_date)
