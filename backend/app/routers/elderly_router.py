from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status

from app.schemas.elderly_schema import (
    ElderlyCreateSchema, ElderlyUpdateSchema, AssignCaregiverSchema,
    AssignDoctorSchema, WellnessCheckinSchema, ElderlyResponseSchema,
    ElderlyPaginatedResponseSchema
)
from app.services.elderly_service import ElderlyService
from app.security import get_current_admin_user

router = APIRouter(prefix="/api/elderly", tags=["Elderly Management"])

@router.get("", response_model=ElderlyPaginatedResponseSchema)
def get_all_elderly(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    caregiver_id: Optional[str] = Query(None, description="Filter by assigned caregiver ID"),
    doctor_id: Optional[str] = Query(None, description="Filter by assigned doctor ID"),
    risk_level: Optional[str] = Query(None, description="Filter by AI risk level (High, Medium, Low)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get all elderly patient profiles with search, caregiver/doctor filter, risk filter, and pagination.
    """
    return ElderlyService.get_all_elderly(
        search=search,
        caregiver_id=caregiver_id,
        doctor_id=doctor_id,
        risk_level=risk_level,
        page=page,
        limit=limit
    )

@router.get("/{elderly_id}", response_model=ElderlyResponseSchema)
def get_elderly_by_id(
    elderly_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get single elderly profile & medical details by ID.
    """
    return ElderlyService.get_elderly_by_id(elderly_id)

@router.post("", response_model=ElderlyResponseSchema, status_code=status.HTTP_201_CREATED)
def create_elderly(
    payload: ElderlyCreateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Create a new elderly patient profile and link/create user account.
    """
    return ElderlyService.create_elderly(payload)

@router.put("/{elderly_id}", response_model=ElderlyResponseSchema)
def update_elderly(
    elderly_id: str,
    payload: ElderlyUpdateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Update elderly medical & personal profile details.
    """
    return ElderlyService.update_elderly(elderly_id, payload)

@router.patch("/{elderly_id}/assign-caregiver", response_model=ElderlyResponseSchema)
def assign_caregiver(
    elderly_id: str,
    payload: AssignCaregiverSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Assign or unassign a caregiver for an elderly patient.
    """
    return ElderlyService.assign_caregiver(elderly_id, payload)

@router.patch("/{elderly_id}/assign-doctor", response_model=ElderlyResponseSchema)
def assign_doctor(
    elderly_id: str,
    payload: AssignDoctorSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Assign or unassign a doctor for an elderly patient.
    """
    return ElderlyService.assign_doctor(elderly_id, payload)

@router.post("/{elderly_id}/wellness-checkin", response_model=ElderlyResponseSchema)
def add_wellness_checkin(
    elderly_id: str,
    payload: WellnessCheckinSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Add a daily wellness check-in log and update AI risk score.
    """
    return ElderlyService.add_wellness_checkin(elderly_id, payload)

@router.delete("/{elderly_id}", response_model=dict)
def delete_elderly(
    elderly_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Permanently delete an elderly patient profile.
    """
    return ElderlyService.delete_elderly(elderly_id)
