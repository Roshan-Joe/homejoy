from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, example="John Doe")
    email: EmailStr = Field(..., example="johndoe@example.com")
    password: str = Field(..., min_length=6, example="password123")
    role: str = Field(default="Elderly", example="Elderly") # Elderly, Caregiver, Family Member, Admin

class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="johndoe@example.com")
    password: str = Field(..., example="password123")

class GoogleLoginRequest(BaseModel):
    credential: str = Field(..., example="eyJhbGciOiJSUzI1NiIs...")
    role: Optional[str] = Field(default="Elderly", example="Elderly")


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str
    is_active: bool = True
    created_at: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class DashboardStats(BaseModel):
    total_users: int
    total_elderly: int
    total_caregivers: int
    active_users: int
    new_registrations: int
    recent_users: List[UserOut]

class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=2)
    type: str = Field(default="announcement") # announcement, emergency, system
    target_role: str = Field(default="all") # all, Elderly, Caregiver, Family Member

class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    type: str
    target_role: str
    created_at: str
    created_by: str

class AnalyticsData(BaseModel):
    registration_trend: List[Dict[str, Any]]
    role_distribution: List[Dict[str, Any]]
    active_status: Dict[str, int]

class DatabaseStatusOut(BaseModel):
    status: str
    latency_ms: float
    database_name: str
    collections_count: int
    collections_detail: Dict[str, int]
    server_version: Optional[str] = "N/A"
