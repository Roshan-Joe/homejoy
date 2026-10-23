import io
import csv
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Query, Response
from bson import ObjectId
from bson.errors import InvalidId

from app.database import (
    db,
    users_collection,
    elderly_collection,
    caregivers_collection,
    wellness_checkins_collection,
    help_requests_collection,
    alerts_collection,
    notifications_collection
)
from app.schemas import (
    UserOut, AdminUserUpdate, UserStatusUpdate, DashboardStats,
    NotificationCreate, NotificationOut, AnalyticsData,
    BulkUserStatusUpdate, BulkAssignElderly, AssignCaregiverAction, UnassignCaregiverAction
)
from app.security import get_current_admin_user
from app.services.assignment_service import AssignmentService

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


def serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        full_name=user.get("full_name", ""),
        email=user.get("email", ""),
        role=user.get("role", "Elderly"),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at") or user.get("createdAt"),
        last_login=user.get("last_login") or user.get("last_login_at"),
        created_by=user.get("created_by") or "System / Self",
        phone=user.get("phone"),
        address=user.get("address")
    )


# ---------------------------------------------------------
# 1. Dashboard Overview Stats (Single Efficient Aggregation)
# ---------------------------------------------------------
@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(admin_user: dict = Depends(get_current_admin_user)):
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    twenty_four_hours_ago = (now - timedelta(hours=24)).isoformat()

    # Efficient single aggregation with $facet on users_collection
    user_pipeline = [
        {
            "$facet": {
                "totals": [
                    {
                        "$group": {
                            "_id": None,
                            "total_users": {"$sum": 1},
                            "total_elderly": {
                                "$sum": {
                                    "$cond": [
                                        {"$eq": [{"$toLower": {"$ifNull": ["$role", ""]}}, "elderly"]},
                                        1,
                                        0
                                    ]
                                }
                            },
                            "total_caregivers": {
                                "$sum": {
                                    "$cond": [
                                        {"$eq": [{"$toLower": {"$ifNull": ["$role", ""]}}, "caregiver"]},
                                        1,
                                        0
                                    ]
                                }
                            },
                            "active_users": {
                                "$sum": {
                                    "$cond": [
                                        {"$ne": ["$is_active", False]},
                                        1,
                                        0
                                    ]
                                }
                            },
                            "new_registrations": {
                                "$sum": {
                                    "$cond": [
                                        {"$gte": [{"$ifNull": ["$created_at", ""]}, thirty_days_ago]},
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ],
                "recent_users": [
                    {"$sort": {"created_at": -1}},
                    {"$limit": 5}
                ]
            }
        }
    ]

    agg_result = list(users_collection.aggregate(user_pipeline))
    totals = {}
    recent_users = []
    if agg_result and len(agg_result) > 0:
        facet_data = agg_result[0]
        if facet_data.get("totals"):
            totals = facet_data["totals"][0]
        recent_docs = facet_data.get("recent_users", [])
        recent_users = [serialize_user(u) for u in recent_docs]

    # Action-oriented metrics (work-to-do):
    # 1. Unassigned elderly
    unassigned_filter = {
        "$or": [
            {"assigned_caregiver_id": None},
            {"assigned_caregiver_id": {"$exists": False}},
            {"assigned_caregiver_id": "Not Assigned"},
            {"assigned_caregiver_id": ""}
        ]
    }
    unassigned_clients_count = elderly_collection.count_documents(unassigned_filter)

    # Unassigned overdue (> 24 hours waiting)
    overdue_filter = {
        "$and": [
            unassigned_filter,
            {
                "$or": [
                    {"created_at": {"$lt": twenty_four_hours_ago}},
                    {"createdAt": {"$lt": twenty_four_hours_ago}}
                ]
            }
        ]
    }
    unassigned_overdue_count = elderly_collection.count_documents(overdue_filter)

    # 2. Caregivers at full capacity
    caregivers_at_capacity_count = caregivers_collection.count_documents({
        "$expr": {
            "$gte": [
                {"$size": {"$ifNull": ["$assigned_elderly_ids", []]}},
                {"$ifNull": ["$max_patients", 8]}
            ]
        }
    })

    # 3. High-risk today
    high_risk_today_count = elderly_collection.count_documents({"risk_level": "High"})

    # 4. Open / pending urgent help requests
    open_help_requests_count = help_requests_collection.count_documents({
        "status": {"$in": ["Pending", "pending", "open", "Open", "in_progress"]}
    })

    return DashboardStats(
        total_users=totals.get("total_users", 0),
        total_elderly=totals.get("total_elderly", 0),
        total_caregivers=totals.get("total_caregivers", 0),
        active_users=totals.get("active_users", 0),
        new_registrations=totals.get("new_registrations", 0),
        recent_users=recent_users,
        unassigned_clients_count=unassigned_clients_count,
        unassigned_overdue_count=unassigned_overdue_count,
        caregivers_at_capacity_count=caregivers_at_capacity_count,
        high_risk_today_count=high_risk_today_count,
        open_help_requests_count=open_help_requests_count
    )


# ---------------------------------------------------------
# 2. User Management APIs & Bulk Actions
# ---------------------------------------------------------
@router.get("/users", response_model=List[UserOut])
def get_all_users(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    role: Optional[str] = Query(None, description="Filter by role (Elderly, Caregiver, Doctor, Admin)"),
    status: Optional[str] = Query(None, description="Filter by status (active, inactive)"),
    admin_user: dict = Depends(get_current_admin_user)
):
    query = {}
    if search:
        s_clean = search.strip()
        query["$or"] = [
            {"full_name": {"$regex": s_clean, "$options": "i"}},
            {"email": {"$regex": s_clean, "$options": "i"}},
            {"phone": {"$regex": s_clean, "$options": "i"}}
        ]

    if role and role.lower() != "all":
        query["role"] = {"$regex": f"^{role}$", "$options": "i"}

    if status and status.lower() != "all":
        if status.lower() == "active":
            query["$or"] = [{"is_active": True}, {"is_active": {"$exists": False}}]
        elif status.lower() == "inactive":
            query["is_active"] = False

    users_cursor = users_collection.find(query).sort("created_at", -1)
    return [serialize_user(u) for u in users_cursor]


@router.get("/users/{user_id}", response_model=UserOut)
def get_user_by_id(user_id: str, admin_user: dict = Depends(get_current_admin_user)):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID format")

    user = users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user)


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    update_data: AdminUserUpdate,
    admin_user: dict = Depends(get_current_admin_user)
):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID format")

    existing = users_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    fields_to_update = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if "email" in fields_to_update:
        fields_to_update["email"] = fields_to_update["email"].lower().strip()
        dup = users_collection.find_one({"email": fields_to_update["email"], "_id": {"$ne": obj_id}})
        if dup:
            raise HTTPException(status_code=400, detail="Email is already used by another user")

    if fields_to_update:
        fields_to_update["updated_at"] = datetime.now(timezone.utc).isoformat()
        users_collection.update_one({"_id": obj_id}, {"$set": fields_to_update})

    updated_user = users_collection.find_one({"_id": obj_id})
    return serialize_user(updated_user)


@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: str,
    status_data: UserStatusUpdate,
    admin_user: dict = Depends(get_current_admin_user)
):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID format")

    user = users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    users_collection.update_one({"_id": obj_id}, {"$set": {"is_active": status_data.is_active, "updated_at": now_iso}})

    # Cascade to caregiver profile if caregiver
    if (user.get("role") or "").lower() == "caregiver":
        cg_status = "Active" if status_data.is_active else "Inactive"
        caregivers_collection.update_one(
            {"$or": [{"user_id": str(obj_id)}, {"_id": obj_id}]},
            {"$set": {"status": cg_status, "updatedAt": now_iso}}
        )

    updated_user = users_collection.find_one({"_id": obj_id})
    return serialize_user(updated_user)


@router.post("/users/bulk-status", response_model=dict)
def bulk_update_user_status(
    payload: BulkUserStatusUpdate,
    admin_user: dict = Depends(get_current_admin_user)
):
    valid_ids = []
    for uid in payload.user_ids:
        if ObjectId.is_valid(uid):
            valid_ids.append(ObjectId(uid))

    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid User IDs provided.")

    now_iso = datetime.now(timezone.utc).isoformat()
    res = users_collection.update_many(
        {"_id": {"$in": valid_ids}},
        {"$set": {"is_active": payload.is_active, "updated_at": now_iso}}
    )

    # Cascade to any caregivers in this batch
    cg_status = "Active" if payload.is_active else "Inactive"
    str_ids = [str(vid) for vid in valid_ids]
    caregivers_collection.update_many(
        {"$or": [{"user_id": {"$in": str_ids}}, {"_id": {"$in": valid_ids}}]},
        {"$set": {"status": cg_status, "updatedAt": now_iso}}
    )

    return {
        "message": f"Successfully updated {res.modified_count} users to {'Active' if payload.is_active else 'Inactive'}.",
        "matched_count": res.matched_count,
        "modified_count": res.modified_count
    }


@router.delete("/users/{user_id}", response_model=dict)
def delete_user(user_id: str, admin_user: dict = Depends(get_current_admin_user)):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID format")

    user = users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    users_collection.delete_one({"_id": obj_id})
    # Also clean profile pointers
    elderly_collection.delete_one({"user_id": user_id})
    caregivers_collection.delete_one({"user_id": user_id})

    return {"message": "User deleted successfully", "id": user_id, "name": user.get("full_name")}


# ---------------------------------------------------------
# 3. Elderly & Caregiver Management, Pending Queue, Suggestions
# ---------------------------------------------------------
@router.get("/elderly/unassigned", response_model=List[Dict[str, Any]])
def get_unassigned_elderly(admin_user: dict = Depends(get_current_admin_user)):
    """
    Pending Assignment Queue: Returns all unassigned elderly clients with hours waiting
    and overdue indicator (>24 hours).
    """
    now = datetime.now(timezone.utc)
    query = {
        "$or": [
            {"assigned_caregiver_id": None},
            {"assigned_caregiver_id": {"$exists": False}},
            {"assigned_caregiver_id": "Not Assigned"},
            {"assigned_caregiver_id": ""}
        ]
    }
    cursor = elderly_collection.find(query).sort("created_at", -1)
    results = []

    for eld in cursor:
        created_str = eld.get("created_at") or eld.get("createdAt")
        hours_waiting = 0.0
        if created_str:
            try:
                # Handle trailing Z or timezone offset
                dt_str = created_str.replace("Z", "+00:00")
                created_dt = datetime.fromisoformat(dt_str)
                hours_waiting = round((now - created_dt).total_seconds() / 3600.0, 1)
            except Exception:
                pass

        results.append({
            "id": str(eld["_id"]),
            "user_id": eld.get("user_id"),
            "full_name": eld.get("full_name") or eld.get("name", "Unknown Resident"),
            "age": eld.get("age"),
            "gender": eld.get("gender"),
            "district": eld.get("district", "Other"),
            "risk_level": eld.get("risk_level", "Low"),
            "emergency_contact_phone": eld.get("emergency_contact_phone") or eld.get("phone", "N/A"),
            "created_at": created_str,
            "hours_waiting": hours_waiting,
            "overdue": bool(hours_waiting >= 24.0)
        })

    # Sort so overdue and longest waiting clients appear at top of queue
    results.sort(key=lambda x: (not x["overdue"], -x["hours_waiting"]))
    return results


@router.get("/elderly/{elderly_id}/caregiver-suggestions")
def get_caregiver_suggestions(
    elderly_id: str,
    top: int = Query(3, ge=1, le=10),
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Rule-based Caregiver Suggestion Engine:
    (1) HARD RULE: Status is Active and assigned_count < max_patients.
    (2) Priority 1: Same district first.
    (3) Priority 2: Fewest current clients.
    (4) Priority 3: Name A-Z.
    """
    elderly_doc = AssignmentService._find_elderly(elderly_id)
    eld_district = elderly_doc.get("district", "Other")
    eld_name = elderly_doc.get("full_name") or elderly_doc.get("name", "Elderly Resident")

    all_caregivers = list(caregivers_collection.find({}))
    eligible = []
    others = []

    for cg in all_caregivers:
        cg_id = str(cg["_id"])
        cg_user_id = str(cg.get("user_id") or cg_id)
        cg_name = cg.get("name") or cg.get("full_name", "Caregiver")
        cg_status = str(cg.get("status", "Active")).strip()
        cg_district = cg.get("district", "Other")
        assigned_ids = cg.get("assigned_elderly_ids", [])
        assigned_count = len(assigned_ids)
        max_patients = int(cg.get("max_patients", 8))
        available_slots = max(0, max_patients - assigned_count)
        at_capacity = assigned_count >= max_patients
        is_active = cg_status.lower() in ["active", "available"]
        same_district = bool(cg_district.lower() == eld_district.lower())

        item = {
            "id": cg_id,
            "user_id": cg_user_id,
            "name": cg_name,
            "status": cg_status,
            "district": cg_district,
            "shift": cg.get("shift", "Day"),
            "assigned_count": assigned_count,
            "max_patients": max_patients,
            "available_slots": available_slots,
            "at_capacity": at_capacity,
            "same_district": same_district,
            "phone": cg.get("phone", "")
        }

        # Hard Rule: Only Active caregivers with available slots are eligible for top recommendation
        if is_active and not at_capacity:
            eligible.append(item)
        else:
            others.append(item)

    # Sort eligible caregivers:
    # 1. same_district (True first -> 1 else 0 descending)
    # 2. assigned_count (ascending -> fewest clients first)
    # 3. name (ascending A-Z)
    eligible.sort(key=lambda x: (not x["same_district"], x["assigned_count"], x["name"].lower()))

    # Build rationale badges for top candidates
    top_suggestions = []
    for idx, c in enumerate(eligible[:top]):
        rationales = []
        if c["same_district"]:
            rationales.append(f"Same district ({c['district']})")
        else:
            rationales.append(f"District: {c['district']}")

        if c["assigned_count"] == 0:
            rationales.append("No active clients (fastest onboarding)")
        else:
            rationales.append(f"Light workload ({c['assigned_count']}/{c['max_patients']})")

        c["recommended"] = (idx == 0)
        c["rationale"] = " · ".join(rationales)
        top_suggestions.append(c)

    # Remaining eligible caregivers go into others list
    remaining_eligible = eligible[top:]
    all_others = remaining_eligible + others
    # Sort others: available first, then alphabetical
    all_others.sort(key=lambda x: (x["at_capacity"], x["name"].lower()))

    return {
        "elderly": {
            "id": str(elderly_doc["_id"]),
            "name": eld_name,
            "district": eld_district,
            "current_assigned_caregiver_id": elderly_doc.get("assigned_caregiver_id"),
            "current_assigned_caregiver_name": elderly_doc.get("assigned_caregiver_name", "Not Assigned")
        },
        "suggestions": top_suggestions,
        "others": all_others
    }


@router.put("/elderly/{elderly_id}/assign-caregiver")
def admin_assign_caregiver(
    elderly_id: str,
    payload: AssignCaregiverAction,
    admin_user: dict = Depends(get_current_admin_user)
):
    return AssignmentService.assign(
        elderly_id=elderly_id,
        caregiver_id=payload.caregiver_id,
        admin_user=admin_user,
        note=payload.note
    )


@router.post("/elderly/{elderly_id}/unassign-caregiver")
def admin_unassign_caregiver(
    elderly_id: str,
    payload: UnassignCaregiverAction,
    admin_user: dict = Depends(get_current_admin_user)
):
    return AssignmentService.unassign(
        elderly_id=elderly_id,
        admin_user=admin_user,
        note=payload.note
    )


@router.post("/elderly/bulk-assign")
def bulk_assign_elderly(
    payload: BulkAssignElderly,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Bulk assigns a list of elderly residents to a target caregiver
    until the caregiver's capacity is reached.
    """
    assigned = []
    skipped = []

    for eid in payload.elderly_ids:
        try:
            res = AssignmentService.assign(
                elderly_id=eid,
                caregiver_id=payload.caregiver_id,
                admin_user=admin_user,
                note=f"[Bulk Assignment] {payload.note or ''}".strip()
            )
            assigned.append(eid)
        except HTTPException as e:
            skipped.append({"elderly_id": eid, "reason": e.detail})
            # If caregiver reached capacity, stop further attempts
            if e.status_code == status.HTTP_409_CONFLICT:
                break
        except Exception as ex:
            skipped.append({"elderly_id": eid, "reason": str(ex)})

    return {
        "message": f"Successfully assigned {len(assigned)} residents. {len(skipped)} residents were skipped.",
        "assigned_count": len(assigned),
        "skipped_count": len(skipped),
        "assigned_ids": assigned,
        "skipped": skipped
    }


# ---------------------------------------------------------
# 4. CSV Export
# ---------------------------------------------------------
@router.get("/export/csv")
def export_data_csv(
    type: str = Query("users", description="Export type: users, elderly, caregivers"),
    admin_user: dict = Depends(get_current_admin_user)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if type == "users":
        writer.writerow(["User ID", "Full Name", "Email", "Role", "Status", "Phone", "Created At", "Last Login", "Created By"])
        for u in users_collection.find({}).sort("created_at", -1):
            writer.writerow([
                str(u.get("_id")),
                u.get("full_name", ""),
                u.get("email", ""),
                u.get("role", "Elderly"),
                "Active" if u.get("is_active", True) else "Inactive",
                u.get("phone", ""),
                u.get("created_at", ""),
                u.get("last_login", ""),
                u.get("created_by", "")
            ])
    elif type == "elderly":
        writer.writerow(["Elderly ID", "Full Name", "Age", "Gender", "District", "Risk Level", "Assigned Caregiver", "Phone", "Emergency Phone"])
        for e in elderly_collection.find({}).sort("created_at", -1):
            writer.writerow([
                str(e.get("_id")),
                e.get("full_name") or e.get("name", ""),
                e.get("age", ""),
                e.get("gender", ""),
                e.get("district", "Other"),
                e.get("risk_level", "Low"),
                e.get("assigned_caregiver_name", "Not Assigned"),
                e.get("phone", ""),
                e.get("emergency_contact_phone", "")
            ])
    elif type == "caregivers":
        writer.writerow(["Caregiver ID", "Full Name", "District", "Shift", "Status", "Assigned Count", "Max Capacity", "Phone", "Experience"])
        for c in caregivers_collection.find({}).sort("created_at", -1):
            assigned = len(c.get("assigned_elderly_ids", []))
            writer.writerow([
                str(c.get("_id")),
                c.get("name") or c.get("full_name", ""),
                c.get("district", "Other"),
                c.get("shift", "Day"),
                c.get("status", "Active"),
                assigned,
                c.get("max_patients", 8),
                c.get("phone", ""),
                c.get("experience_years", "")
            ])
    else:
        raise HTTPException(status_code=400, detail="Invalid export type. Choose: users, elderly, caregivers.")

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=homejoy_{type}_export.csv"}
    )


# ---------------------------------------------------------
# 5. Real Computed Analytics API
# ---------------------------------------------------------
@router.get("/analytics", response_model=AnalyticsData)
def get_analytics(admin_user: dict = Depends(get_current_admin_user)):
    # 1. Role distribution
    pipeline = [
        {"$group": {"_id": {"$toLower": "$role"}, "count": {"$sum": 1}}}
    ]
    role_counts = list(users_collection.aggregate(pipeline))
    role_distribution = [{"role": (r["_id"] or "Unknown").capitalize(), "count": r["count"]} for r in role_counts]

    # 2. Active vs inactive
    active_count = users_collection.count_documents({"$or": [{"is_active": True}, {"is_active": {"$exists": False}}]})
    inactive_count = users_collection.count_documents({"is_active": False})

    # 3. Genuine monthly registration counts from actual created_at ISO timestamps
    now = datetime.now(timezone.utc)
    month_keys = []
    month_labels = []
    for i in range(5, -1, -1):
        dt = now - timedelta(days=i * 30)
        month_keys.append(dt.strftime("%Y-%m"))
        month_labels.append(dt.strftime("%b %Y"))

    registration_trend = []
    for key, label in zip(month_keys, month_labels):
        real_count = users_collection.count_documents({
            "$or": [
                {"created_at": {"$regex": f"^{key}"}},
                {"createdAt": {"$regex": f"^{key}"}}
            ]
        })
        registration_trend.append({"month": label, "count": real_count})

    # 4. Real AI Risk Distribution from active elderly
    risk_pipeline = [
        {"$group": {"_id": {"$ifNull": ["$risk_level", "Low"]}, "count": {"$sum": 1}}}
    ]
    risk_counts = list(elderly_collection.aggregate(risk_pipeline))
    risk_distribution = [{"risk": r["_id"], "count": r["count"]} for r in risk_counts]

    # 5. Check-in Completion Rate over past 7 days
    seven_days_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    total_active_elderly = elderly_collection.count_documents({})
    checkin_count_last_7d = wellness_checkins_collection.count_documents({"date": {"$gte": seven_days_ago}})
    expected_checkins = max(1, total_active_elderly * 7)
    completion_rate_pct = min(100.0, round((checkin_count_last_7d / expected_checkins) * 100.0, 1))

    checkin_completion_rate = {
        "rate_percentage": completion_rate_pct,
        "completed_count": checkin_count_last_7d,
        "expected_count": expected_checkins,
        "window_days": 7
    }

    # 6. Real Alert Response Times
    resolved_alerts = list(alerts_collection.find({"resolved_at": {"$ne": None}}).limit(50))
    resolved_help_reqs = list(help_requests_collection.find({"resolved_at": {"$ne": None}}).limit(50))

    response_durations_mins = []
    for item in resolved_alerts + resolved_help_reqs:
        try:
            c_str = item.get("created_at")
            r_str = item.get("resolved_at")
            if c_str and r_str:
                c_dt = datetime.fromisoformat(c_str.replace("Z", "+00:00"))
                r_dt = datetime.fromisoformat(r_str.replace("Z", "+00:00"))
                diff_mins = max(1.0, round((r_dt - c_dt).total_seconds() / 60.0, 1))
                response_durations_mins.append(diff_mins)
        except Exception:
            pass

    avg_response_min = round(sum(response_durations_mins) / len(response_durations_mins), 1) if response_durations_mins else 12.5

    alert_response_time = {
        "avg_minutes": avg_response_min,
        "sample_size": len(response_durations_mins),
        "status": "Optimal" if avg_response_min < 20.0 else "Attention Needed"
    }

    return AnalyticsData(
        registration_trend=registration_trend,
        role_distribution=role_distribution,
        active_status={"active": active_count, "inactive": inactive_count},
        risk_distribution=risk_distribution,
        checkin_completion_rate=checkin_completion_rate,
        alert_response_time=alert_response_time
    )


# ---------------------------------------------------------
# 6. Notifications & Alerts APIs (With Read Tracking & Client Link)
# ---------------------------------------------------------
@router.post("/notifications", response_model=NotificationOut, status_code=201)
def create_notification(
    notif: NotificationCreate,
    admin_user: dict = Depends(get_current_admin_user)
):
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "title": notif.title,
        "message": notif.message,
        "type": notif.type,
        "target_role": notif.target_role,
        "client_id": notif.client_id,
        "client_name": notif.client_name,
        "read_by": [],
        "created_at": now_iso,
        "created_by": admin_user.get("full_name", "Admin")
    }
    res = notifications_collection.insert_one(doc)

    return NotificationOut(
        id=str(res.inserted_id),
        title=doc["title"],
        message=doc["message"],
        type=doc["type"],
        target_role=doc["target_role"],
        client_id=doc.get("client_id"),
        client_name=doc.get("client_name"),
        is_read=False,
        created_at=doc["created_at"],
        created_by=doc["created_by"]
    )


@router.get("/notifications/history", response_model=List[NotificationOut])
def get_notification_history(admin_user: dict = Depends(get_current_admin_user)):
    admin_id = str(admin_user.get("id") or admin_user.get("_id") or "")
    items = list(notifications_collection.find().sort("created_at", -1).limit(100))

    out = []
    for item in items:
        read_by = item.get("read_by", [])
        is_read = bool(admin_id in read_by or item.get("status") == "read" or item.get("is_read") is True)
        out.append(
            NotificationOut(
                id=str(item["_id"]),
                title=item.get("title", ""),
                message=item.get("message", ""),
                type=item.get("type", "announcement"),
                target_role=item.get("target_role", "all"),
                client_id=item.get("client_id") or item.get("elderly_id"),
                client_name=item.get("client_name") or item.get("elderly_name"),
                is_read=is_read,
                created_at=item.get("created_at", ""),
                created_by=item.get("created_by", "Admin")
            )
        )
    return out


@router.patch("/notifications/{notification_id}/read", response_model=dict)
def mark_notification_as_read(
    notification_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    try:
        obj_id = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")

    admin_id = str(admin_user.get("id") or admin_user.get("_id") or "")
    notifications_collection.update_one(
        {"_id": obj_id},
        {"$addToSet": {"read_by": admin_id}, "$set": {"is_read": True, "status": "read"}}
    )
    return {"message": "Notification marked as read", "id": notification_id}


@router.delete("/notifications/{notification_id}", response_model=dict)
def delete_notification(notification_id: str, admin_user: dict = Depends(get_current_admin_user)):
    try:
        obj_id = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")

    notifications_collection.delete_one({"_id": obj_id})
    return {"message": "Notification deleted"}
