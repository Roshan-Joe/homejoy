"""
Elderly Client Router — all endpoints for elderly-user self-service.
All routes require authentication via get_current_user.
All routes additionally verify the user has role='Elderly'.
These are completely separate from the admin-only elderly management routes in elderly_router.py.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.security import get_current_user
from app.services.elderly_client_service import ElderlyClientService
from app.schemas.elderly_client_schema import (
    ElderlyProfileSelfUpdate,
    ElderlyProfileResponse,
    HealthInfoUpdate,
    HealthInfoResponse,
    HospitalInfoUpdate,
    HospitalInfoResponse,
    DoctorInfoResponse,
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    DoseLogRequest,
    EmergencyContactCreate,
    EmergencyContactUpdate,
    EmergencyContactResponse,
    CaregiverViewResponse,
    CheckInCreate,
    CheckInResponse,
    NotificationItemResponse,
    NotificationPrefsUpdate,
    ChangePasswordRequest,
)

router = APIRouter(prefix="/api/elderly/me", tags=["Elderly Client"])


def get_current_elderly_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency that ensures the calling user has role 'Elderly'.
    Reuses the existing get_current_user guard — no new auth logic.
    """
    role = str(current_user.get("role", "")).strip().lower()
    if role != "elderly":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This section is only accessible to Elderly users."
        )
    return current_user


# ---------------------------------------------------------------------------
# 1. Profile
# ---------------------------------------------------------------------------

@router.get("", response_model=ElderlyProfileResponse, summary="Get my profile")
def get_my_profile(current_user: dict = Depends(get_current_elderly_user)):
    """Return the authenticated elderly user's own profile (no admin token required)."""
    return ElderlyClientService.get_my_profile(current_user)


@router.put("", response_model=ElderlyProfileResponse, summary="Update my profile")
def update_my_profile(
    payload: ElderlyProfileSelfUpdate,
    current_user: dict = Depends(get_current_elderly_user)
):
    """Update personal profile fields: name, phone, date of birth, gender, address."""
    return ElderlyClientService.update_my_profile(current_user, payload)


# ---------------------------------------------------------------------------
# 2. Health Information
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthInfoResponse, summary="Get my health information")
def get_health_info(current_user: dict = Depends(get_current_elderly_user)):
    """Return user-provided health conditions, blood group, allergies, and medical notes."""
    return ElderlyClientService.get_health_info(current_user)


@router.put("/health", response_model=HealthInfoResponse, summary="Update my health information")
def update_health_info(
    payload: HealthInfoUpdate,
    current_user: dict = Depends(get_current_elderly_user)
):
    """
    Update user-provided health information.
    This is self-reported data — not AI-generated and not a medical diagnosis.
    """
    return ElderlyClientService.update_health_info(current_user, payload)


# ---------------------------------------------------------------------------
# 3. Hospital Information
# ---------------------------------------------------------------------------

@router.get("/hospital", response_model=HospitalInfoResponse, summary="Get my hospital information")
def get_hospital_info(current_user: dict = Depends(get_current_elderly_user)):
    return ElderlyClientService.get_hospital_info(current_user)


@router.put("/hospital", response_model=HospitalInfoResponse, summary="Update my hospital information")
def update_hospital_info(
    payload: HospitalInfoUpdate,
    current_user: dict = Depends(get_current_elderly_user)
):
    """Store hospital name, location, department, and contact — no EHR or external integration."""
    return ElderlyClientService.update_hospital_info(current_user, payload)


# ---------------------------------------------------------------------------
# 4. Doctor Information (view assigned doctor only)
# ---------------------------------------------------------------------------

@router.get("/doctor", response_model=DoctorInfoResponse, summary="Get my assigned doctor")
def get_doctor_info(current_user: dict = Depends(get_current_elderly_user)):
    """
    Returns the doctor assigned by the admin. Read-only — elderly users
    cannot assign, change, or remove their own doctor assignment.
    """
    return ElderlyClientService.get_doctor_info(current_user)


# ---------------------------------------------------------------------------
# 5. Medication Information (CRUD)
# ---------------------------------------------------------------------------

@router.get("/medications", response_model=List[MedicationResponse], summary="Get my medications")
def list_medications(current_user: dict = Depends(get_current_elderly_user)):
    return ElderlyClientService.list_medications(current_user)


@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED,
             summary="Add a medication")
def add_medication(
    payload: MedicationCreate,
    current_user: dict = Depends(get_current_elderly_user)
):
    return ElderlyClientService.add_medication(current_user, payload)


@router.put("/medications/{med_id}", response_model=MedicationResponse, summary="Update a medication")
def update_medication(
    med_id: str,
    payload: MedicationUpdate,
    current_user: dict = Depends(get_current_elderly_user)
):
    return ElderlyClientService.update_medication(current_user, med_id, payload)


@router.delete("/medications/{med_id}", response_model=dict, summary="Delete a medication")
def delete_medication(
    med_id: str,
    current_user: dict = Depends(get_current_elderly_user)
):
    return ElderlyClientService.delete_medication(current_user, med_id)


@router.post("/medications/{med_id}/log-dose", summary="Log medication dose and notify caregiver if missed")
def log_medication_dose(
    med_id: str,
    payload: DoseLogRequest,
    current_user: dict = Depends(get_current_elderly_user)
):
    return ElderlyClientService.log_medication_dose(current_user, med_id, payload.model_dump())



# ---------------------------------------------------------------------------
# 6. Emergency Contacts (CRUD, max 2)
# ---------------------------------------------------------------------------

@router.get("/emergency-contacts", response_model=List[EmergencyContactResponse],
            summary="Get my emergency contacts")
def list_emergency_contacts(current_user: dict = Depends(get_current_elderly_user)):
    return ElderlyClientService.list_emergency_contacts(current_user)


@router.post("/emergency-contacts", response_model=EmergencyContactResponse,
             status_code=status.HTTP_201_CREATED, summary="Add an emergency contact")
def add_emergency_contact(
    payload: EmergencyContactCreate,
    current_user: dict = Depends(get_current_elderly_user)
):
    """
    Add a Primary or Secondary emergency contact.
    Hard limit: maximum 2 contacts total.
    """
    return ElderlyClientService.add_emergency_contact(current_user, payload)


@router.put("/emergency-contacts/{contact_id}", response_model=EmergencyContactResponse,
            summary="Update an emergency contact")
def update_emergency_contact(
    contact_id: str,
    payload: EmergencyContactUpdate,
    current_user: dict = Depends(get_current_elderly_user)
):
    return ElderlyClientService.update_emergency_contact(current_user, contact_id, payload)


@router.delete("/emergency-contacts/{contact_id}", response_model=dict,
               summary="Delete an emergency contact")
def delete_emergency_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_elderly_user)
):
    return ElderlyClientService.delete_emergency_contact(current_user, contact_id)


# ---------------------------------------------------------------------------
# 7. Caregiver (view-only)
# ---------------------------------------------------------------------------

@router.get("/caregiver", response_model=CaregiverViewResponse, summary="Get my assigned caregiver")
def get_my_caregiver(current_user: dict = Depends(get_current_elderly_user)):
    """
    Returns the caregiver assigned by the admin.
    Read-only — elderly users cannot assign or change their caregiver.
    If no caregiver is assigned, returns is_assigned=False with a clear empty state.
    """
    return ElderlyClientService.get_my_caregiver(current_user)


# ---------------------------------------------------------------------------
# 8. Daily Wellness Check-In
# ---------------------------------------------------------------------------

@router.get("/checkins/today", summary="Check if today's check-in is already completed")
def get_today_checkin(current_user: dict = Depends(get_current_elderly_user)):
    """
    Returns today's check-in record if it exists, or null if not yet completed.
    Used to show 'Already completed' vs 'Start Check-In' state on the dashboard.
    """
    result = ElderlyClientService.get_today_checkin(current_user)
    return {"completed": result is not None, "checkin": result}


@router.post("/checkins", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED,
             summary="Submit today's wellness check-in")
def submit_checkin(
    payload: CheckInCreate,
    current_user: dict = Depends(get_current_elderly_user)
):
    """
    Submit the daily wellness check-in covering 6 dimensions:
    Medication, Food/Appetite, Sleep, Mobility, Mood, Symptoms.
    Duplicate check-in for the same date is rejected with a friendly message.
    Wellness Risk result is labeled Low/Moderate/High — never a medical diagnosis.
    """
    return ElderlyClientService.submit_checkin(current_user, payload)


# ---------------------------------------------------------------------------
# 9. Wellness History
# ---------------------------------------------------------------------------

@router.get("/wellness-history", summary="Get past wellness check-ins")
def get_wellness_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_elderly_user)
):
    """Return paginated list of past check-ins showing date, all indicators, and wellness risk."""
    return ElderlyClientService.get_wellness_history(current_user, page=page, limit=limit)


# ---------------------------------------------------------------------------
# 11. Notifications (in-app, read-only)
# ---------------------------------------------------------------------------

@router.get("/notifications", response_model=List[NotificationItemResponse],
            summary="Get my in-app notifications")
def get_notifications(current_user: dict = Depends(get_current_elderly_user)):
    """
    Returns admin-sent notifications targeted at 'all' or 'Elderly' role.
    In-app only — no SMS, WhatsApp, or email.
    """
    return ElderlyClientService.get_notifications(current_user)


# ---------------------------------------------------------------------------
# 12. Settings
# ---------------------------------------------------------------------------

@router.put("/settings/notifications", summary="Update notification preferences")
def update_notification_prefs(
    payload: NotificationPrefsUpdate,
    current_user: dict = Depends(get_current_elderly_user)
):
    return ElderlyClientService.update_notification_prefs(current_user, payload)


@router.post("/settings/change-password", summary="Change my password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_elderly_user)
):
    """Change password using the existing auth system — no custom password logic."""
    return ElderlyClientService.change_password(current_user, payload)


@router.post("/setup/complete", summary="Mark first-time setup as complete")
def mark_setup_complete(current_user: dict = Depends(get_current_elderly_user)):
    """Called at the end of the first-time setup wizard to set setup_complete=True."""
    return ElderlyClientService.mark_setup_complete(current_user)
