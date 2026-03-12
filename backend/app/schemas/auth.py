from pydantic import BaseModel, EmailStr, Field

from .user import UserResponse


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    refreshToken: str


class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = 'bearer'


class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = 'bearer'
    user: UserResponse
