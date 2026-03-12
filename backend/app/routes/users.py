from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.schemas.profile import UpdateProfileRequest
from app.schemas.user import UserResponse
from app.services.profile_service import to_profile_response, update_profile

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me/profile', response_model=UserResponse)
def get_profile_route(current_user=Depends(get_current_user)):
    return to_profile_response(current_user)


@router.patch('/me', response_model=UserResponse)
def patch_profile_route(
    payload: UpdateProfileRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_profile(db, user=current_user, payload=payload)
