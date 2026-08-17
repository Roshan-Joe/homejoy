from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "Admin"
    ELDERLY = "Elderly"
    CAREGIVER = "Caregiver"
    DOCTOR = "Doctor"
    FAMILY_MEMBER = "Family Member"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class UserCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="John Doe")
    email: EmailStr = Field(..., example="johndoe@example.com")
    phone: Optional[str] = Field(default="", example="+1234567890")
    password: str = Field(..., min_length=6, example="password123")
    role: UserRole = Field(default=UserRole.ELDERLY, example="Elderly")
    status: UserStatus = Field(default=UserStatus.ACTIVE, example="active")
    profileImage: Optional[str] = Field(default="", example="")

class UserUpdateSchema(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    password: Optional[str] = Field(default=None, min_length=6)
    role: Optional[UserRole] = Field(default=None)
    status: Optional[UserStatus] = Field(default=None)
    profileImage: Optional[str] = Field(default=None)

class UserStatusUpdateSchema(BaseModel):
    status: Optional[UserStatus] = None
    is_active: Optional[bool] = None

class UserResponseSchema(BaseModel):
    id: str
    name: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    role: str
    status: str
    is_active: bool
    profileImage: Optional[str] = ""
    googleId: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class UserPaginatedResponseSchema(BaseModel):
    users: List[UserResponseSchema]
    total: int
    page: int
    limit: int
    total_pages: int
