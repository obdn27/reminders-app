from datetime import date, datetime

from pydantic import BaseModel, Field


class RuleStateResponse(BaseModel):
    dailyClassification: str
    stabilityState: str
    reminderState: str | None = None
    missStreak: int
    driftFlags: list[str]
    completionRate: int
    consistencyStreak: int = 0
    longestStreak: int = 0
    lastActiveDate: date | None = None
    retentionState: str = 'steady'


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
    dailyClassification: str | None = None
    stabilityState: str | None = None
    reminderState: str | None = None
    driftFlags: list[str]
    missStreak: int
    completionRate: int = 0
    completedAnchorsToday: int = 0
    consistencyStreak: int = 0
    longestStreak: int = 0
    lastActiveDate: date | None = None
    retentionState: str = 'steady'
    createdAt: datetime
    updatedAt: datetime


class PatchTodayProgressRequest(BaseModel):
    dailyJobTaskCompleted: bool | None = None
    movementMinutesCompleted: int | None = Field(default=None, ge=0, le=300)


class SessionResultResponse(BaseModel):
    session: dict
    dailyProgress: DailyProgressResponse
    ruleState: RuleStateResponse
