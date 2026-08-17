import math
from datetime import datetime, date, timezone, timedelta
from typing import Dict, Any, Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import (
    caregivers_collection,
    users_collection,
    elderly_collection,
    medications_collection,
    emergency_contacts_collection,
    wellness_checkins_collection,
    notifications_collection,
    alerts_collection,
    caregiver_tasks_collection,
    doctors_collection,
    daily_reports_collection
)
from app.models.caregiver_model import serialize_caregiver_doc
from app.schemas.caregiver_portal_schema import (
    CaregiverProfileSelfUpdate,
    CaregiverTaskCreatePayload,
    CaregiverTaskUpdatePayload,
    CaregiverSettingsUpdatePayload,
    CaregiverPasswordChangePayload
)
from app.security import verify_password, get_password_hash


def _compute_age(dob_str: Optional[str]) -> Optional[int]:
    if not dob_str:
        return None
    try:
        dob = date.fromisoformat(dob_str)
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except (ValueError, AttributeError):
        return None


class CaregiverPortalService:

    @staticmethod
    def _get_caregiver_context(current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Loads caregiver profile document using user_id or email.
        If profile doesn't exist yet, auto-seeds a shell profile in caregiver_profiles.
        """
        user_id = str(current_user.get("id") or current_user.get("_id"))
        email = (current_user.get("email") or "").lower().strip()

        profile = caregivers_collection.find_one({"user_id": user_id})
        if not profile and email:
            profile = caregivers_collection.find_one({"email": email})

        if not profile:
            # Auto-create profile shell for caregiver user
            now_iso = datetime.now(timezone.utc).isoformat()
            profile = {
                "user_id": user_id,
                "name": current_user.get("full_name") or current_user.get("name", "Caregiver Staff"),
                "email": email,
                "phone": current_user.get("phone", ""),
                "qualification": "Certified Nursing Assistant (CNA)",
                "experience_years": 4,
                "shift": "Day",
                "status": "Active",
                "assigned_elderly_ids": [],
                "assigned_elderly_names": [],
                "daily_reports_submitted": 0,
                "performance_rating": 5.0,
                "profileImage": current_user.get("profileImage", ""),
                "notification_prefs": {
                    "high_risk_alerts": True,
                    "moderate_risk_alerts": True,
                    "missed_checkin_alerts": True,
                    "task_reminders": True
                },
                "createdAt": now_iso,
                "updatedAt": now_iso
            }
            res = caregivers_collection.insert_one(profile)
            profile["_id"] = res.inserted_id

        cg_id = str(profile["_id"])
        assigned_ids = [str(eid) for eid in profile.get("assigned_elderly_ids", [])]

        return {
            "profile": profile,
            "caregiver_id": cg_id,
            "user_id": user_id,
            "assigned_elderly_ids": assigned_ids
        }

    @staticmethod
    def _verify_elderly_assigned(cg_context: Dict[str, Any], elderly_id: str) -> Dict[str, Any]:
        """
        Server-side IDOR guard: verifies if requested elderly_id is assigned to caregiver.
        Raises 403 HTTP Exception if not assigned.
        """
        elderly_id_clean = elderly_id.strip()

        # Find elderly doc
        elderly_doc = None
        try:
            eld_obj = ObjectId(elderly_id_clean)
            elderly_doc = elderly_collection.find_one({"_id": eld_obj})
        except Exception:
            pass

        if not elderly_doc:
            elderly_doc = elderly_collection.find_one({"user_id": elderly_id_clean})

        if not elderly_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Elderly client profile not found."
            )

        eld_pk = str(elderly_doc["_id"])
        eld_user_id = str(elderly_doc.get("user_id", ""))
        assigned_ids = cg_context["assigned_elderly_ids"]
        cg_user_id = cg_context["user_id"]
        cg_profile_id = cg_context["caregiver_id"]

        is_assigned = (
            eld_pk in assigned_ids or
            eld_user_id in assigned_ids or
            str(elderly_doc.get("assigned_caregiver_id")) == cg_user_id or
            str(elderly_doc.get("assigned_caregiver_id")) == cg_profile_id
        )

        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This elderly client is not assigned to your caregiver account."
            )

        return elderly_doc

    # ---------------------------------------------------------------------------
    # 1. Profile Operations
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_my_profile(current_user: Dict[str, Any]) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        return serialize_caregiver_doc(cg_context["profile"], current_user)

    @staticmethod
    def update_my_profile(current_user: Dict[str, Any], payload: CaregiverProfileSelfUpdate) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        cg_id = ObjectId(cg_context["caregiver_id"])

        updates: Dict[str, Any] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if payload.name is not None:
            name_val = payload.name.strip()
            updates["name"] = name_val
            updates["full_name"] = name_val
            # update user doc as well
            users_collection.update_one(
                {"_id": ObjectId(cg_context["user_id"])},
                {"$set": {"full_name": name_val, "name": name_val}}
            )

        if payload.phone is not None:
            updates["phone"] = payload.phone.strip()
            users_collection.update_one(
                {"_id": ObjectId(cg_context["user_id"])},
                {"$set": {"phone": payload.phone.strip()}}
            )

        if payload.qualification is not None:
            updates["qualification"] = payload.qualification.strip()

        if payload.shift is not None:
            updates["shift"] = payload.shift.strip()

        if payload.profileImage is not None:
            updates["profileImage"] = payload.profileImage
            users_collection.update_one(
                {"_id": ObjectId(cg_context["user_id"])},
                {"$set": {"profileImage": payload.profileImage}}
            )

        updates["updatedAt"] = now_iso

        caregivers_collection.update_one({"_id": cg_id}, {"$set": updates})
        updated_doc = caregivers_collection.find_one({"_id": cg_id})
        return serialize_caregiver_doc(updated_doc, current_user)

    # ---------------------------------------------------------------------------
    # 2. Caregiver Portal Dashboard
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_dashboard(current_user: Dict[str, Any]) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        assigned_ids = cg_context["assigned_elderly_ids"]
        cg_user_id = cg_context["user_id"]
        cg_id = cg_context["caregiver_id"]

        # Fetch all assigned elderly documents
        elderly_query = {
            "$or": [
                {"_id": {"$in": [ObjectId(eid) for eid in assigned_ids if ObjectId.is_valid(eid)]}},
                {"user_id": {"$in": assigned_ids}},
                {"assigned_caregiver_id": cg_user_id},
                {"assigned_caregiver_id": cg_id}
            ]
        }
        assigned_elderly_cursor = list(elderly_collection.find(elderly_query)) if assigned_ids or cg_user_id else []

        today_str = date.today().isoformat()

        total_assigned = len(assigned_elderly_cursor)
        checkins_completed_today = 0
        checkins_missed_today = 0
        moderate_risk_count = 0
        high_risk_count = 0

        assigned_items = []
        missed_checkins = []
        recent_activity = []

        for eld in assigned_elderly_cursor:
            eld_pk = str(eld["_id"])
            eld_user_id = str(eld.get("user_id", ""))
            eld_name = eld.get("full_name") or eld.get("name", "Elderly Patient")
            dob_str = eld.get("date_of_birth")

            # Check today's check-in
            checkin = wellness_checkins_collection.find_one({
                "user_id": eld_user_id,
                "date": today_str
            })

            risk_level = (eld.get("risk_level") or (checkin.get("wellness_risk") if checkin else "Low")).capitalize()

            if checkin:
                checkins_completed_today += 1
                last_date = checkin.get("date", today_str)
                last_time = datetime.fromisoformat(checkin["created_at"]).strftime("%I:%M %p") if checkin.get("created_at") else "Today"
                recent_activity.append({
                    "elderly_id": eld_pk,
                    "elderly_name": eld_name,
                    "date": last_date,
                    "time": last_time,
                    "wellness_risk": risk_level,
                    "notes": checkin.get("notes", "")
                })
            else:
                checkins_missed_today += 1
                last_date = "No check-in today"
                last_time = "-"
                missed_checkins.append({
                    "elderly_id": eld_pk,
                    "elderly_name": eld_name,
                    "age": _compute_age(dob_str),
                    "phone": eld.get("phone", ""),
                    "profileImage": eld.get("profileImage", "")
                })

            if risk_level == "Moderate":
                moderate_risk_count += 1
            elif risk_level == "High":
                high_risk_count += 1

            # Determine medication status
            med_count = medications_collection.count_documents({"user_id": eld_user_id})
            med_status = "Taken" if checkin and checkin.get("medication_taken") else ("Missed" if checkin and not checkin.get("medication_taken") else ("Pending" if med_count > 0 else "None"))

            # Determine alert status
            alert_status = f"{risk_level} Risk" if risk_level in ["Moderate", "High"] else ("Missed Check-in" if not checkin else "Clear")

            assigned_items.append({
                "id": eld_pk,
                "user_id": eld_user_id,
                "name": eld_name,
                "full_name": eld_name,
                "age": _compute_age(dob_str),
                "gender": eld.get("gender", ""),
                "date_of_birth": dob_str,
                "risk_level": risk_level,
                "last_checkin_date": last_date,
                "last_checkin_time": last_time,
                "medication_status": med_status,
                "alert_status": alert_status,
                "profileImage": eld.get("profileImage", ""),
                "phone": eld.get("phone", ""),
                "address": eld.get("address", "")
            })

        # Fetch unresolved alerts
        all_assigned_user_ids = [str(e.get("user_id", "")) for e in assigned_elderly_cursor] + [str(e["_id"]) for e in assigned_elderly_cursor]
        alerts_query = {
            "$or": [
                {"caregiver_id": cg_id},
                {"user_id": cg_user_id},
                {"elderly_id": {"$in": all_assigned_user_ids}}
            ],
            "status": {"$ne": "Resolved"}
        }

        unresolved_alerts_cursor = list(alerts_collection.find(alerts_query).sort("created_at", -1))
        unresolved_alerts_count = len(unresolved_alerts_cursor)

        high_priority_alerts = []
        for a in unresolved_alerts_cursor:
            high_priority_alerts.append({
                "id": str(a["_id"]),
                "elderly_id": str(a.get("elderly_id", "")),
                "elderly_name": a.get("elderly_name", "Assigned Patient"),
                "caregiver_id": cg_id,
                "alert_type": a.get("alert_type") or a.get("type", "High Risk"),
                "severity": a.get("severity", "High"),
                "title": a.get("title", "High Risk Telemetry Alert"),
                "reason": a.get("reason") or a.get("message", ""),
                "message": a.get("message", ""),
                "status": a.get("status", "New"),
                "resolution_note": a.get("resolution_note", ""),
                "created_at": a.get("created_at", datetime.now(timezone.utc).isoformat()),
                "updated_at": a.get("updated_at", datetime.now(timezone.utc).isoformat())
            })

        # Fetch pending tasks
        pending_tasks = CaregiverPortalService.get_tasks(current_user, status_filter="Pending")

        # Fetch recent notifications
        recent_notifications = CaregiverPortalService.get_notifications(current_user)[:5]

        return {
            "summary": {
                "total_assigned": total_assigned,
                "checkins_completed_today": checkins_completed_today,
                "checkins_missed_today": checkins_missed_today,
                "moderate_risk_count": moderate_risk_count,
                "high_risk_count": high_risk_count,
                "unresolved_alerts_count": unresolved_alerts_count
            },
            "high_priority_alerts": high_priority_alerts,
            "assigned_elderly": assigned_items,
            "missed_checkins": missed_checkins,
            "pending_tasks": pending_tasks,
            "recent_activity": recent_activity[:10],
            "recent_notifications": recent_notifications
        }

    # ---------------------------------------------------------------------------
    # 3. Assigned Elderly List & Filter
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_assigned_elderly_list(
        current_user: Dict[str, Any],
        search: Optional[str] = None,
        risk_filter: Optional[str] = None,
        checkin_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        assigned_ids = cg_context["assigned_elderly_ids"]
        cg_user_id = cg_context["user_id"]
        cg_id = cg_context["caregiver_id"]

        if not assigned_ids and not cg_user_id:
            return []

        query: Dict[str, Any] = {
            "$or": [
                {"_id": {"$in": [ObjectId(eid) for eid in assigned_ids if ObjectId.is_valid(eid)]}},
                {"user_id": {"$in": assigned_ids}},
                {"assigned_caregiver_id": cg_user_id},
                {"assigned_caregiver_id": cg_id}
            ]
        }

        cursor = list(elderly_collection.find(query))
        today_str = date.today().isoformat()

        results = []
        for eld in cursor:
            eld_pk = str(eld["_id"])
            eld_user_id = str(eld.get("user_id", ""))
            eld_name = eld.get("full_name") or eld.get("name", "Elderly Patient")

            # Check search
            if search and search.strip():
                s = search.strip().lower()
                if s not in eld_name.lower() and s not in (eld.get("phone") or "").lower():
                    continue

            checkin = wellness_checkins_collection.find_one({"user_id": eld_user_id, "date": today_str})
            risk_level = (eld.get("risk_level") or (checkin.get("wellness_risk") if checkin else "Low")).capitalize()

            # Filter by risk
            if risk_filter and risk_filter != "all" and risk_level.lower() != risk_filter.lower():
                continue

            # Filter by check-in status
            has_checked_in = checkin is not None
            if checkin_filter == "checked_in" and not has_checked_in:
                continue
            if checkin_filter == "missed" and has_checked_in:
                continue

            med_count = medications_collection.count_documents({"user_id": eld_user_id})
            med_status = "Taken" if checkin and checkin.get("medication_taken") else ("Missed" if checkin and not checkin.get("medication_taken") else ("Pending" if med_count > 0 else "None"))

            alert_status = f"{risk_level} Risk" if risk_level in ["Moderate", "High"] else ("Missed Check-in" if not checkin else "Clear")

            results.append({
                "id": eld_pk,
                "user_id": eld_user_id,
                "name": eld_name,
                "full_name": eld_name,
                "age": _compute_age(eld.get("date_of_birth")),
                "gender": eld.get("gender", ""),
                "date_of_birth": eld.get("date_of_birth"),
                "risk_level": risk_level,
                "last_checkin_date": checkin.get("date") if checkin else "No check-in today",
                "last_checkin_time": datetime.fromisoformat(checkin["created_at"]).strftime("%I:%M %p") if checkin and checkin.get("created_at") else "-",
                "medication_status": med_status,
                "alert_status": alert_status,
                "profileImage": eld.get("profileImage", ""),
                "phone": eld.get("phone", ""),
                "address": eld.get("address", "")
            })

        return results

    # ---------------------------------------------------------------------------
    # 4. Read-Only Elderly Details & Explainable AI Risk Indicator
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_elderly_details(current_user: Dict[str, Any], elderly_id: str) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        elderly_doc = CaregiverPortalService._verify_elderly_assigned(cg_context, elderly_id)

        eld_pk = str(elderly_doc["_id"])
        eld_user_id = str(elderly_doc.get("user_id", eld_pk))

        # Profile serialization
        user_info = users_collection.find_one({"_id": ObjectId(eld_user_id)}) if ObjectId.is_valid(eld_user_id) else None
        dob = elderly_doc.get("date_of_birth")

        profile_data = {
            "id": eld_pk,
            "user_id": eld_user_id,
            "name": elderly_doc.get("full_name") or elderly_doc.get("name", "Elderly Patient"),
            "full_name": elderly_doc.get("full_name") or elderly_doc.get("name", "Elderly Patient"),
            "email": elderly_doc.get("email") or (user_info.get("email") if user_info else ""),
            "phone": elderly_doc.get("phone") or (user_info.get("phone") if user_info else ""),
            "date_of_birth": dob,
            "age": _compute_age(dob),
            "gender": elderly_doc.get("gender", ""),
            "blood_group": elderly_doc.get("blood_group", ""),
            "address": elderly_doc.get("address", ""),
            "profileImage": elderly_doc.get("profileImage", ""),
            "risk_level": (elderly_doc.get("risk_level") or "Low").capitalize()
        }

        # Health info
        health_info = elderly_doc.get("health_info", {
            "conditions": [],
            "other_condition": "",
            "blood_group": elderly_doc.get("blood_group", ""),
            "allergies": [],
            "previous_conditions": "",
            "medical_notes": ""
        })

        # Hospital info
        hospital_info = elderly_doc.get("hospital_info", {
            "hospital_name": "General Medical Hospital",
            "location": "Main Healthcare Campus",
            "department": "Geriatric Care",
            "contact_number": "+1 (555) 019-2831"
        })

        # Doctor info
        doc_info = {"is_assigned": False, "doctor_name": "Not Assigned", "specialization": "", "hospital": "", "contact": ""}
        if elderly_doc.get("assigned_doctor_id"):
            doc_id = str(elderly_doc["assigned_doctor_id"])
            d_doc = doctors_collection.find_one({"_id": ObjectId(doc_id)}) if ObjectId.is_valid(doc_id) else doctors_collection.find_one({"user_id": doc_id})
            if d_doc:
                doc_info = {
                    "is_assigned": True,
                    "doctor_name": d_doc.get("name") or d_doc.get("full_name", "Dr. Specialist"),
                    "specialization": d_doc.get("specialization", "Geriatric Specialist"),
                    "hospital": d_doc.get("hospital_name", hospital_info.get("hospital_name", "")),
                    "contact": d_doc.get("phone", "")
                }

        # Medications list
        meds_cursor = medications_collection.find({"user_id": eld_user_id})
        medications_list = [
            {
                "id": str(m["_id"]),
                "medicine_name": m.get("medicine_name", ""),
                "dosage": m.get("dosage", ""),
                "frequency": m.get("frequency", ""),
                "intake_time": m.get("intake_time", ""),
                "food_relation": m.get("food_relation", ""),
                "status": m.get("status", "pending"),
                "notes": m.get("notes", "")
            }
            for m in meds_cursor
        ]

        # Emergency contacts
        contacts_cursor = emergency_contacts_collection.find({"user_id": eld_user_id})
        emergency_contacts = [
            {
                "id": str(c["_id"]),
                "contact_type": c.get("contact_type", "Primary"),
                "name": c.get("name", ""),
                "relationship": c.get("relationship", ""),
                "phone": c.get("phone", ""),
                "alt_phone": c.get("alt_phone", "")
            }
            for c in contacts_cursor
        ]

        # Assignment info
        assignment_info = {
            "assigned_caregiver_id": cg_context["user_id"],
            "assigned_caregiver_name": cg_context["profile"].get("name", "Caregiver Staff"),
            "assigned_date": elderly_doc.get("assigned_caregiver_date") or elderly_doc.get("updatedAt")
        }

        # Latest Check-in
        latest_checkin_doc = wellness_checkins_collection.find_one(
            {"user_id": eld_user_id},
            sort=[("date", -1), ("created_at", -1)]
        )

        latest_checkin = None
        if latest_checkin_doc:
            latest_checkin = {
                "id": str(latest_checkin_doc["_id"]),
                "date": latest_checkin_doc.get("date"),
                "medication_taken": latest_checkin_doc.get("medication_taken", True),
                "appetite": latest_checkin_doc.get("appetite", "good"),
                "sleep_quality": latest_checkin_doc.get("sleep_quality", "good"),
                "mobility_difficulty": latest_checkin_doc.get("mobility_difficulty", "none"),
                "mood": latest_checkin_doc.get("mood", "good"),
                "symptoms": latest_checkin_doc.get("symptoms", ""),
                "notes": latest_checkin_doc.get("notes", ""),
                "wellness_risk": (latest_checkin_doc.get("wellness_risk") or "Low").capitalize(),
                "created_at": latest_checkin_doc.get("created_at")
            }

        # Explainable AI risk breakdown
        explainable_risk = CaregiverPortalService._compute_explainable_ai_risk(latest_checkin, elderly_doc, medications_list)

        return {
            "profile": profile_data,
            "health_info": health_info,
            "hospital_info": hospital_info,
            "doctor_info": doc_info,
            "medications": medications_list,
            "emergency_contacts": emergency_contacts,
            "assignment_info": assignment_info,
            "latest_checkin": latest_checkin,
            "explainable_risk": explainable_risk
        }

    @staticmethod
    def _compute_explainable_ai_risk(
        latest_checkin: Optional[Dict[str, Any]],
        elderly_doc: Dict[str, Any],
        medications_list: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates caregiver-friendly risk factors, confidence score, and clear safety disclaimer.
        Does NOT produce medical diagnosis — purely wellness telemetry breakdown.
        """
        risk_level = (elderly_doc.get("risk_level") or (latest_checkin.get("wellness_risk") if latest_checkin else "Low")).capitalize()
        factors = []
        confidence_score = 88

        if latest_checkin:
            if not latest_checkin.get("medication_taken", True):
                factors.append({
                    "factor_name": "Missed Scheduled Medication",
                    "description": "Patient self-reported skipping or missing daily scheduled medication dose.",
                    "impact_level": "High"
                })

            sleep = (latest_checkin.get("sleep_quality") or "").lower()
            if any(term in sleep for term in ["poor", "restless", "insomnia", "bad", "interrupted"]):
                factors.append({
                    "factor_name": "Disturbed Sleep Quality",
                    "description": f"Check-in indicates poor sleep telemetry ({sleep}). Restlessness increases fatigue and fall risk.",
                    "impact_level": "Medium"
                })

            mobility = (latest_checkin.get("mobility_difficulty") or "").lower()
            if any(term in mobility for term in ["difficult", "severe", "assisted", "walker", "wheelchair", "pain"]):
                factors.append({
                    "factor_name": "Impaired Mobility / Elevated Fall Risk",
                    "description": f"Reported mobility challenge ({mobility}). Extra care recommended during transfers.",
                    "impact_level": "High" if "severe" in mobility else "Medium"
                })

            appetite = (latest_checkin.get("appetite") or "").lower()
            if any(term in appetite for term in ["poor", "low", "none", "skipped"]):
                factors.append({
                    "factor_name": "Reduced Dietary Intake",
                    "description": f"Appetite logged as '{appetite}'. Monitor hydration and electrolyte balance.",
                    "impact_level": "Medium"
                })

            symptoms = latest_checkin.get("symptoms", "")
            if symptoms and symptoms.strip():
                factors.append({
                    "factor_name": "Active Symptoms Reported",
                    "description": f"Patient reported: '{symptoms}'.",
                    "impact_level": "High" if "chest" in symptoms.lower() or "dizzy" in symptoms.lower() else "Medium"
                })
        else:
            factors.append({
                "factor_name": "Missing Daily Check-in Telemetry",
                "description": "No check-in submitted today. Check-in adherence gap increases uncertainty.",
                "impact_level": "Medium"
            })

        if risk_level == "High":
            confidence_score = 92
            summary = "Multiple high-impact telemetry signals detected. Immediate caregiver check-in recommended."
        elif risk_level == "Moderate":
            confidence_score = 84
            summary = "Moderate risk indicators observed. Monitor medication adherence and mobility closely."
        else:
            confidence_score = 95
            summary = "Wellness telemetry is stable. Routine care and daily check-in monitoring suggested."

        if not factors:
            factors.append({
                "factor_name": "Optimal Daily Telemetry",
                "description": "Medication taken on time, sleep quality acceptable, no mobility distress reported.",
                "impact_level": "Low"
            })

        return {
            "risk_level": risk_level,
            "confidence_score": confidence_score,
            "risk_label": f"Wellness Risk: {risk_level}",
            "summary": summary,
            "safety_disclaimer": "Notice: This AI-generated risk assessment relies on daily check-in metrics and medication logging. It is a wellness monitoring tool to prioritize caregiver attention and is NOT a clinical diagnosis.",
            "contributing_factors": factors
        }

    # ---------------------------------------------------------------------------
    # 5. Wellness History & Trends
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_elderly_wellness_history(
        current_user: Dict[str, Any],
        elderly_id: str,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        elderly_doc = CaregiverPortalService._verify_elderly_assigned(cg_context, elderly_id)

        eld_pk = str(elderly_doc["_id"])
        eld_user_id = str(elderly_doc.get("user_id", eld_pk))

        query: Dict[str, Any] = {"user_id": eld_user_id}
        if date_from or date_to:
            date_filter: Dict[str, Any] = {}
            if date_from:
                date_filter["$gte"] = date_from
            if date_to:
                date_filter["$lte"] = date_to
            query["date"] = date_filter

        total = wellness_checkins_collection.count_documents(query)
        skip = (max(page, 1) - 1) * limit

        cursor = list(
            wellness_checkins_collection.find(query)
            .sort("date", -1)
            .skip(skip)
            .limit(limit)
        )

        checkins = []
        for c in cursor:
            checkins.append({
                "id": str(c["_id"]),
                "date": c.get("date"),
                "medication_taken": c.get("medication_taken", True),
                "appetite": c.get("appetite", "good"),
                "sleep_quality": c.get("sleep_quality", "good"),
                "mobility_difficulty": c.get("mobility_difficulty", "none"),
                "mood": c.get("mood", "good"),
                "symptoms": c.get("symptoms", ""),
                "notes": c.get("notes", ""),
                "wellness_risk": (c.get("wellness_risk") or "Low").capitalize(),
                "created_at": c.get("created_at")
            })

        return {
            "checkins": checkins,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total / limit) if limit > 0 else 1
        }

    # ---------------------------------------------------------------------------
    # 6. Read-Only Medication Monitoring
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_elderly_medications(current_user: Dict[str, Any], elderly_id: str) -> List[Dict[str, Any]]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        elderly_doc = CaregiverPortalService._verify_elderly_assigned(cg_context, elderly_id)

        eld_user_id = str(elderly_doc.get("user_id", str(elderly_doc["_id"])))
        meds_cursor = list(medications_collection.find({"user_id": eld_user_id}))

        today_str = date.today().isoformat()
        today_checkin = wellness_checkins_collection.find_one({"user_id": eld_user_id, "date": today_str})

        results = []
        for m in meds_cursor:
            med_status = "pending"
            if today_checkin:
                med_status = "taken" if today_checkin.get("medication_taken") else "missed"

            results.append({
                "id": str(m["_id"]),
                "medicine_name": m.get("medicine_name", ""),
                "dosage": m.get("dosage", ""),
                "frequency": m.get("frequency", ""),
                "intake_time": m.get("intake_time", ""),
                "food_relation": m.get("food_relation", ""),
                "status": m.get("status") or med_status,
                "notes": m.get("notes", "")
            })

        return results

    # ---------------------------------------------------------------------------
    # 7. Check-in Reminder Action
    # ---------------------------------------------------------------------------

    @staticmethod
    def send_checkin_reminder(current_user: Dict[str, Any], elderly_id: str) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        elderly_doc = CaregiverPortalService._verify_elderly_assigned(cg_context, elderly_id)

        eld_user_id = str(elderly_doc.get("user_id", str(elderly_doc["_id"])))
        cg_name = cg_context["profile"].get("name") or current_user.get("full_name", "Caregiver Staff")

        now_iso = datetime.now(timezone.utc).isoformat()

        # Send in-app notification to elderly user
        notifications_collection.insert_one({
            "user_id": eld_user_id,
            "target_role": "elderly",
            "title": "⏰ Caregiver Check-In Reminder",
            "message": f"Your caregiver {cg_name} sent a reminder to complete your daily wellness check-in.",
            "type": "reminder",
            "status": "unread",
            "created_at": now_iso
        })

        return {
            "message": f"Check-in reminder successfully sent to {elderly_doc.get('full_name') or elderly_doc.get('name')}.",
            "elderly_id": elderly_id,
            "sent_at": now_iso
        }

    # ---------------------------------------------------------------------------
    # 8. Alerts Management
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_alerts(
        current_user: Dict[str, Any],
        severity: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        assigned_ids = cg_context["assigned_elderly_ids"]
        cg_user_id = cg_context["user_id"]
        cg_id = cg_context["caregiver_id"]

        # Fetch assigned elderly docs to get all potential IDs
        elderly_query = {
            "$or": [
                {"_id": {"$in": [ObjectId(eid) for eid in assigned_ids if ObjectId.is_valid(eid)]}},
                {"user_id": {"$in": assigned_ids}},
                {"assigned_caregiver_id": cg_user_id},
                {"assigned_caregiver_id": cg_id}
            ]
        }
        assigned_elderly_list = list(elderly_collection.find(elderly_query)) if assigned_ids or cg_user_id else []
        all_assigned_ids = []
        for e in assigned_elderly_list:
            all_assigned_ids.append(str(e["_id"]))
            if e.get("user_id"):
                all_assigned_ids.append(str(e["user_id"]))

        # Build query for alerts
        query: Dict[str, Any] = {
            "$or": [
                {"caregiver_id": cg_id},
                {"user_id": cg_user_id},
                {"elderly_id": {"$in": all_assigned_ids}}
            ]
        }

        if severity and severity != "all":
            query["severity"] = {"$regex": f"^{severity.strip()}$", "$options": "i"}

        if status_filter and status_filter != "all":
            query["status"] = {"$regex": f"^{status_filter.strip()}$", "$options": "i"}

        cursor = list(alerts_collection.find(query).sort("created_at", -1))

        # Auto-sync alerts from high/moderate checkins if alerts_collection is empty
        if not cursor and assigned_elderly_list:
            now_iso = datetime.now(timezone.utc).isoformat()
            today_str = date.today().isoformat()

            for eld in assigned_elderly_list:
                eld_pk = str(eld["_id"])
                eld_user_id = str(eld.get("user_id", eld_pk))
                eld_name = eld.get("full_name") or eld.get("name", "Elderly Client")

                checkin = wellness_checkins_collection.find_one({"user_id": eld_user_id, "date": today_str})
                risk = (eld.get("risk_level") or (checkin.get("wellness_risk") if checkin else "Low")).capitalize()

                if risk in ["High", "Moderate"]:
                    new_alert = {
                        "elderly_id": eld_pk,
                        "elderly_name": eld_name,
                        "caregiver_id": cg_id,
                        "alert_type": f"{risk} Risk Telemetry",
                        "severity": risk,
                        "title": f"🚨 {risk} Risk Alert: {eld_name}",
                        "reason": f"Wellness telemetry indicates {risk.lower()} risk indicators for {eld_name}.",
                        "message": f"Please review daily check-in and check on {eld_name}.",
                        "status": "New",
                        "resolution_note": "",
                        "created_at": now_iso,
                        "updated_at": now_iso
                    }
                    alerts_collection.insert_one(new_alert)

                if not checkin:
                    missed_alert = {
                        "elderly_id": eld_pk,
                        "elderly_name": eld_name,
                        "caregiver_id": cg_id,
                        "alert_type": "Missed Check-in",
                        "severity": "Moderate",
                        "title": f"⚠️ Missed Daily Check-in: {eld_name}",
                        "reason": f"{eld_name} has not submitted their daily check-in today.",
                        "message": "Send check-in reminder or contact patient.",
                        "status": "New",
                        "resolution_note": "",
                        "created_at": now_iso,
                        "updated_at": now_iso
                    }
                    alerts_collection.insert_one(missed_alert)

            cursor = list(alerts_collection.find(query).sort("created_at", -1))

        alerts = []
        for a in cursor:
            alerts.append({
                "id": str(a["_id"]),
                "elderly_id": str(a.get("elderly_id", "")),
                "elderly_name": a.get("elderly_name", "Assigned Patient"),
                "caregiver_id": cg_id,
                "alert_type": a.get("alert_type") or a.get("type", "High Risk"),
                "severity": a.get("severity", "High"),
                "title": a.get("title", "Telemetry Alert"),
                "reason": a.get("reason") or a.get("message", ""),
                "message": a.get("message", ""),
                "status": a.get("status", "New"),
                "resolution_note": a.get("resolution_note", ""),
                "created_at": a.get("created_at", datetime.now(timezone.utc).isoformat()),
                "updated_at": a.get("updated_at", datetime.now(timezone.utc).isoformat())
            })

        return alerts

    @staticmethod
    def acknowledge_alert(current_user: Dict[str, Any], alert_id: str) -> Dict[str, Any]:
        try:
            a_obj = ObjectId(alert_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid alert ID format.")

        now_iso = datetime.now(timezone.utc).isoformat()
        res = alerts_collection.update_one(
            {"_id": a_obj},
            {"$set": {"status": "Acknowledged", "updated_at": now_iso}}
        )

        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert record not found.")

        updated = alerts_collection.find_one({"_id": a_obj})
        return {
            "id": str(updated["_id"]),
            "status": updated.get("status"),
            "message": "Alert status updated to Acknowledged."
        }

    @staticmethod
    def resolve_alert(current_user: Dict[str, Any], alert_id: str, note: str = "") -> Dict[str, Any]:
        try:
            a_obj = ObjectId(alert_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid alert ID format.")

        now_iso = datetime.now(timezone.utc).isoformat()
        res = alerts_collection.update_one(
            {"_id": a_obj},
            {"$set": {
                "status": "Resolved",
                "resolution_note": note.strip() if note else "Resolved by caregiver.",
                "updated_at": now_iso
            }}
        )

        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert record not found.")

        updated = alerts_collection.find_one({"_id": a_obj})
        return {
            "id": str(updated["_id"]),
            "status": updated.get("status"),
            "resolution_note": updated.get("resolution_note"),
            "message": "Alert successfully resolved and archived."
        }

    # ---------------------------------------------------------------------------
    # 9. Caregiver Tasks
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_tasks(
        current_user: Dict[str, Any],
        elderly_id: Optional[str] = None,
        priority: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        cg_user_id = cg_context["user_id"]
        cg_id = cg_context["caregiver_id"]

        query: Dict[str, Any] = {
            "$or": [
                {"caregiver_id": cg_id},
                {"caregiver_user_id": cg_user_id}
            ]
        }

        if elderly_id:
            query["elderly_id"] = elderly_id.strip()

        if priority and priority != "all":
            query["priority"] = {"$regex": f"^{priority.strip()}$", "$options": "i"}

        if status_filter and status_filter != "all":
            query["status"] = {"$regex": f"^{status_filter.strip()}$", "$options": "i"}

        cursor = list(caregiver_tasks_collection.find(query).sort("created_at", -1))

        tasks = []
        for t in cursor:
            tasks.append({
                "id": str(t["_id"]),
                "caregiver_id": cg_id,
                "caregiver_user_id": cg_user_id,
                "elderly_id": str(t.get("elderly_id", "")),
                "elderly_name": t.get("elderly_name", "Assigned Client"),
                "title": t.get("title", ""),
                "description": t.get("description", ""),
                "priority": t.get("priority", "Medium"),
                "due_date": t.get("due_date"),
                "status": t.get("status", "Pending"),
                "created_at": t.get("created_at", datetime.now(timezone.utc).isoformat()),
                "updated_at": t.get("updated_at", datetime.now(timezone.utc).isoformat())
            })

        return tasks

    @staticmethod
    def create_task(current_user: Dict[str, Any], payload: CaregiverTaskCreatePayload) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        elderly_doc = CaregiverPortalService._verify_elderly_assigned(cg_context, payload.elderly_id)

        eld_pk = str(elderly_doc["_id"])
        eld_name = elderly_doc.get("full_name") or elderly_doc.get("name", "Assigned Client")

        now_iso = datetime.now(timezone.utc).isoformat()
        doc = {
            "caregiver_id": cg_context["caregiver_id"],
            "caregiver_user_id": cg_context["user_id"],
            "elderly_id": eld_pk,
            "elderly_name": eld_name,
            "title": payload.title.strip(),
            "description": (payload.description or "").strip(),
            "priority": (payload.priority or "Medium").capitalize(),
            "due_date": payload.due_date or date.today().isoformat(),
            "status": "Pending",
            "created_at": now_iso,
            "updated_at": now_iso
        }

        res = caregiver_tasks_collection.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        del doc["_id"]
        return doc

    @staticmethod
    def update_task(current_user: Dict[str, Any], task_id: str, payload: CaregiverTaskUpdatePayload) -> Dict[str, Any]:
        try:
            t_obj = ObjectId(task_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid task ID format.")

        updates: Dict[str, Any] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if payload.title is not None:
            updates["title"] = payload.title.strip()

        if payload.description is not None:
            updates["description"] = payload.description.strip()

        if payload.priority is not None:
            updates["priority"] = payload.priority.capitalize()

        if payload.due_date is not None:
            updates["due_date"] = payload.due_date

        if payload.status is not None:
            updates["status"] = payload.status.capitalize()

        updates["updated_at"] = now_iso

        res = caregiver_tasks_collection.update_one({"_id": t_obj}, {"$set": updates})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Task not found.")

        updated = caregiver_tasks_collection.find_one({"_id": t_obj})
        return {
            "id": str(updated["_id"]),
            "title": updated.get("title"),
            "status": updated.get("status"),
            "priority": updated.get("priority"),
            "message": "Task updated successfully."
        }

    # ---------------------------------------------------------------------------
    # 10. Caregiver Notifications
    # ---------------------------------------------------------------------------

    @staticmethod
    def get_notifications(current_user: Dict[str, Any]) -> List[Dict[str, Any]]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        cg_user_id = cg_context["user_id"]
        cg_id = cg_context["caregiver_id"]

        query = {
            "$or": [
                {"target_role": "all"},
                {"target_role": {"$regex": "^caregiver$", "$options": "i"}},
                {"user_id": cg_user_id},
                {"caregiver_id": cg_id}
            ]
        }

        docs = list(notifications_collection.find(query).sort("created_at", -1).limit(30))

        return [
            {
                "id": str(d["_id"]),
                "title": d.get("title", "Notification"),
                "message": d.get("message", ""),
                "type": d.get("type", "announcement"),
                "created_at": d.get("created_at", "")
            }
            for d in docs
        ]

    # ---------------------------------------------------------------------------
    # 11. Care Summary Reports
    # ---------------------------------------------------------------------------

    @staticmethod
    def generate_care_report(
        current_user: Dict[str, Any],
        elderly_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        elderly_doc = CaregiverPortalService._verify_elderly_assigned(cg_context, elderly_id)

        eld_pk = str(elderly_doc["_id"])
        eld_user_id = str(elderly_doc.get("user_id", eld_pk))
        eld_name = elderly_doc.get("full_name") or elderly_doc.get("name", "Elderly Patient")

        today_s = date.today().isoformat()
        s_date = start_date or (date.today() - timedelta(days=30)).isoformat()
        e_date = end_date or today_s

        query = {
            "user_id": eld_user_id,
            "date": {"$gte": s_date, "$lte": e_date}
        }

        checkin_docs = list(wellness_checkins_collection.find(query).sort("date", 1))
        total_checkins = len(checkin_docs)

        completed_count = total_checkins
        meds_taken_count = sum(1 for c in checkin_docs if c.get("medication_taken"))
        med_adherence_rate = round((meds_taken_count / total_checkins * 100), 1) if total_checkins > 0 else 100.0

        risk_dist = {"Low": 0, "Moderate": 0, "High": 0}
        for c in checkin_docs:
            r = (c.get("wellness_risk") or "Low").capitalize()
            risk_dist[r] = risk_dist.get(r, 0) + 1

        # Alerts summary
        alerts_cursor = list(alerts_collection.find({"elderly_id": eld_pk, "created_at": {"$gte": s_date}}))
        total_alerts = len(alerts_cursor)
        resolved_alerts = sum(1 for a in alerts_cursor if a.get("status") == "Resolved")

        summary_notes = f"Care Summary Report for {eld_name} from {s_date} to {e_date}. Total wellness check-ins completed: {total_checkins}. Medication adherence rate: {med_adherence_rate}%. Unresolved alerts: {total_alerts - resolved_alerts}."

        return {
            "elderly_id": eld_pk,
            "elderly_name": eld_name,
            "start_date": s_date,
            "end_date": e_date,
            "total_checkins": total_checkins,
            "completed_checkins": completed_count,
            "missed_checkins": max(0, 30 - total_checkins),
            "risk_distribution": risk_dist,
            "medication_adherence_rate": med_adherence_rate,
            "total_alerts": total_alerts,
            "resolved_alerts": resolved_alerts,
            "summary_notes": summary_notes
        }

    # ---------------------------------------------------------------------------
    # 12. Password & Preferences Settings
    # ---------------------------------------------------------------------------

    @staticmethod
    def change_password(current_user: Dict[str, Any], payload: CaregiverPasswordChangePayload) -> Dict[str, str]:
        u_obj = ObjectId(current_user["id"])
        user_doc = users_collection.find_one({"_id": u_obj})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User account not found.")

        hashed = user_doc.get("hashed_password") or user_doc.get("passwordHash")
        if not hashed or not verify_password(payload.current_password, hashed):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")

        new_hash = get_password_hash(payload.new_password)
        users_collection.update_one(
            {"_id": u_obj},
            {"$set": {"hashed_password": new_hash, "passwordHash": new_hash}}
        )

        return {"message": "Password changed successfully."}

    @staticmethod
    def update_notification_prefs(current_user: Dict[str, Any], payload: CaregiverSettingsUpdatePayload) -> Dict[str, Any]:
        cg_context = CaregiverPortalService._get_caregiver_context(current_user)
        cg_id = ObjectId(cg_context["caregiver_id"])

        prefs = {
            "high_risk_alerts": payload.high_risk_alerts,
            "moderate_risk_alerts": payload.moderate_risk_alerts,
            "missed_checkin_alerts": payload.missed_checkin_alerts,
            "task_reminders": payload.task_reminders
        }

        caregivers_collection.update_one(
            {"_id": cg_id},
            {"$set": {"notification_prefs": prefs, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )

        return prefs
