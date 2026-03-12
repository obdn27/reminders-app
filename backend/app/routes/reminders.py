from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.services.reminder_service import latest_reminder, open_reminder, pending_reminders

router = APIRouter(prefix='/reminders', tags=['reminders'])


@router.get('/latest')
def get_latest_reminder_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {'reminder': latest_reminder(db, user=current_user)}


@router.get('/pending')
def get_pending_reminders_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {'reminders': pending_reminders(db, user=current_user)}


@router.patch('/{reminder_id}/opened')
def mark_opened_route(reminder_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    opened = open_reminder(db, user=current_user, reminder_id=reminder_id)
    if not opened:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reminder not found')
    return {'reminder': opened}
