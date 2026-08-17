from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

def serialize_caregiver_doc(doc: Dict[str, Any], user_doc: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Serializes a raw MongoDB caregiver_profiles document and merges associated user fields.
    """
    if not doc and not user_doc:
        return {}

    user_info = user_doc or {}
    user_id = str(user_info.get("_id")) if user_info else str(doc.get("user_id", ""))

    full_name = doc.get("name") or user_info.get("full_name") or user_info.get("name") or "Caregiver Staff"
    email = doc.get("email") or user_info.get("email") or ""
    phone = doc.get("phone") or user_info.get("phone") or ""

    assigned_elderly_ids = doc.get("assigned_elderly_ids", [])
    assigned_elderly_names = doc.get("assigned_elderly_names", [])

    rating = float(doc.get("performance_rating", 4.8))

    return {
        "id": str(doc.get("_id")) if "_id" in doc else user_id,
        "user_id": user_id,
        "name": full_name,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "qualification": doc.get("qualification", "Certified Nursing Assistant (CNA)"),
        "experience_years": doc.get("experience_years", 4),
        "shift": doc.get("shift", "Day"),
        "status": doc.get("status", "Active"),
        "assigned_elderly_ids": [str(eid) for eid in assigned_elderly_ids],
        "assigned_elderly_names": assigned_elderly_names,
        "daily_reports_submitted": doc.get("daily_reports_submitted", 0),
        "performance_rating": rating,
        "profileImage": doc.get("profileImage") or user_info.get("profileImage") or "",
        "createdAt": doc.get("createdAt") or doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updatedAt": doc.get("updatedAt") or doc.get("updated_at") or datetime.now(timezone.utc).isoformat()
    }

def serialize_daily_report_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}

    return {
        "id": str(doc.get("_id")),
        "caregiver_id": str(doc.get("caregiver_id", "")),
        "caregiver_name": doc.get("caregiver_name", "Caregiver"),
        "elderly_id": str(doc.get("elderly_id", "")),
        "elderly_name": doc.get("elderly_name", "Elderly Patient"),
        "report_date": doc.get("report_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "blood_pressure": doc.get("blood_pressure", "120/80"),
        "heart_rate": doc.get("heart_rate", 72),
        "temperature": doc.get("temperature", 98.6),
        "meal_notes": doc.get("meal_notes", "Meals eaten fully."),
        "medication_administered": bool(doc.get("medication_administered", True)),
        "general_observations": doc.get("general_observations", "Patient is in good spirits."),
        "created_at": doc.get("created_at") or datetime.now(timezone.utc).isoformat()
    }
