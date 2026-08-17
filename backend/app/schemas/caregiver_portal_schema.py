from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class CaregiverProfileSelfUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    shift: Optional[str] = None
    profileImage: Optional[str] = None

class CaregiverPortalDashboardSummary(BaseModel):
    total_assigned: int = 0
    checkins_completed_today: int = 0
    checkins_missed_today: int = 0
    moderate_risk_count: int = 0
    high_risk_count: int = 0
    unresolved_alerts_count: int = 0

class CaregiverAssignedElderlyItem(BaseModel):
    id: str
    user_id: str
    name: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = ""
    date_of_birth: Optional[str] = None
    risk_level: str = "Low"
    last_checkin_date: Optional[str] = None
    last_checkin_time: Optional[str] = None
    medication_status: str = "Pending"  # Taken, Missed, Pending
    alert_status: str = "Clear"          # Clear, Moderate Risk, High Risk, Missed Check-in
    profileImage: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""

class ExplainableAIRiskFactor(BaseModel):
    factor_name: str
    description: str
    impact_level: str  # High, Medium, Low

class ExplainableAIRiskBreakdown(BaseModel):
    risk_level: str  # Low, Moderate, High
    confidence_score: int  # e.g., 85 (%)
    risk_label: str
    summary: str
    safety_disclaimer: str
    contributing_factors: List[ExplainableAIRiskFactor]

class CaregiverElderlyDetailResponse(BaseModel):
    profile: Dict[str, Any]
    health_info: Dict[str, Any]
    hospital_info: Dict[str, Any]
    doctor_info: Dict[str, Any]
    medications: List[Dict[str, Any]]
    emergency_contacts: List[Dict[str, Any]]
    assignment_info: Dict[str, Any]
    latest_checkin: Optional[Dict[str, Any]] = None
    explainable_risk: Optional[ExplainableAIRiskBreakdown] = None

class CaregiverAlertItem(BaseModel):
    id: str
    elderly_id: str
    elderly_name: str
    caregiver_id: Optional[str] = None
    alert_type: str  # High Risk, Moderate Risk, Missed Check-in, Wellness Change
    severity: str    # High, Moderate, Info
    title: str
    reason: str
    message: str
    status: str      # New, Acknowledged, Resolved
    resolution_note: Optional[str] = ""
    created_at: str
    updated_at: str

class CaregiverAlertResolvePayload(BaseModel):
    resolution_note: Optional[str] = Field(default="", example="Contacted patient; confirmed medication taken late.")

class CaregiverTaskItem(BaseModel):
    id: str
    caregiver_id: str
    caregiver_user_id: str
    elderly_id: str
    elderly_name: str
    title: str
    description: Optional[str] = ""
    priority: str  # High, Medium, Low
    due_date: Optional[str] = None
    status: str    # Pending, In Progress, Completed
    created_at: str
    updated_at: str

class CaregiverTaskCreatePayload(BaseModel):
    elderly_id: str = Field(..., description="ID of assigned elderly client")
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(default="")
    priority: Optional[str] = Field(default="Medium", example="High")  # High, Medium, Low
    due_date: Optional[str] = Field(default=None, example="2026-08-14")

class CaregiverTaskUpdatePayload(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None  # Pending, In Progress, Completed

class CaregiverCareReportResponse(BaseModel):
    elderly_id: str
    elderly_name: str
    start_date: str
    end_date: str
    total_checkins: int
    completed_checkins: int
    missed_checkins: int
    risk_distribution: Dict[str, int]
    medication_adherence_rate: float
    total_alerts: int
    resolved_alerts: int
    summary_notes: str

class CaregiverSettingsUpdatePayload(BaseModel):
    high_risk_alerts: Optional[bool] = True
    moderate_risk_alerts: Optional[bool] = True
    missed_checkin_alerts: Optional[bool] = True
    task_reminders: Optional[bool] = True

class CaregiverPasswordChangePayload(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)
