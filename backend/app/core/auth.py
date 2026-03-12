from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.tokens import decode_token
from app.crud.users import get_user_by_id


def resolve_user_from_bearer(db: Session, bearer_token: str):
    if not bearer_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing token')

    payload = decode_token(bearer_token)
    if payload.get('type') != 'access':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid access token type')

    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid access token')

    user = get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')

    return user
