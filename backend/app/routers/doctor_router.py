from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status

from app.schemas.doctor_schema import (
    DoctorCreateSchema, DoctorUpdateSchema, DoctorAssignPatientSchema,
    MedicalNoteCreateSchema, DoctorResponseSchema, MedicalNoteResponseSchema,
    DoctorPaginatedResponseSchema, AppointmentSchema
)
from app.services.doctor_service import DoctorService
from app.security import get_current_admin_user

router = APIRouter(prefix="/api/doctors", tags=["Doctor Management"])

@router.get("", response_model=DoctorPaginatedResponseSchema)
def get_all_doctors(
    search: Optional[str] = Query(None, description="Search by name, email, specialization, or license"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Inactive, On Call)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get all doctor profiles with search, specialization filter, status filter, and pagination.
    """
    return DoctorService.get_all_doctors(
        search=search,
        specialization=specialization,
        status_filter=status,
        page=page,
        limit=limit
    )

@router.get("/{doctor_id}", response_model=DoctorResponseSchema)
def get_doctor_by_id(
    doctor_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get single doctor profile details by ID.
    """
    return DoctorService.get_doctor_by_id(doctor_id)

@router.post("", response_model=DoctorResponseSchema, status_code=status.HTTP_201_CREATED)
def create_doctor(
    payload: DoctorCreateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Create a new doctor profile and create user credentials.
    """
    return DoctorService.create_doctor(payload)

@router.put("/{doctor_id}", response_model=DoctorResponseSchema)
def update_doctor(
    doctor_id: str,
    payload: DoctorUpdateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Update doctor specialization, license number, hospital affiliation, or experience.
    """
    return DoctorService.update_doctor(doctor_id, payload)

@router.post("/{doctor_id}/assign-elderly", response_model=DoctorResponseSchema)
def assign_elderly_to_doctor(
    doctor_id: str,
    payload: DoctorAssignPatientSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Assign an elderly resident to this doctor.
    """
    return DoctorService.assign_elderly_to_doctor(doctor_id, payload)

@router.post("/{doctor_id}/remove-elderly", response_model=DoctorResponseSchema)
def remove_elderly_from_doctor(
    doctor_id: str,
    payload: DoctorAssignPatientSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Remove an elderly patient assignment from this doctor.
    """
    return DoctorService.remove_elderly_from_doctor(doctor_id, payload)

@router.get("/{doctor_id}/medical-notes", response_model=List[MedicalNoteResponseSchema])
def get_medical_notes(
    doctor_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get clinical medical notes written by doctor.
    """
    return DoctorService.get_medical_notes(doctor_id)

@router.post("/{doctor_id}/medical-notes", response_model=MedicalNoteResponseSchema, status_code=status.HTTP_201_CREATED)
def create_medical_note(
    doctor_id: str,
    payload: MedicalNoteCreateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Create a new clinical medical note and prescription entry.
    """
    return DoctorService.create_medical_note(doctor_id, payload)

@router.get("/{doctor_id}/appointments", response_model=List[AppointmentSchema])
def get_doctor_appointments(
    doctor_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get appointments list associated with doctor.
    """
    return DoctorService.get_doctor_appointments(doctor_id)

@router.delete("/{doctor_id}", response_model=dict)
def delete_doctor(
    doctor_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Permanently delete a doctor profile.
    """
    return DoctorService.delete_doctor(doctor_id)
