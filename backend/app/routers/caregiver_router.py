from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status

from app.schemas.caregiver_schema import (
    CaregiverCreateSchema, CaregiverUpdateSchema, CaregiverAssignElderlySchema,
    DailyReportCreateSchema, CaregiverResponseSchema, DailyReportResponseSchema,
    CaregiverPaginatedResponseSchema, CaregiverPerformanceSchema
)
from app.services.caregiver_service import CaregiverService
from app.security import get_current_admin_user

router = APIRouter(prefix="/api/caregivers", tags=["Caregiver Management"])

@router.get("", response_model=CaregiverPaginatedResponseSchema)
def get_all_caregivers(
    search: Optional[str] = Query(None, description="Search by name, email, or qualification"),
    shift: Optional[str] = Query(None, description="Filter by shift (Day, Night, Rotational)"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Inactive, On Leave)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get all caregiver profiles with search, shift filter, status filter, and pagination.
    """
    return CaregiverService.get_all_caregivers(
        search=search,
        shift=shift,
        status_filter=status,
        page=page,
        limit=limit
    )

@router.get("/{caregiver_id}", response_model=CaregiverResponseSchema)
def get_caregiver_by_id(
    caregiver_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get single caregiver profile by ID.
    """
    return CaregiverService.get_caregiver_by_id(caregiver_id)

@router.post("", response_model=CaregiverResponseSchema, status_code=status.HTTP_201_CREATED)
def create_caregiver(
    payload: CaregiverCreateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Add a new caregiver profile and create user credentials.
    """
    return CaregiverService.create_caregiver(payload)

@router.put("/{caregiver_id}", response_model=CaregiverResponseSchema)
def update_caregiver(
    caregiver_id: str,
    payload: CaregiverUpdateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Update caregiver qualifications, shift, experience, or contact details.
    """
    return CaregiverService.update_caregiver(caregiver_id, payload)

@router.post("/{caregiver_id}/assign-elderly", response_model=CaregiverResponseSchema)
def assign_elderly_to_caregiver(
    caregiver_id: str,
    payload: CaregiverAssignElderlySchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Assign an elderly resident to this caregiver.
    """
    return CaregiverService.assign_elderly_to_caregiver(caregiver_id, payload)

@router.post("/{caregiver_id}/remove-elderly", response_model=CaregiverResponseSchema)
def remove_elderly_from_caregiver(
    caregiver_id: str,
    payload: CaregiverAssignElderlySchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Remove an elderly patient assignment from this caregiver.
    """
    return CaregiverService.remove_elderly_from_caregiver(caregiver_id, payload)

@router.get("/{caregiver_id}/daily-reports", response_model=List[DailyReportResponseSchema])
def get_daily_reports(
    caregiver_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get historical daily care reports submitted by caregiver.
    """
    return CaregiverService.get_daily_reports(caregiver_id)

@router.post("/{caregiver_id}/daily-reports", response_model=DailyReportResponseSchema, status_code=status.HTTP_201_CREATED)
def add_daily_report(
    caregiver_id: str,
    payload: DailyReportCreateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Submit a new daily care report for an assigned elderly patient.
    """
    return CaregiverService.add_daily_report(caregiver_id, payload)

@router.get("/{caregiver_id}/performance", response_model=CaregiverPerformanceSchema)
def get_caregiver_performance(
    caregiver_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get caregiver performance rating and scorecard metrics.
    """
    return CaregiverService.get_caregiver_performance(caregiver_id)

@router.delete("/{caregiver_id}", response_model=dict)
def delete_caregiver(
    caregiver_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Permanently delete a caregiver profile.
    """
    return CaregiverService.delete_caregiver(caregiver_id)
