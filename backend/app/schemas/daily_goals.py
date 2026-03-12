from datetime import datetime

from pydantic import BaseModel, Field


class DailyGoalsResponse(BaseModel):
    id: int
    userId: int
    jobWorkMinutesGoal: int
    movementMinutesGoal: int
    dailyJobTaskGoal: bool
    createdAt: datetime
    updatedAt: datetime


class UpsertDailyGoalsRequest(BaseModel):
    jobWorkMinutesGoal: int = Field(ge=1, le=480)
    movementMinutesGoal: int = Field(ge=1, le=300)
    dailyJobTaskGoal: bool = True
