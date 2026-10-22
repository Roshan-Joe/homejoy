from pydantic import BaseModel, Field
from typing import Optional

ALLOWED_HELP_REASONS = [
    "I am not feeling well",
    "I need assistance",
    "I missed my medication",
    "Other"
]

class HelpRequestCreate(BaseModel):
    reason: str = Field(..., example="I am not feeling well")
    message: Optional[str] = Field(default="", max_length=500)


class HelpRequestResolution(BaseModel):
    resolution_note: Optional[str] = Field(default="", max_length=500)


class HelpRequestResponse(BaseModel):
    id: str
    elderly_id: str
    elderly_name: str
    user_id: str
    caregiver_id: str
    caregiver_name: Optional[str] = "Caregiver"
    reason: str
    message: Optional[str] = ""
    status: str                         # "Pending", "Acknowledged", "Resolved"
    created_at: str
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    resolution_note: Optional[str] = ""
