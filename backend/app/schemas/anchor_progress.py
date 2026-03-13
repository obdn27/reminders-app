from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class AnchorProgressItemResponse(BaseModel):
    anchorId: int
    anchorType: str
    title: str
    trackingType: Literal['session', 'count', 'boolean']
    targetValue: int
    targetUnit: str
    reminderTime: str | None = None
    progressValue: int
    completed: bool


class TodayAnchorProgressResponse(BaseModel):
    date: date
    anchors: list[AnchorProgressItemResponse]
    completedAnchors: int
    totalAnchors: int
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class AnchorProgressHistoryItemResponse(BaseModel):
    date: date
    completionRate: int
    completedAnchors: int
    totalAnchors: int


class AnchorProgressHistoryResponse(BaseModel):
    history: list[AnchorProgressHistoryItemResponse]


class UpdateAnchorProgressRequest(BaseModel):
    anchorId: int
    progressValue: int | None = Field(default=None, ge=0, le=480)
    incrementBy: int | None = Field(default=None, ge=1, le=50)
    completed: bool | None = None
