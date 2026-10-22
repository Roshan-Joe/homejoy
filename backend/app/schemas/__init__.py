from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any
import re

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, json_schema_extra={"example": "John Doe"})
    email: EmailStr = Field(..., json_schema_extra={"example": "johndoe@example.com"})
    password: str = Field(..., min_length=6, json_schema_extra={"example": "password123"})
    role: str = Field(default="Elderly", json_schema_extra={"example": "Elderly"}) # Only "Elderly" or "Caregiver" allowed on public signup

    # Guardian / Family Contact Fields (Mandatory for Elderly role registration)
    guardian_name: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None
    guardian_report_consent: Optional[bool] = False
    guardian_report_enabled: Optional[bool] = None

    @field_validator("guardian_name")
    @classmethod
    def validate_guardian_name(cls, v):
        if v is not None:
            v_clean = v.strip()
            if not v_clean:
                return None
            if not (2 <= len(v_clean) <= 100):
                raise ValueError("Guardian name must be between 2 and 100 characters.")
            if any(ch in v_clean for ch in ("\r", "\n")):
                raise ValueError("Guardian name must not contain newlines.")
            return v_clean
        return v

    @field_validator("guardian_relationship")
    @classmethod
    def validate_guardian_relationship(cls, v):
        if v is not None:
            v_clean = v.strip()
            if not v_clean:
                return None
            if len(v_clean) > 50:
                raise ValueError("Guardian relationship must not exceed 50 characters.")
            return v_clean
        return v

    @field_validator("guardian_phone")
    @classmethod
    def validate_guardian_phone(cls, v):
        if v is not None:
            v_clean = v.strip()
            if not v_clean:
                return None
            if any(ch in v_clean for ch in ("\r", "\n")):
                raise ValueError("Guardian phone number must not contain newlines.")
            digits = re.sub(r"[^\d]", "", v_clean)
            if not (7 <= len(digits) <= 15):
                raise ValueError("Guardian phone number must contain between 7 and 15 digits.")
            if not re.match(r"^\+?[\d\s\-()]+$", v_clean):
                raise ValueError("Guardian phone number contains invalid characters.")
            return v_clean
        return v

    @field_validator("guardian_email", mode="before")
    @classmethod
    def validate_guardian_email(cls, v):
        if v is not None:
            v_str = str(v)
            if any(ch in v_str for ch in ("\r", "\n")):
                raise ValueError("Guardian email must not contain newline characters.")
            v_clean = v_str.strip().lower()
            if not v_clean:
                return None
            if len(v_clean) > 254:
                raise ValueError("Guardian email must not exceed 254 characters.")
            return v_clean
        return v

    @model_validator(mode="after")
    def validate_guardian_requirements(self):
        role_clean = (self.role or "Elderly").strip().lower()
        if role_clean == "elderly":
            has_email = bool(self.guardian_email and str(self.guardian_email).strip())
            has_name_and_phone = bool(
                self.guardian_name and self.guardian_name.strip() and
                self.guardian_phone and self.guardian_phone.strip()
            )
            if not (has_email or has_name_and_phone):
                raise ValueError(
                    "Registration must include at least one guardian contact method: "
                    "either (a) Guardian Email, or (b) Guardian Name and Guardian Phone."
                )
            if has_email and not self.guardian_report_consent:
                raise ValueError(
                    "Guardian consent is required: The guardian has agreed to receive wellness reports (guardian_report_consent must be True when guardian email is provided)."
                )
            if has_email and self.guardian_report_enabled is None:
                self.guardian_report_enabled = True
        return self

class UserLogin(BaseModel):
    email: EmailStr = Field(..., json_schema_extra={"example": "johndoe@example.com"})
    password: str = Field(..., json_schema_extra={"example": "password123"})

class GoogleLoginRequest(BaseModel):
    credential: str = Field(..., json_schema_extra={"example": "eyJhbGciOiJSUzI1NiIs..."})
    role: Optional[str] = Field(default="Elderly", json_schema_extra={"example": "Elderly"}) # Only "Elderly" or "Caregiver" allowed on public signup


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
