from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from app.constants import KERALA_DISTRICTS, validate_district

class DailyReportCreateSchema(BaseModel):
    elderly_id: str = Field(..., json_schema_extra={"example": "60d5ec49f1b2c80015f8e123"})
    report_date: Optional[str] = Field(default=None, json_schema_extra={"example": "2026-08-03"})
    blood_pressure: Optional[str] = Field(default="120/80")
    heart_rate: Optional[int] = Field(default=72)
    temperature: Optional[float] = Field(default=98.6)
    meal_notes: Optional[str] = Field(default="Balanced meals eaten.")
    medication_administered: bool = Field(default=True)
    general_observations: Optional[str] = Field(default="Patient active and cooperative.")

class CaregiverCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, json_schema_extra={"example": "Sarah Connor"})
    email: EmailStr = Field(..., json_schema_extra={"example": "sarah@homejoy.com"})
    phone: Optional[str] = Field(default="", json_schema_extra={"example": "+1 (555) 345-6789"})
    password: Optional[str] = Field(default="password123", min_length=6)
    qualification: str = Field(default="Certified Nursing Assistant (CNA)")
    experience_years: int = Field(default=5, ge=0, le=40)
    shift: str = Field(default="Day", json_schema_extra={"example": "Day"}) # Day, Night, Rotational
    status: str = Field(default="Active", json_schema_extra={"example": "Active"})
    district: str = Field(..., json_schema_extra={"example": "Ernakulam"})
    max_patients: int = Field(default=8, ge=1, le=20, json_schema_extra={"example": 8})

    @field_validator("district")
    @classmethod
    def check_district(cls, v):
        return validate_district(v, required=True)

class CaregiverUpdateSchema(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    shift: Optional[str] = None
    status: Optional[str] = None
    district: Optional[str] = None
    max_patients: Optional[int] = Field(default=None, ge=1, le=20)

    @field_validator("district")
    @classmethod
    def check_district(cls, v):
        if v is not None:
            return validate_district(v, required=False)
        return v

class CaregiverAssignElderlySchema(BaseModel):
    elderly_id: str = Field(..., description="ID of Elderly patient to assign or remove")

class CaregiverResponseSchema(BaseModel):
    id: str
    user_id: str
    name: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    qualification: str
    experience_years: int
    shift: str
    status: str
    district: str = ""
    max_patients: int = 8
    assigned_elderly_ids: List[str]
    assigned_elderly_names: List[str]
    daily_reports_submitted: int
    performance_rating: float
    profileImage: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class DailyReportResponseSchema(BaseModel):
    id: str
    caregiver_id: str
    caregiver_name: str
    elderly_id: str
    elderly_name: str
    report_date: str
    blood_pressure: str
    heart_rate: int
    temperature: float
    meal_notes: str
    medication_administered: bool
    general_observations: str
    created_at: str

class CaregiverPaginatedResponseSchema(BaseModel):
    caregivers: List[CaregiverResponseSchema]
    total: int
    page: int
    limit: int
    total_pages: int

class CaregiverPerformanceSchema(BaseModel):
    caregiver_id: str
    name: str
    rating: float
    total_reports: int
    on_time_submission_rate: float
    patient_feedback_score: float
    attendance_rate: float
    assigned_count: int
