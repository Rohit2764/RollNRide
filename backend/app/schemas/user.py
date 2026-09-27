from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole, UserStatus

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenRefresh(BaseModel):
    refresh_token: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: UserStatus
    created_at: datetime
    updated_at: datetime

TokenResponse.model_rebuild()
