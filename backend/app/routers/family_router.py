from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status

from app.schemas.family_schema import (
    FamilyCreateSchema, FamilyUpdateSchema, FamilyLinkElderlySchema,
    FamilyResponseSchema, FamilyPaginatedResponseSchema, EmergencySummaryResponseSchema
)
from app.services.family_service import FamilyService
from app.security import get_current_admin_user

router = APIRouter(prefix="/api/family-members", tags=["Family Member Management"])

@router.get("", response_model=FamilyPaginatedResponseSchema)
def get_all_family_members(
    search: Optional[str] = Query(None, description="Search by name, email, phone, or relationship"),
    relationship: Optional[str] = Query(None, description="Filter by relationship (Son, Daughter, Spouse, Sibling, Guardian)"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Inactive)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get all family member profiles with search, relationship filter, status filter, and pagination.
    """
    return FamilyService.get_all_family_members(
        search=search,
        relationship=relationship,
        status_filter=status,
        page=page,
        limit=limit
    )

@router.get("/{family_id}", response_model=FamilyResponseSchema)
def get_family_member_by_id(
    family_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get single family member profile details by ID.
    """
    return FamilyService.get_family_member_by_id(family_id)

@router.post("", response_model=FamilyResponseSchema, status_code=status.HTTP_201_CREATED)
def create_family_member(
    payload: FamilyCreateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Create a new family member profile and create user credentials.
    """
    return FamilyService.create_family_member(payload)

@router.put("/{family_id}", response_model=FamilyResponseSchema)
def update_family_member(
    family_id: str,
    payload: FamilyUpdateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Update family member relationship, primary contact flag, or phone contact.
    """
    return FamilyService.update_family_member(family_id, payload)

@router.post("/{family_id}/link-elderly", response_model=FamilyResponseSchema)
def link_elderly_to_family(
    family_id: str,
    payload: FamilyLinkElderlySchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Link an elderly resident to this family member.
    """
    return FamilyService.link_elderly_to_family(family_id, payload)

@router.post("/{family_id}/unlink-elderly", response_model=FamilyResponseSchema)
def unlink_elderly_from_family(
    family_id: str,
    payload: FamilyLinkElderlySchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Unlink an elderly resident from this family member.
    """
    return FamilyService.unlink_elderly_from_family(family_id, payload)

@router.get("/{family_id}/emergency-summary", response_model=List[EmergencySummaryResponseSchema])
def get_emergency_summary(
    family_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get consolidated emergency summary report for all linked elderly residents.
    """
    return FamilyService.get_emergency_summary(family_id)

@router.delete("/{family_id}", response_model=dict)
def delete_family_member(
    family_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Permanently delete a family member profile.
    """
    return FamilyService.delete_family_member(family_id)
