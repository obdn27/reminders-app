from datetime import date, datetime

from pydantic import BaseModel


class WeeklyReviewResponse(BaseModel):
    id: int
    userId: int
    weekStartDate: date
    weekEndDate: date
    daysGoalsMet: int
    longestStreak: int
    mostMissedArea: str
    driftDetected: bool
    summaryText: str
    createdAt: datetime


class WeeklyReviewListResponse(BaseModel):
    reviews: list[WeeklyReviewResponse]
