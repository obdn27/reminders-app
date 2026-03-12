from datetime import date, datetime

from pydantic import BaseModel, Field


class RuleStateResponse(BaseModel):
    reminderState: str | None = None
    missStreak: int
    driftFlags: list[str]


class DailyProgressResponse(BaseModel):
    id: int
    userId: int
    date: date
    jobWorkMinutesCompleted: int
    movementMinutesCompleted: int
    dailyJobTaskCompleted: bool
    goalsMetCount: int
    totalGoalsCount: int
    overallStatus: str
    reminderState: str | None = None
    driftFlags: list[str]
    missStreak: int
    createdAt: datetime
    updatedAt: datetime


class PatchTodayProgressRequest(BaseModel):
    dailyJobTaskCompleted: bool | None = None
    movementMinutesCompleted: int | None = Field(default=None, ge=0, le=300)


class SessionResultResponse(BaseModel):
    session: dict
    dailyProgress: DailyProgressResponse
    ruleState: RuleStateResponse
