from datetime import date, datetime

from pydantic import BaseModel


class ReminderEventResponse(BaseModel):
    id: int
    userId: int
    date: date
    type: str
    title: str
    body: str
    delivered: bool
    opened: bool
    createdAt: datetime


class ReminderListResponse(BaseModel):
    reminders: list[ReminderEventResponse]
