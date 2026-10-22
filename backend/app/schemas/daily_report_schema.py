from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class DailyReportResponse(BaseModel):
    id: str
    elderly_id: str
    elderly_name: str
    user_id: str
    date: str
    status: str                         # "Complete" or "Pending"
    checkin_completed: bool
    vitals_completed: bool
    medication_adherence: Optional[str] = "N/A"
    checkin_data: Optional[Dict[str, Any]] = None
    vitals_data: Optional[Dict[str, Any]] = None
    wellness_risk: str                  # "Low", "Moderate", "High"
    explainable_risk: Optional[Dict[str, Any]] = None
    assigned_caregiver_id: Optional[str] = None
    assigned_caregiver_name: Optional[str] = "Not Assigned"
    generated_at: str
    updated_at: str
