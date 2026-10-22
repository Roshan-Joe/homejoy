import re
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any

class WellnessCheckinSchema(BaseModel):
    date: str = Field(..., example="2026-08-03")
    mood: str = Field(default="Good", example="Good")
    blood_pressure: Optional[str] = Field(default="120/80", example="120/80")
    heart_rate: Optional[int] = Field(default=72, example=72)
    sleep_hours: Optional[float] = Field(default=7.5, example=7.5)
    notes: Optional[str] = Field(default="", example="Patient reports feeling energetic.")

class ElderlyCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="Eleanor Vance")
    email: EmailStr = Field(..., example="eleanor@homejoy.com")
    phone: Optional[str] = Field(default="", example="+1 (555) 234-5678")
    password: Optional[str] = Field(default="password123", min_length=6)
    age: int = Field(default=72, ge=50, le=120)
    date_of_birth: Optional[str] = Field(default="1954-04-12")
    gender: str = Field(default="Female", example="Female")
    blood_group: str = Field(default="O+", example="O+")
    address: Optional[str] = Field(default="")
    emergency_contact_name: Optional[str] = Field(default="Robert Vance")
    emergency_contact_phone: Optional[str] = Field(default="+1 (555) 987-6543")
    medical_conditions: Optional[List[str]] = Field(default=["Hypertension"])
    allergies: Optional[List[str]] = Field(default=["Penicillin"])
    medications: Optional[List[str]] = Field(default=["Lisinopril 10mg"])

    # Guardian / Family Contact Fields
    guardian_name: Optional[str] = Field(default=None, example="David Vance")
    guardian_relationship: Optional[str] = Field(default=None, example="Son")
    guardian_phone: Optional[str] = Field(default=None, example="+1 (555) 345-6789")
    guardian_email: Optional[EmailStr] = Field(default=None, example="david.vance@example.com")
    guardian_report_consent: bool = Field(default=False, description="Guardian agreed to receive wellness reports")
    guardian_report_enabled: bool = Field(default=True, description="Enable automated/manual daily report emails")

    @field_validator("guardian_name")
    @classmethod
    def validate_guardian_name(cls, v):
        if v is not None:
            v_clean = v.strip()
            if not v_clean:
                return None
            if len(v_clean) < 2 or len(v_clean) > 100:
                raise ValueError("Guardian name must be between 2 and 100 characters.")
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
            if len(v_clean) > 254:
                raise ValueError("Guardian email must not exceed 254 characters.")
            return v_clean
        return v

    @model_validator(mode="after")
    def validate_guardian_requirements(self):
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
        # Default report_enabled to True when guardian_email is given, unless explicitly set
        if has_email and self.guardian_report_enabled is None:
            self.guardian_report_enabled = True
        return self


class ElderlyUpdateSchema(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_conditions: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None

    # Guardian / Family Contact Fields (All Optional on Update)
    guardian_name: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None
    guardian_report_consent: Optional[bool] = None
    guardian_report_enabled: Optional[bool] = None

    @field_validator("guardian_name")
    @classmethod
    def validate_update_guardian_name(cls, v):
        if v is not None:
            v_clean = v.strip()
            if not v_clean:
                return ""
            if len(v_clean) < 2 or len(v_clean) > 100:
                raise ValueError("Guardian name must be between 2 and 100 characters.")
            return v_clean
        return v

    @field_validator("guardian_relationship")
    @classmethod
    def validate_update_guardian_relationship(cls, v):
        if v is not None:
            v_clean = v.strip()
            if len(v_clean) > 50:
                raise ValueError("Guardian relationship must not exceed 50 characters.")
            return v_clean
        return v

    @field_validator("guardian_phone")
    @classmethod
    def validate_update_guardian_phone(cls, v):
        if v is not None:
            v_clean = v.strip()
            if not v_clean:
                return ""
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
    def validate_update_guardian_email(cls, v):
        if v is not None:
            v_str = str(v)
            if any(ch in v_str for ch in ("\r", "\n")):
                raise ValueError("Guardian email must not contain newline characters.")
            v_clean = v_str.strip().lower()
            if len(v_clean) > 254:
                raise ValueError("Guardian email must not exceed 254 characters.")
            return v_clean
        return v


class AssignCaregiverSchema(BaseModel):
    caregiver_id: Optional[str] = Field(..., description="ID of Caregiver to assign or empty string to unassign")

class AssignDoctorSchema(BaseModel):
    doctor_id: Optional[str] = Field(..., description="ID of Doctor to assign or empty string to unassign")

class ElderlyResponseSchema(BaseModel):
    id: str
    user_id: str
    name: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    age: int
    date_of_birth: str
    gender: str
    blood_group: str
    address: Optional[str] = ""
    emergency_contact_name: Optional[str] = ""
    emergency_contact_phone: Optional[str] = ""
    
    # Guardian / Family Contact Fields
    guardian_name: Optional[str] = ""
    guardian_relationship: Optional[str] = ""
    guardian_phone: Optional[str] = ""
    guardian_email: Optional[str] = ""
    guardian_report_consent: Optional[bool] = False
    guardian_report_enabled: Optional[bool] = True

    assigned_caregiver_id: Optional[str] = None
    assigned_caregiver_name: Optional[str] = "Not Assigned"
    assigned_doctor_id: Optional[str] = None
    assigned_doctor_name: Optional[str] = "Not Assigned"
    medical_conditions: List[str]
    allergies: List[str]
    medications: List[str]
    ai_risk_score: float
    risk_level: str
    wellness_history: List[Dict[str, Any]]
    profileImage: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class ElderlyPaginatedResponseSchema(BaseModel):
    elderly: List[ElderlyResponseSchema]
    total: int
    page: int
    limit: int
    total_pages: int
