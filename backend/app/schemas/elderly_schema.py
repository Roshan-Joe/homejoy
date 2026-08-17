from pydantic import BaseModel, EmailStr, Field
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
