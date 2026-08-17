from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class MedicalNoteCreateSchema(BaseModel):
    elderly_id: str = Field(..., example="60d5ec49f1b2c80015f8e123")
    note_date: Optional[str] = Field(default=None, example="2026-08-03")
    diagnosis: str = Field(..., min_length=2, example="Hypertension & Mild Arthritis")
    clinical_notes: str = Field(..., min_length=2, example="Blood pressure under control. Encouraged daily walking.")
    prescriptions: Optional[List[str]] = Field(default=["Lisinopril 10mg once daily"])
    follow_up_date: Optional[str] = Field(default="2026-09-03")

class DoctorCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="Dr. Robert Smith")
    email: EmailStr = Field(..., example="drsmith@homejoy.com")
    phone: Optional[str] = Field(default="", example="+1 (555) 456-7890")
    password: Optional[str] = Field(default="password123", min_length=6)
    specialization: str = Field(default="Geriatrician", example="Geriatrician")
    license_number: str = Field(..., example="MD-89241")
    hospital_affiliation: Optional[str] = Field(default="City General Hospital")
    experience_years: int = Field(default=12, ge=0, le=50)
    status: str = Field(default="Active", example="Active")

class DoctorUpdateSchema(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    experience_years: Optional[int] = None
    status: Optional[str] = None

class DoctorAssignPatientSchema(BaseModel):
    elderly_id: str = Field(..., description="ID of Elderly patient to assign or remove")

class DoctorResponseSchema(BaseModel):
    id: str
    user_id: str
    name: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    specialization: str
    license_number: str
    hospital_affiliation: str
    experience_years: int
    status: str
    assigned_patient_ids: List[str]
    assigned_patient_names: List[str]
    appointments_count: int
    profileImage: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class MedicalNoteResponseSchema(BaseModel):
    id: str
    doctor_id: str
    doctor_name: str
    elderly_id: str
    elderly_name: str
    note_date: str
    diagnosis: str
    clinical_notes: str
    prescriptions: List[str]
    follow_up_date: Optional[str] = None
    created_at: str

class DoctorPaginatedResponseSchema(BaseModel):
    doctors: List[DoctorResponseSchema]
    total: int
    page: int
    limit: int
    total_pages: int

class AppointmentSchema(BaseModel):
    id: str
    doctor_id: str
    doctor_name: str
    elderly_id: str
    elderly_name: str
    appointment_date: str
    time_slot: str
    status: str
    type: str
