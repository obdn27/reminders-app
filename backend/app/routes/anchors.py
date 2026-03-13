from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.schemas.anchors import DailyAnchorsResponse, UpsertDailyAnchorsRequest
from app.services.anchors_service import get_user_anchors, put_user_anchors

router = APIRouter(prefix='/anchors', tags=['anchors'])


@router.get('', response_model=DailyAnchorsResponse)
def get_anchors_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_anchors(db, user=current_user)


@router.put('', response_model=DailyAnchorsResponse)
def put_anchors_route(
    payload: UpsertDailyAnchorsRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return put_user_anchors(db, user=current_user, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
