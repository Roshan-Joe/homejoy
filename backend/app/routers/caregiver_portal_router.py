"""
Caregiver Portal Router — Self-service endpoints for authenticated Caregivers.
Mounted at /api/caregiver/me.
Protected by get_current_caregiver_user dependency (enforces role='Caregiver').
Enforces server-side IDOR checks so caregivers can only access assigned elderly clients.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.security import get_current_user
from app.services.caregiver_portal_service import CaregiverPortalService
from app.schemas.caregiver_portal_schema import (
    CaregiverProfileSelfUpdate,
    CaregiverTaskCreatePayload,
    CaregiverTaskUpdatePayload,
    CaregiverAlertResolvePayload,
    CaregiverSettingsUpdatePayload,
    CaregiverPasswordChangePayload
)
from app.schemas.caregiver_schema import CaregiverResponseSchema

router = APIRouter(prefix="/api/caregiver/me", tags=["Caregiver Portal (Self-Service)"])


def get_current_caregiver_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency ensuring calling user has role 'Caregiver'.
    """
    role = str(current_user.get("role", "")).strip().lower()
    if role != "caregiver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Caregiver accounts only."
        )
    return current_user


# ---------------------------------------------------------------------------
# 1. Caregiver Profile
# ---------------------------------------------------------------------------

@router.get("", summary="Get my caregiver profile")
def get_my_profile(current_user: dict = Depends(get_current_caregiver_user)):
    return CaregiverPortalService.get_my_profile(current_user)


@router.put("/profile", summary="Update my caregiver profile")
def update_my_profile(
    payload: CaregiverProfileSelfUpdate,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.update_my_profile(current_user, payload)


# ---------------------------------------------------------------------------
# 2. Caregiver Dashboard Summary
# ---------------------------------------------------------------------------

@router.get("/dashboard", summary="Get caregiver dashboard metrics and priority sections")
def get_dashboard_summary(current_user: dict = Depends(get_current_caregiver_user)):
    return CaregiverPortalService.get_dashboard(current_user)


# ---------------------------------------------------------------------------
# 3. Assigned Elderly List & Filter
# ---------------------------------------------------------------------------

@router.get("/elderly", summary="List assigned elderly clients with search & risk filters")
def get_assigned_elderly(
    search: Optional[str] = Query(None, description="Search by elderly client name or phone"),
    risk: Optional[str] = Query(None, description="Filter by risk level (Low, Moderate, High)"),
    checkin: Optional[str] = Query(None, description="Filter by checkin status (checked_in, missed)"),
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_assigned_elderly_list(
        current_user, search=search, risk_filter=risk, checkin_filter=checkin
    )


# ---------------------------------------------------------------------------
# 4. Elderly Client Details & Explainable AI Risk Indicator
# ---------------------------------------------------------------------------

@router.get("/elderly/{elderly_id}", summary="Get read-only details & Explainable AI risk for assigned elderly client")
def get_elderly_details(
    elderly_id: str,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_elderly_details(current_user, elderly_id)


# ---------------------------------------------------------------------------
# 5. Wellness History & Trends
# ---------------------------------------------------------------------------

@router.get("/elderly/{elderly_id}/history", summary="Get wellness check-in history for assigned elderly client")
def get_elderly_wellness_history(
    elderly_id: str,
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_elderly_wellness_history(
        current_user, elderly_id, date_from=date_from, date_to=date_to, page=page, limit=limit
    )


# ---------------------------------------------------------------------------
# 6. Read-Only Medication Monitoring
# ---------------------------------------------------------------------------

@router.get("/elderly/{elderly_id}/medications", summary="Get read-only medications for assigned elderly client")
def get_elderly_medications(
    elderly_id: str,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_elderly_medications(current_user, elderly_id)


# ---------------------------------------------------------------------------
# 7. Send Check-In Reminder
# ---------------------------------------------------------------------------

@router.post("/elderly/{elderly_id}/remind-checkin", summary="Send daily check-in reminder to assigned elderly client")
def send_checkin_reminder(
    elderly_id: str,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.send_checkin_reminder(current_user, elderly_id)


# ---------------------------------------------------------------------------
# 8. Caregiver Alerts Management
# ---------------------------------------------------------------------------

@router.get("/alerts", summary="Get caregiver alerts (high risk, moderate risk, missed check-in)")
def get_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity (High, Moderate, Info)"),
    status: Optional[str] = Query(None, description="Filter by status (New, Acknowledged, Resolved)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_alerts(
        current_user, severity=severity, status_filter=status, page=page, limit=limit
    )


@router.put("/alerts/{alert_id}/acknowledge", summary="Acknowledge alert")
def acknowledge_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.acknowledge_alert(current_user, alert_id)


@router.put("/alerts/{alert_id}/resolve", summary="Resolve alert with optional note")
def resolve_alert(
    alert_id: str,
    payload: CaregiverAlertResolvePayload,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.resolve_alert(current_user, alert_id, note=payload.resolution_note or "")


# ---------------------------------------------------------------------------
# 9. Caregiver Tasks
# ---------------------------------------------------------------------------

@router.get("/tasks", summary="List caregiver tasks")
def get_tasks(
    elderly_id: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_tasks(
        current_user, elderly_id=elderly_id, priority=priority, status_filter=status
    )


@router.post("/tasks", summary="Create new task for assigned elderly client", status_code=status.HTTP_201_CREATED)
def create_task(
    payload: CaregiverTaskCreatePayload,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.create_task(current_user, payload)


@router.put("/tasks/{task_id}", summary="Update task status, priority or details")
def update_task(
    task_id: str,
    payload: CaregiverTaskUpdatePayload,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.update_task(current_user, task_id, payload)


# ---------------------------------------------------------------------------
# 10. Notifications
# ---------------------------------------------------------------------------

@router.get("/notifications", summary="Get caregiver notifications")
def get_notifications(current_user: dict = Depends(get_current_caregiver_user)):
    return CaregiverPortalService.get_notifications(current_user)


# ---------------------------------------------------------------------------
# 11. Care Summary Reports
# ---------------------------------------------------------------------------

@router.get("/reports", summary="Generate care summary report for an assigned elderly client")
def generate_report(
    elderly_id: str = Query(..., description="Assigned elderly client ID"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.generate_care_report(
        current_user, elderly_id=elderly_id, start_date=start_date, end_date=end_date
    )


# ---------------------------------------------------------------------------
# 12. Caregiver Settings & Password Change
# ---------------------------------------------------------------------------

@router.put("/settings/password", summary="Change caregiver password")
def change_password(
    payload: CaregiverPasswordChangePayload,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.change_password(current_user, payload)


@router.put("/settings/notifications", summary="Update caregiver notification preferences")
def update_notification_prefs(
    payload: CaregiverSettingsUpdatePayload,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.update_notification_prefs(current_user, payload)
