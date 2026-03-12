from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: Optional[str] = None
    timezone: str
    tonePreference: str
    sprintModeEnabled: bool
    sprintStartDate: Optional[date] = None
    sprintEndDate: Optional[date] = None
    hasCompletedOnboarding: bool
    createdAt: datetime
