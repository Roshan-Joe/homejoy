from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class FamilyCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="Mark Vance")
    email: EmailStr = Field(..., example="mark.vance@homejoy.com")
    phone: Optional[str] = Field(default="", example="+1 (555) 678-9012")
    password: Optional[str] = Field(default="password123", min_length=6)
    relationship: str = Field(default="Son", example="Son") # Son, Daughter, Spouse, Sibling, Guardian
    is_primary_contact: bool = Field(default=True)
    status: str = Field(default="Active", example="Active")

class FamilyUpdateSchema(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relationship: Optional[str] = None
    is_primary_contact: Optional[bool] = None
    status: Optional[str] = None

class FamilyLinkElderlySchema(BaseModel):
    elderly_id: str = Field(..., description="ID of Elderly resident to link or unlink")

class FamilyResponseSchema(BaseModel):
    id: str
    user_id: str
    name: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    relationship: str
    is_primary_contact: bool
    status: str
    linked_elderly_ids: List[str]
    linked_elderly_names: List[str]
    profileImage: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class FamilyPaginatedResponseSchema(BaseModel):
    family_members: List[FamilyResponseSchema]
    total: int
    page: int
    limit: int
    total_pages: int

class EmergencyContactItemSchema(BaseModel):
    name: str
    relationship: str
    phone: str
    email: str
    is_primary_contact: bool

class EmergencySummaryResponseSchema(BaseModel):
    elderly_id: str
    elderly_name: str
    age: int
    blood_group: str
    risk_level: str
    risk_score: float
    medical_conditions: List[str]
    allergies: List[str]
    active_prescriptions: List[str]
    primary_caregiver_name: str
    primary_doctor_name: str
    family_contacts: List[EmergencyContactItemSchema]
