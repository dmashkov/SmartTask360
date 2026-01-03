"""
SmartTask360 — User schemas (Pydantic)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.core.types import UserRole


class UserBase(BaseModel):
    """Base user schema with common fields"""

    email: EmailStr
    name: str = Field(min_length=2, max_length=255)
    role: UserRole
    department_id: UUID | None = None


class UserCreate(UserBase):
    """Schema for creating a new user"""

    password: str = Field(min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user (all fields optional)"""

    email: EmailStr | None = None
    name: str | None = Field(None, min_length=2, max_length=255)
    role: UserRole | None = None
    department_id: UUID | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    """Schema for user response (without password)"""

    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    """Schema for user login"""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
