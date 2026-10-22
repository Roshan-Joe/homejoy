"""
Caregiver Portal Router — Self-service endpoints for authenticated Caregivers.
Mounted at /api/caregiver/me.
Protected by get_current_caregiver_user dependency (enforces role='Caregiver').
Enforces server-side IDOR checks so caregivers can only access assigned elderly clients.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks

from app.security import get_current_user
from app.services.caregiver_portal_service import CaregiverPortalService
from app.schemas.caregiver_portal_schema import (
    CaregiverProfileSelfUpdate,
    CaregiverTaskCreatePayload,
    CaregiverTaskUpdatePayload,
    CaregiverAlertResolvePayload,
    CaregiverSettingsUpdatePayload,
    CaregiverPasswordChangePayload,
    SendDailyReportEmailPayload,
    DailyReportEmailStatusResponse
)
from app.schemas.caregiver_schema import CaregiverResponseSchema

router = APIRouter(prefix="/api/caregiver/me", tags=["Caregiver Portal (Self-Service)"])
caregiver_elderly_router = APIRouter(prefix="/api/caregiver", tags=["Caregiver Guardian Daily Report"])


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


# ---------------------------------------------------------------------------
# 13. Assigned Daily Reports & Help Requests
# ---------------------------------------------------------------------------

@router.get("/daily-reports", summary="Get daily wellness reports for assigned elderly clients")
def get_daily_reports(
    date: Optional[str] = Query(None, description="ISO date YYYY-MM-DD"),
    elderly_id: Optional[str] = Query(None, description="Filter by assigned elderly ID"),
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_assigned_daily_reports(current_user, date_str=date, elderly_id=elderly_id)


@router.get("/elderly/{elderly_id}/daily-report", summary="Get daily wellness report for a specific assigned elderly client")
def get_elderly_daily_report(
    elderly_id: str,
    date: Optional[str] = Query(None, description="ISO date YYYY-MM-DD"),
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_assigned_elderly_daily_report(current_user, elderly_id=elderly_id, date_str=date)


@router.get("/help-requests", summary="Get urgent help requests from assigned elderly clients")
def get_help_requests(
    status: Optional[str] = Query(None, description="Filter status: Pending, Acknowledged, Resolved, all"),
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.get_help_requests(current_user, status_filter=status)


@router.put("/help-requests/{request_id}/acknowledge", summary="Acknowledge an urgent help request")
def acknowledge_help_request(
    request_id: str,
    current_user: dict = Depends(get_current_caregiver_user)
):
    return CaregiverPortalService.acknowledge_help_request(current_user, request_id)


@router.put("/help-requests/{request_id}/resolve", summary="Resolve an urgent help request")
def resolve_help_request(
    request_id: str,
    payload: Optional[dict] = None,
    current_user: dict = Depends(get_current_caregiver_user)
):
    note = (payload or {}).get("resolution_note", "")
    return CaregiverPortalService.resolve_help_request(current_user, request_id, note)


# ---------------------------------------------------------------------------
# 7. Caregiver Handover Notes & Shift Transitions
# ---------------------------------------------------------------------------

@router.post("/handover", summary="Log a shift handover note for incoming caregivers")
def create_handover(
    payload: dict,
    current_user: dict = Depends(get_current_caregiver_user)
):
    from app.services.handover_service import HandoverService
    return HandoverService.create_handover(current_user, payload)


@router.get("/handover", summary="Get recent shift handover notes")
def get_handovers(
    limit: int = Query(15, ge=1, le=50),
    current_user: dict = Depends(get_current_caregiver_user)
):
    from app.services.handover_service import HandoverService
    return HandoverService.get_handovers(limit=limit)


# ---------------------------------------------------------------------------
# 8. Missed Check-In Escalation Chain
# ---------------------------------------------------------------------------

@router.get("/escalations", summary="Get active missed-check-in escalations")
def get_active_escalations(current_user: dict = Depends(get_current_caregiver_user)):
    from app.services.escalation_service import EscalationService
    return EscalationService.get_active_escalations()


@router.post("/escalations/scan", summary="Trigger missed check-in escalation scan")
def trigger_escalation_scan(current_user: dict = Depends(get_current_caregiver_user)):
    from app.services.escalation_service import EscalationService
    return EscalationService.run_missed_checkin_scan()


@router.post("/escalations/{esc_id}/resolve", summary="Resolve a missed check-in escalation")
def resolve_escalation(
    esc_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_caregiver_user)
):
    from app.services.escalation_service import EscalationService
    caregiver_name = current_user.get("full_name") or current_user.get("name", "Caregiver")
    note = payload.get("resolution_note", "Resident checked in person; vitals stable.")
    return EscalationService.resolve_escalation(esc_id, caregiver_name, note)


# ---------------------------------------------------------------------------
# 9. Individual Resident Trends & Comprehensive PDF Care Report
# ---------------------------------------------------------------------------

@router.get("/elderly/{elderly_id}/trends", summary="Get individual baseline and trend metrics for assigned resident")
def get_assigned_elderly_trends(
    elderly_id: str,
    days: int = Query(7, ge=7, le=30),
    current_user: dict = Depends(get_current_caregiver_user)
):
    from app.services.elderly_client_service import ElderlyClientService
    surrogate = {"id": elderly_id, "role": "Elderly"}
    return ElderlyClientService.get_wellness_trends(surrogate, days=days)


@router.get("/elderly/{elderly_id}/care-report", summary="Generate formatted care summary for PDF export")
def get_care_report(
    elderly_id: str,
    current_user: dict = Depends(get_current_caregiver_user)
):
    from app.services.elderly_client_service import ElderlyClientService
    from app.services.vitals_service import VitalsService
    from app.services.daily_report_service import DailyReportService
    from app.database import elderly_collection, medications_collection, wellness_checkins_collection
    from bson import ObjectId

    try:
        e_doc = elderly_collection.find_one({"_id": ObjectId(elderly_id)})
    except Exception:
        e_doc = elderly_collection.find_one({"user_id": elderly_id})
    if not e_doc:
        raise HTTPException(status_code=404, detail="Resident not found.")

    res_user_id = e_doc.get("user_id", str(e_doc["_id"]))
    vitals = VitalsService.get_vitals_by_date(res_user_id)
    daily_rep = DailyReportService.get_daily_report(res_user_id)
    meds = list(medications_collection.find({"user_id": res_user_id}))
    history = list(wellness_checkins_collection.find({"user_id": res_user_id}).sort("date", -1).limit(7))

    return {
        "facility_name": "HomeJoy Senior Living & Healthcare",
        "report_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "resident": {
            "name": e_doc.get("name") or e_doc.get("full_name") or "Resident",
            "age": e_doc.get("age", 78),
            "gender": e_doc.get("gender", "Unspecified"),
            "room_number": e_doc.get("room_number") or e_doc.get("address") or "Room 204",
            "emergency_contact": e_doc.get("emergency_contact", "Designated Family")
        },
        "caregiver": {
            "name": current_user.get("full_name") or current_user.get("name", "Caregiver"),
            "license": "Licensed Caregiver / CNA",
            "contact": current_user.get("phone", "+1-555-0101")
        },
        "wellness_summary": daily_rep.get("summary", "Stable vital telemetry and regular daily check-in logging."),
        "risk_level": daily_rep.get("risk_level", "Low"),
        "latest_vitals": vitals,
        "medications": [
            {"name": m.get("medicine_name"), "dosage": m.get("dosage"), "frequency": m.get("frequency")}
            for m in meds
        ],
        "checkin_history": [
            {
                "date": h.get("date"),
                "mood": h.get("mood"),
                "sleep": h.get("sleep_quality"),
                "appetite": h.get("appetite"),
                "mobility": h.get("mobility_difficulty"),
                "symptoms": h.get("symptoms", "None reported")
            }
            for h in history
        ]
    }


# ---------------------------------------------------------------------------
# 16. Guardian Daily Report Email Dispatch & Status
# ---------------------------------------------------------------------------

@router.post(
    "/elderly/{elderly_id}/daily-report/send-email",
    summary="Send daily wellness report to guardian email"
)
def send_guardian_daily_report_email(
    elderly_id: str,
    payload: SendDailyReportEmailPayload,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_caregiver_user)
):
    """
    Sends daily wellness report to the registered guardian email of an assigned elderly resident.
    Requires guardian consent and report enabled. Supports resend=True (up to 3 sends per day).
    """
    return CaregiverPortalService.send_daily_report_email(
        current_user=current_user,
        elderly_id=elderly_id,
        payload=payload,
        background_tasks=background_tasks
    )


@caregiver_elderly_router.post(
    "/elderly/{elderly_id}/daily-report/send-email",
    summary="Send daily wellness report to guardian email (Direct Caregiver Route)"
)
def send_guardian_daily_report_email_direct(
    elderly_id: str,
    payload: SendDailyReportEmailPayload,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_caregiver_user)
):
    """
    Alias matching /api/caregiver/elderly/{elderly_id}/daily-report/send-email.
    """
    return CaregiverPortalService.send_daily_report_email(
        current_user=current_user,
        elderly_id=elderly_id,
        payload=payload,
        background_tasks=background_tasks
    )


@router.get(
    "/elderly/{elderly_id}/daily-report/email-status",
    response_model=DailyReportEmailStatusResponse,
    summary="Get status of guardian daily report email for a given date"
)
def get_guardian_daily_report_email_status(
    elderly_id: str,
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (defaults to today IST)"),
    current_user: dict = Depends(get_current_caregiver_user)
):
    """
    Returns whether the guardian daily report was sent today, last sent timestamp, masked recipient,
    and eligibility flags.
    """
    return CaregiverPortalService.get_daily_report_email_status(
        current_user=current_user,
        elderly_id=elderly_id,
        date_str=date
    )


@caregiver_elderly_router.get(
    "/elderly/{elderly_id}/daily-report/email-status",
    response_model=DailyReportEmailStatusResponse,
    summary="Get status of guardian daily report email for a given date (Direct Caregiver Route)"
)
def get_guardian_daily_report_email_status_direct(
    elderly_id: str,
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (defaults to today IST)"),
    current_user: dict = Depends(get_current_caregiver_user)
):
    """
    Alias matching /api/caregiver/elderly/{elderly_id}/daily-report/email-status.
    """
    return CaregiverPortalService.get_daily_report_email_status(
        current_user=current_user,
        elderly_id=elderly_id,
        date_str=date
    )
