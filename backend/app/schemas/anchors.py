from datetime import datetime, time
from typing import Literal

from pydantic import BaseModel, Field


AnchorType = Literal['deep_work', 'job_applications', 'upskilling', 'movement', 'chores_admin', 'meals_cooking', 'planning']
AnchorUnit = Literal['minutes', 'count', 'completion']
AnchorTrackingType = Literal['session', 'count', 'boolean']


class DailyAnchorInput(BaseModel):
    id: int | None = None
    category: AnchorType
    label: str = Field(min_length=1, max_length=120)
    targetValue: int = Field(ge=1, le=480)
    reminderTime: time | None = None
    nextAnchorId: int | None = None
    active: bool = True


class DailyAnchorResponse(BaseModel):
    id: int
    userId: int
    category: AnchorType
    label: str
    anchorType: AnchorType
    targetValue: int
    targetUnit: AnchorUnit
    trackingType: AnchorTrackingType
    reminderTime: time | None = None
    nextAnchorId: int | None = None
    active: bool
    displayOrder: int
    createdAt: datetime
    updatedAt: datetime


class DailyAnchorsResponse(BaseModel):
    anchors: list[DailyAnchorResponse]


class UpsertDailyAnchorsRequest(BaseModel):
    anchors: list[DailyAnchorInput] = Field(min_length=2, max_length=4)
