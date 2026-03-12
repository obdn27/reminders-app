from datetime import date

from pydantic import BaseModel


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    timezone: str | None = None
    tonePreference: str | None = None
    sprintModeEnabled: bool | None = None
    sprintStartDate: date | None = None
    sprintEndDate: date | None = None
    hasCompletedOnboarding: bool | None = None
