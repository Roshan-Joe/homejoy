from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date

class VitalsCreate(BaseModel):
    """
    Blood Pressure and Oxygen Saturation entry schema.
    Strictly validated numerical bounds without diagnostic claims.
    """
    systolic: int = Field(..., ge=50, le=250, description="Systolic BP in mmHg")
    diastolic: int = Field(..., ge=30, le=150, description="Diastolic BP in mmHg")
    oxygen_saturation: int = Field(..., ge=50, le=100, description="Oxygen Saturation SpO2 %")
    date: Optional[str] = Field(None, example="2026-08-19")

    @field_validator("date")
    @classmethod
    def validate_date(cls, v):
        if v is None:
            return v
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("Date must be a valid ISO date in YYYY-MM-DD format.")
        return v

    @field_validator("diastolic")
    @classmethod
    def diastolic_must_be_less_than_systolic(cls, v, info):
        systolic = info.data.get("systolic")
        if systolic and v >= systolic:
            raise ValueError("Diastolic blood pressure must be lower than systolic pressure.")
        return v


class VitalsResponse(BaseModel):
    id: str
    user_id: str
    elderly_id: Optional[str] = ""
    date: str
    systolic: int
    diastolic: int
    oxygen_saturation: int
    advisory_notes: Optional[str] = ""
    created_at: str
    updated_at: str
