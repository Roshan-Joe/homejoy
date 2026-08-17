"""
Elderly Client Service — all business logic for elderly-user-facing operations.

This service operates exclusively on behalf of the authenticated elderly user.
It reads caregiver assignment data from admin-managed collections but NEVER writes to them.
It does NOT touch admin-only management endpoints or duplicate any admin functionality.
"""
import math
from datetime import datetime, date, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import (
    elderly_collection,
    users_collection,
    caregivers_collection,
    doctors_collection,
    medications_collection,
    emergency_contacts_collection,
    wellness_checkins_collection,
    notifications_collection,
)
from app.schemas.elderly_client_schema import (
    ElderlyProfileSelfUpdate,
    HealthInfoUpdate,
    HospitalInfoUpdate,
    MedicationCreate,
    MedicationUpdate,
    EmergencyContactCreate,
    EmergencyContactUpdate,
    CheckInCreate,
    NotificationPrefsUpdate,
    ChangePasswordRequest,
)
from app.security import verify_password, get_password_hash


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _compute_age(dob_str: Optional[str]) -> Optional[int]:
    """Compute age in years from ISO date string. Never ask user to enter age directly."""
    if not dob_str:
        return None
    try:
        dob = date.fromisoformat(dob_str)
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except (ValueError, AttributeError):
        return None


def _get_elderly_profile(user_id: str) -> Dict[str, Any]:
    """
    Fetch elderly profile document for the given user_id.
    Creates a minimal profile doc if one doesn't exist yet (for users
    registered via auth but not yet through admin elderly management).
    """
    profile = elderly_collection.find_one({"user_id": user_id})
    if not profile:
        # Auto-create a minimal profile shell so the user can start filling it in
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")
        now_iso = datetime.now(timezone.utc).isoformat()
        new_profile = {
            "user_id": user_id,
            "name": user.get("full_name") or user.get("name", ""),
            "full_name": user.get("full_name") or user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "date_of_birth": None,
            "gender": "",
            "blood_group": "",
            "address": user.get("address", ""),
            "profileImage": user.get("profileImage", ""),
            # Health info embedded
            "health_info": {
                "conditions": [],
                "other_condition": "",
                "blood_group": "",
                "allergies": [],
                "previous_conditions": "",
                "medical_notes": "",
            },
            # Hospital info embedded
            "hospital_info": {
                "hospital_name": "",
                "location": "",
                "department": "",
                "contact_number": "",
            },
            # Assignment references (admin sets these — read only here)
            "assigned_caregiver_id": None,
            "assigned_caregiver_name": "Not Assigned",
            "assigned_caregiver_date": None,
            "assigned_doctor_id": None,
            "assigned_doctor_name": "Not Assigned",
            # Wellness
            "ai_risk_score": 0.10,
            "risk_level": "Low",
            "wellness_history": [],
            # Module state
            "setup_complete": False,
            "notification_prefs": {
                "checkin_reminder": True,
                "medication_reminder": True,
            },
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }
        result = elderly_collection.insert_one(new_profile)
        new_profile["_id"] = result.inserted_id
        return new_profile
    return profile


def _serialize_profile(doc: Dict[str, Any], user: Dict[str, Any]) -> Dict[str, Any]:
    dob = doc.get("date_of_birth") or doc.get("dob")
    return {
        "id": str(doc.get("_id", "")),
        "user_id": str(doc.get("user_id", "")),
        "full_name": doc.get("full_name") or doc.get("name") or user.get("full_name", ""),
        "email": doc.get("email") or user.get("email", ""),
        "phone": doc.get("phone") or user.get("phone", ""),
        "date_of_birth": dob,
        "age": _compute_age(dob),
        "gender": doc.get("gender", ""),
        "address": doc.get("address") or user.get("address", ""),
        "blood_group": doc.get("blood_group", ""),
        "profileImage": doc.get("profileImage") or user.get("profileImage", ""),
        "setup_complete": doc.get("setup_complete", False),
        "notification_prefs": doc.get("notification_prefs", {"checkin_reminder": True, "medication_reminder": True}),
        "assigned_caregiver_id": doc.get("assigned_caregiver_id"),
        "assigned_caregiver_name": doc.get("assigned_caregiver_name", "Not Assigned"),
        "assigned_doctor_id": doc.get("assigned_doctor_id"),
        "assigned_doctor_name": doc.get("assigned_doctor_name", "Not Assigned"),
        "risk_level": doc.get("risk_level", "Low"),
        "createdAt": doc.get("createdAt") or doc.get("created_at"),
    }


def _serialize_medication(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "medicine_name": doc.get("medicine_name", ""),
        "dosage": doc.get("dosage", ""),
        "frequency": doc.get("frequency", ""),
        "intake_time": doc.get("intake_time", ""),
        "before_food": doc.get("before_food", True),
        "prescribed_by": doc.get("prescribed_by", ""),
        "start_date": doc.get("start_date", ""),
        "end_date": doc.get("end_date"),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }


def _serialize_contact(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "contact_type": doc.get("contact_type", "primary"),
        "name": doc.get("name", ""),
        "relationship": doc.get("relationship", ""),
        "phone": doc.get("phone", ""),
        "alt_phone": doc.get("alt_phone", ""),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }


def _serialize_checkin(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "date": doc.get("date", ""),
        "medication_taken": doc.get("medication_taken", ""),
        "appetite": doc.get("appetite", ""),
        "sleep_quality": doc.get("sleep_quality", ""),
        "mobility_difficulty": doc.get("mobility_difficulty", ""),
        "mood": doc.get("mood", ""),
        "symptoms": doc.get("symptoms", ""),
        "notes": doc.get("notes", ""),
        "wellness_risk": doc.get("wellness_risk", "Low"),
        "created_at": doc.get("created_at", ""),
    }


# ---------------------------------------------------------------------------
# MOCK Wellness Risk Service
# ---------------------------------------------------------------------------
# NOTE: This is a clearly labeled MOCK implementation for development only.
# It uses a simple rule-based scoring function as a placeholder.
# Replace this function body with a real ML model API call when the
# prediction service is ready. The interface (input/output) must remain
# the same so no UI changes are needed.

def _mock_compute_wellness_risk(checkin_data: Dict[str, Any]) -> str:
    """
    MOCK: Computes a wellness risk level from a completed check-in.
    Returns: 'Low' | 'Moderate' | 'High'

    *** THIS IS A PLACEHOLDER — NOT REAL AI/ML OUTPUT ***
    Swap the body of this function for a real prediction service call.
    The return value must remain one of: 'Low', 'Moderate', 'High'
    """
    score = 0

    mood = checkin_data.get("mood", "Good")
    if mood in ["Poor"]:
        score += 3
    elif mood in ["Not Great", "Okay"]:
        score += 1

    appetite = checkin_data.get("appetite", "Good")
    if appetite in ["Poor", "No Appetite"]:
        score += 3
    elif appetite in ["Fair"]:
        score += 1

    sleep = checkin_data.get("sleep_quality", "Good")
    if sleep in ["Poor", "Very Poor"]:
        score += 2
    elif sleep in ["Fair"]:
        score += 1

    mobility = checkin_data.get("mobility_difficulty", "No difficulty")
    if mobility in ["Significant difficulty"]:
        score += 3
    elif mobility in ["Moderate difficulty"]:
        score += 2
    elif mobility in ["Slight difficulty"]:
        score += 1

    medication = checkin_data.get("medication_taken", "Yes, all taken")
    if medication in ["No, not taken"]:
        score += 2
    elif medication in ["Yes, partially taken"]:
        score += 1

    symptoms = checkin_data.get("symptoms", "")
    if symptoms and len(symptoms.strip()) > 5:
        score += 1

    if score >= 7:
        return "High"
    elif score >= 3:
        return "Moderate"
    return "Low"


# ---------------------------------------------------------------------------
# Elderly Client Service Class
# ---------------------------------------------------------------------------

class ElderlyClientService:

    # --- Profile ---

    @staticmethod
    def get_my_profile(user: Dict[str, Any]) -> Dict[str, Any]:
        user_id = user["id"]
        profile = _get_elderly_profile(user_id)
        return _serialize_profile(profile, user)

    @staticmethod
    def update_my_profile(user: Dict[str, Any], payload: ElderlyProfileSelfUpdate) -> Dict[str, Any]:
        user_id = user["id"]
        profile = _get_elderly_profile(user_id)
        profile_id = profile["_id"]

        updates: Dict[str, Any] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if payload.full_name is not None:
            updates["full_name"] = payload.full_name.strip()
            updates["name"] = payload.full_name.strip()
            # Sync to users collection
            users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"full_name": payload.full_name.strip()}})

        if payload.phone is not None:
            updates["phone"] = payload.phone.strip()
        if payload.date_of_birth is not None:
            updates["date_of_birth"] = payload.date_of_birth
        if payload.gender is not None:
            updates["gender"] = payload.gender
        if payload.address is not None:
            updates["address"] = payload.address.strip()

        updates["updatedAt"] = now_iso
        elderly_collection.update_one({"_id": profile_id}, {"$set": updates})

        updated = elderly_collection.find_one({"_id": profile_id})
        return _serialize_profile(updated, user)

    # --- Health Information ---

    @staticmethod
    def get_health_info(user: Dict[str, Any]) -> Dict[str, Any]:
        profile = _get_elderly_profile(user["id"])
        health = profile.get("health_info", {})
        return {
            "conditions": health.get("conditions", []),
            "other_condition": health.get("other_condition", ""),
            "blood_group": health.get("blood_group", "") or profile.get("blood_group", ""),
            "allergies": health.get("allergies", []),
            "previous_conditions": health.get("previous_conditions", ""),
            "medical_notes": health.get("medical_notes", ""),
        }

    @staticmethod
    def update_health_info(user: Dict[str, Any], payload: HealthInfoUpdate) -> Dict[str, Any]:
        profile = _get_elderly_profile(user["id"])
        profile_id = profile["_id"]
        existing_health = profile.get("health_info", {})

        updates: Dict[str, Any] = {**existing_health}
        if payload.conditions is not None:
            updates["conditions"] = payload.conditions
        if payload.other_condition is not None:
            updates["other_condition"] = payload.other_condition
        if payload.blood_group is not None:
            updates["blood_group"] = payload.blood_group
        if payload.allergies is not None:
            updates["allergies"] = payload.allergies
        if payload.previous_conditions is not None:
            updates["previous_conditions"] = payload.previous_conditions
        if payload.medical_notes is not None:
            updates["medical_notes"] = payload.medical_notes

        elderly_collection.update_one(
            {"_id": profile_id},
            {"$set": {"health_info": updates, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
        return updates

    # --- Hospital Information ---

    @staticmethod
    def get_hospital_info(user: Dict[str, Any]) -> Dict[str, Any]:
        profile = _get_elderly_profile(user["id"])
        hosp = profile.get("hospital_info", {})
        return {
            "hospital_name": hosp.get("hospital_name", ""),
            "location": hosp.get("location", ""),
            "department": hosp.get("department", ""),
            "contact_number": hosp.get("contact_number", ""),
        }

    @staticmethod
    def update_hospital_info(user: Dict[str, Any], payload: HospitalInfoUpdate) -> Dict[str, Any]:
        profile = _get_elderly_profile(user["id"])
        profile_id = profile["_id"]
        existing = profile.get("hospital_info", {})

        updates: Dict[str, Any] = {**existing}
        if payload.hospital_name is not None:
            updates["hospital_name"] = payload.hospital_name
        if payload.location is not None:
            updates["location"] = payload.location
        if payload.department is not None:
            updates["department"] = payload.department
        if payload.contact_number is not None:
            updates["contact_number"] = payload.contact_number

        elderly_collection.update_one(
            {"_id": profile_id},
            {"$set": {"hospital_info": updates, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
        return updates

    # --- Doctor Information ---

    @staticmethod
    def get_doctor_info(user: Dict[str, Any]) -> Dict[str, Any]:
        """Returns the admin-assigned doctor details (read-only). Never duplicates admin management."""
        profile = _get_elderly_profile(user["id"])
        doctor_id = profile.get("assigned_doctor_id")

        if not doctor_id:
            return {
                "is_assigned": False,
                "assigned_doctor_id": None,
                "doctor_name": "Not Assigned",
                "specialization": "",
                "hospital": "",
                "contact_number": "",
            }

        try:
            doctor_doc = doctors_collection.find_one({"_id": ObjectId(doctor_id)})
        except Exception:
            doctor_doc = None

        if not doctor_doc:
            return {
                "is_assigned": True,
                "assigned_doctor_id": doctor_id,
                "doctor_name": profile.get("assigned_doctor_name", "Assigned Doctor"),
                "specialization": "",
                "hospital": "",
                "contact_number": "",
            }

        return {
            "is_assigned": True,
            "assigned_doctor_id": doctor_id,
            "doctor_name": doctor_doc.get("name") or doctor_doc.get("full_name", ""),
            "specialization": doctor_doc.get("specialization", ""),
            "hospital": doctor_doc.get("hospital_name") or doctor_doc.get("hospital", ""),
            "contact_number": doctor_doc.get("phone") or doctor_doc.get("contact_number", ""),
        }

    # --- Medications ---

    @staticmethod
    def list_medications(user: Dict[str, Any]) -> List[Dict[str, Any]]:
        docs = list(medications_collection.find({"user_id": user["id"]}).sort("created_at", -1))
        return [_serialize_medication(d) for d in docs]

    @staticmethod
    def add_medication(user: Dict[str, Any], payload: MedicationCreate) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": user["id"],
            "medicine_name": payload.medicine_name.strip(),
            "dosage": payload.dosage.strip(),
            "frequency": payload.frequency,
            "intake_time": payload.intake_time or "",
            "before_food": payload.before_food,
            "prescribed_by": payload.prescribed_by or "",
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        result = medications_collection.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Automatically create notification alarm record for elderly user
        notifications_collection.insert_one({
            "user_id": user["id"],
            "target_role": "elderly",
            "title": f"⏰ Medication Alarm Set: {payload.medicine_name.strip()}",
            "message": f"Dosage: {payload.dosage.strip()} ({payload.intake_time or 'As scheduled'}). Alarm will remind you when it's time for dosage.",
            "type": "reminder",
            "created_at": now_iso
        })

        return _serialize_medication(doc)

    @staticmethod
    def update_medication(user: Dict[str, Any], med_id: str, payload: MedicationUpdate) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(med_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid medication ID.")

        doc = medications_collection.find_one({"_id": obj_id, "user_id": user["id"]})
        if not doc:
            raise HTTPException(status_code=404, detail="Medication record not found.")

        updates: Dict[str, Any] = {}
        if payload.medicine_name is not None:
            updates["medicine_name"] = payload.medicine_name.strip()
        if payload.dosage is not None:
            updates["dosage"] = payload.dosage.strip()
        if payload.frequency is not None:
            updates["frequency"] = payload.frequency
        if payload.intake_time is not None:
            updates["intake_time"] = payload.intake_time
        if payload.before_food is not None:
            updates["before_food"] = payload.before_food
        if payload.prescribed_by is not None:
            updates["prescribed_by"] = payload.prescribed_by
        if payload.start_date is not None:
            updates["start_date"] = payload.start_date
        if payload.end_date is not None:
            updates["end_date"] = payload.end_date

        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        medications_collection.update_one({"_id": obj_id}, {"$set": updates})
        updated = medications_collection.find_one({"_id": obj_id})
        return _serialize_medication(updated)

    @staticmethod
    def log_medication_dose(user: Dict[str, Any], med_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        status_val = str(payload.get("status", "taken")).lower()
        medicine_name = payload.get("medicine_name") or "Medication"
        dosage = payload.get("dosage", "")
        intake_time = payload.get("intake_time", "")
        now_iso = datetime.now(timezone.utc).isoformat()

        profile = _get_elderly_profile(user["id"])
        elderly_name = profile.get("full_name") or user.get("full_name") or "Elderly Client"
        caregiver_id = profile.get("assigned_caregiver_id")

        # 1. Log notification for elderly user
        notifications_collection.insert_one({
            "user_id": user["id"],
            "target_role": "elderly",
            "title": f"💊 Dose Recorded: {medicine_name}",
            "message": f"Dose for {medicine_name} ({dosage}) at {intake_time} marked as {status_val.upper()}.",
            "type": "reminder" if status_val == "taken" else "alert",
            "created_at": now_iso
        })

        caregiver_notified = False
        caregiver_name = "Assigned Caregiver"

        # 2. If missed, send alert to caregiver!
        if status_val == "missed":
            caregiver_msg = f"{elderly_name} indicated they missed taking {medicine_name} ({dosage}) scheduled for {intake_time}. Please check on them immediately."

            alert_doc = {
                "elderly_id": str(profile["_id"]),
                "elderly_user_id": user["id"],
                "elderly_name": elderly_name,
                "target_role": "caregiver",
                "title": f"🚨 ALERT: Missed Medication - {elderly_name}",
                "message": caregiver_msg,
                "type": "alert",
                "status": "unread",
                "created_at": now_iso
            }

            if caregiver_id:
                alert_doc["caregiver_id"] = caregiver_id
                try:
                    cg = caregivers_collection.find_one({"_id": ObjectId(caregiver_id)})
                    if cg:
                        caregiver_name = cg.get("name") or cg.get("full_name") or caregiver_name
                        if cg.get("user_id"):
                            alert_doc["user_id"] = str(cg["user_id"])
                except Exception:
                    pass

            notifications_collection.insert_one(alert_doc)
            caregiver_notified = True

        return {
            "status": status_val,
            "medicine_name": medicine_name,
            "caregiver_notified": caregiver_notified,
            "caregiver_name": caregiver_name,
            "message": "Dose logged as TAKEN." if status_val == "taken" else f"ALERT SENT TO CAREGIVER ({caregiver_name})."
        }

    @staticmethod
    def delete_medication(user: Dict[str, Any], med_id: str) -> Dict[str, str]:
        try:
            obj_id = ObjectId(med_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid medication ID.")

        result = medications_collection.delete_one({"_id": obj_id, "user_id": user["id"]})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Medication record not found.")
        return {"message": "Medication removed successfully.", "id": med_id}


    # --- Emergency Contacts ---

    @staticmethod
    def list_emergency_contacts(user: Dict[str, Any]) -> List[Dict[str, Any]]:
        docs = list(emergency_contacts_collection.find({"user_id": user["id"]}).sort("contact_type", 1))
        return [_serialize_contact(d) for d in docs]

    @staticmethod
    def add_emergency_contact(user: Dict[str, Any], payload: EmergencyContactCreate) -> Dict[str, Any]:
        existing = list(emergency_contacts_collection.find({"user_id": user["id"]}))
        if len(existing) >= 2:
            raise HTTPException(
                status_code=400,
                detail="You can only have up to 2 emergency contacts (Primary and Secondary)."
            )
        # Check if contact_type already exists
        type_exists = any(c.get("contact_type") == payload.contact_type for c in existing)
        if type_exists:
            raise HTTPException(
                status_code=400,
                detail=f"A '{payload.contact_type}' emergency contact already exists. Please edit or delete it first."
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": user["id"],
            "contact_type": payload.contact_type,
            "name": payload.name.strip(),
            "relationship": payload.relationship.strip(),
            "phone": payload.phone,
            "alt_phone": payload.alt_phone or "",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        result = emergency_contacts_collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return _serialize_contact(doc)

    @staticmethod
    def update_emergency_contact(user: Dict[str, Any], contact_id: str, payload: EmergencyContactUpdate) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(contact_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid contact ID.")

        doc = emergency_contacts_collection.find_one({"_id": obj_id, "user_id": user["id"]})
        if not doc:
            raise HTTPException(status_code=404, detail="Emergency contact not found.")

        updates: Dict[str, Any] = {}
        if payload.name is not None:
            updates["name"] = payload.name.strip()
        if payload.relationship is not None:
            updates["relationship"] = payload.relationship.strip()
        if payload.phone is not None:
            updates["phone"] = payload.phone
        if payload.alt_phone is not None:
            updates["alt_phone"] = payload.alt_phone

        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        emergency_contacts_collection.update_one({"_id": obj_id}, {"$set": updates})
        updated = emergency_contacts_collection.find_one({"_id": obj_id})
        return _serialize_contact(updated)

    @staticmethod
    def delete_emergency_contact(user: Dict[str, Any], contact_id: str) -> Dict[str, str]:
        try:
            obj_id = ObjectId(contact_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid contact ID.")

        result = emergency_contacts_collection.delete_one({"_id": obj_id, "user_id": user["id"]})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Emergency contact not found.")
        return {"message": "Emergency contact removed successfully.", "id": contact_id}

    # --- Caregiver View (Read-Only) ---

    @staticmethod
    def get_my_caregiver(user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns the admin-assigned caregiver. Reads from the admin-managed
        elderly_profiles and caregiver_profiles. Never duplicates or modifies assignment.
        """
        profile = _get_elderly_profile(user["id"])
        caregiver_id = profile.get("assigned_caregiver_id")

        if not caregiver_id:
            return {
                "is_assigned": False,
                "caregiver_id": None,
                "caregiver_name": "Not Assigned",
                "phone": "",
                "assigned_date": None,
            }

        phone = ""
        try:
            cg_doc = caregivers_collection.find_one({"user_id": caregiver_id})
            if not cg_doc:
                cg_doc = caregivers_collection.find_one({"_id": ObjectId(caregiver_id)})
            if cg_doc:
                phone = cg_doc.get("phone", "")
            else:
                # Fallback to users collection
                cg_user = users_collection.find_one({"_id": ObjectId(caregiver_id)})
                if cg_user:
                    phone = cg_user.get("phone", "")
        except Exception:
            pass

        return {
            "is_assigned": True,
            "caregiver_id": caregiver_id,
            "caregiver_name": profile.get("assigned_caregiver_name", "Assigned Caregiver"),
            "phone": phone,
            "assigned_date": profile.get("assigned_caregiver_date") or profile.get("updatedAt"),
        }

    # --- Daily Wellness Check-In ---

    @staticmethod
    def get_today_checkin(user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        today_str = date.today().isoformat()
        doc = wellness_checkins_collection.find_one({"user_id": user["id"], "date": today_str})
        if doc:
            return _serialize_checkin(doc)
        return None

    @staticmethod
    def submit_checkin(user: Dict[str, Any], payload: CheckInCreate) -> Dict[str, Any]:
        # Duplicate prevention — one check-in per user per day
        existing = wellness_checkins_collection.find_one({"user_id": user["id"], "date": payload.date})
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"You have already completed your wellness check-in for {payload.date}. Come back tomorrow!"
            )

        data = payload.model_dump()
        # Compute wellness risk via mock service (swap body of _mock_compute_wellness_risk for real ML call)
        wellness_risk = _mock_compute_wellness_risk(data)

        now_iso = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": user["id"],
            "date": payload.date,
            "medication_taken": payload.medication_taken,
            "appetite": payload.appetite,
            "sleep_quality": payload.sleep_quality,
            "mobility_difficulty": payload.mobility_difficulty,
            "mood": payload.mood,
            "symptoms": payload.symptoms or "",
            "notes": payload.notes or "",
            "wellness_risk": wellness_risk,
            "created_at": now_iso,
        }
        result = wellness_checkins_collection.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Also update risk_level on elderly profile for dashboard display
        profile = _get_elderly_profile(user["id"])
        elderly_collection.update_one(
            {"_id": profile["_id"]},
            {"$set": {"risk_level": wellness_risk, "updatedAt": now_iso}}
        )

        return _serialize_checkin(doc)

    # --- Wellness History ---

    @staticmethod
    def get_wellness_history(user: Dict[str, Any], page: int = 1, limit: int = 20) -> Dict[str, Any]:
        total = wellness_checkins_collection.count_documents({"user_id": user["id"]})
        skip = (max(page, 1) - 1) * limit
        docs = list(
            wellness_checkins_collection.find({"user_id": user["id"]})
            .sort("date", -1)
            .skip(skip)
            .limit(limit)
        )
        return {
            "checkins": [_serialize_checkin(d) for d in docs],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total / limit) if limit > 0 else 1,
        }

    # --- Notifications ---

    @staticmethod
    def get_notifications(user: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Reads admin-sent notifications targeted at 'all' or 'Elderly' role."""
        docs = list(
            notifications_collection.find({
                "$or": [
                    {"target_role": "all"},
                    {"target_role": {"$regex": "^elderly$", "$options": "i"}},
                ]
            })
            .sort("created_at", -1)
            .limit(30)
        )
        return [
            {
                "id": str(d["_id"]),
                "title": d.get("title", ""),
                "message": d.get("message", ""),
                "type": d.get("type", "announcement"),
                "created_at": d.get("created_at", ""),
            }
            for d in docs
        ]

    # --- Notification Preferences ---

    @staticmethod
    def update_notification_prefs(user: Dict[str, Any], payload: NotificationPrefsUpdate) -> Dict[str, Any]:
        profile = _get_elderly_profile(user["id"])
        profile_id = profile["_id"]
        existing_prefs = profile.get("notification_prefs", {"checkin_reminder": True, "medication_reminder": True})

        updates = {**existing_prefs}
        if payload.checkin_reminder is not None:
            updates["checkin_reminder"] = payload.checkin_reminder
        if payload.medication_reminder is not None:
            updates["medication_reminder"] = payload.medication_reminder

        elderly_collection.update_one(
            {"_id": profile_id},
            {"$set": {"notification_prefs": updates, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
        return updates

    # --- Change Password ---

    @staticmethod
    def change_password(user: Dict[str, Any], payload: ChangePasswordRequest) -> Dict[str, str]:
        user_doc = users_collection.find_one({"_id": ObjectId(user["id"])})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User account not found.")

        hashed = user_doc.get("hashed_password") or user_doc.get("passwordHash")
        if not hashed or not verify_password(payload.current_password, hashed):
            raise HTTPException(status_code=400, detail="Current password is incorrect. Please try again.")

        new_hash = get_password_hash(payload.new_password)
        users_collection.update_one(
            {"_id": ObjectId(user["id"])},
            {"$set": {"hashed_password": new_hash, "passwordHash": new_hash}}
        )
        return {"message": "Your password has been updated successfully."}

    # --- Mark Setup Complete ---

    @staticmethod
    def mark_setup_complete(user: Dict[str, Any]) -> Dict[str, Any]:
        profile = _get_elderly_profile(user["id"])
        elderly_collection.update_one(
            {"_id": profile["_id"]},
            {"$set": {"setup_complete": True, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
        updated = elderly_collection.find_one({"_id": profile["_id"]})
        return _serialize_profile(updated, user)
