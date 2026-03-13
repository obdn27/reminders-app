from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.dependencies import get_current_user, get_request_target_date
from app.services.rule_engine_debug_service import inspect_rule_state, simulate_scenario
from app.utils.time import user_local_date

router = APIRouter(prefix='/dev/rule-engine', tags=['dev-rule-engine'])


def _require_debug():
    if not settings.APP_DEBUG:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Not found')


@router.get('/state')
def inspect_state_route(
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_debug()
    target_date = as_of_date or user_local_date(current_user.timezone)
    return inspect_rule_state(db, user=current_user, target_date=target_date)


@router.post('/simulate/{scenario}')
def simulate_route(
    scenario: str,
    as_of_date=Depends(get_request_target_date),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_debug()
    target_date = as_of_date or user_local_date(current_user.timezone)
    try:
        return simulate_scenario(db, user=current_user, scenario=scenario, target_date=target_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
