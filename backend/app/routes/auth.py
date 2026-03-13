from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, SignupRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import (
    authenticate_user,
    get_current_user_profile,
    refresh_access_token,
    signup,
)

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/signup', response_model=LoginResponse)
def signup_route(payload: SignupRequest, db: Session = Depends(get_db)):
    return signup(db, email=payload.email, password=payload.password, name=payload.name)


@router.post('/login', response_model=LoginResponse)
def login_route(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    password = payload.password
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail='Email and password are required',
        )
    return authenticate_user(db, email=email, password=password)


@router.post('/refresh', response_model=TokenResponse)
def refresh_route(payload: RefreshRequest, db: Session = Depends(get_db)):
    return refresh_access_token(db, refresh_token=payload.refreshToken)


@router.get('/me', response_model=UserResponse)
def me_route(current_user=Depends(get_current_user)):
    return get_current_user_profile(current_user)


@router.post('/logout')
def logout_route():
    return {'ok': True}
