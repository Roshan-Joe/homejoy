from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

def calculate_risk_level(score: float) -> str:
    if score >= 0.70:
        return "High"
    elif score >= 0.35:
        return "Medium"
    else:
        return "Low"

def compute_age_from_dob(dob: Optional[str]) -> Optional[int]:
    if not dob:
        return None
    try:
        birth = datetime.strptime(str(dob)[:10], "%Y-%m-%d").date()
        today = datetime.now(timezone.utc).date()
        return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
    except Exception:
        return None

def serialize_elderly_doc(doc: Dict[str, Any], user_doc: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Serializes a MongoDB elderly_profiles document and merges associated user fields.
    """
    if not doc and not user_doc:
        return {}

    user_info = user_doc or {}
    user_id = str(user_info.get("_id")) if user_info else str(doc.get("user_id", ""))
    
    full_name = doc.get("name") or user_info.get("full_name") or user_info.get("name") or "Unnamed Elderly Patient"
    email = doc.get("email") or user_info.get("email") or ""
    phone = doc.get("phone") or user_info.get("phone") or ""

    dob = doc.get("date_of_birth") or doc.get("dob")
    age = doc.get("age") or compute_age_from_dob(dob)

    ai_risk_score = float(doc.get("ai_risk_score", 0.10))
    risk_level = doc.get("risk_level") or calculate_risk_level(ai_risk_score)

    return {
        "id": str(doc.get("_id")) if "_id" in doc else user_id,
        "user_id": user_id,
        "name": full_name,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "age": age,
        "date_of_birth": dob,
        "gender": doc.get("gender") or "",
        "blood_group": doc.get("blood_group") or "",
        "setup_complete": bool(doc.get("setup_complete", False)),
        "district": doc.get("district", ""),
        "address": doc.get("address") or user_info.get("address") or "",
        "emergency_contact_name": doc.get("emergency_contact_name", ""),
        "emergency_contact_phone": doc.get("emergency_contact_phone", ""),
        "guardian_name": doc.get("guardian_name", ""),
        "guardian_relationship": doc.get("guardian_relationship", ""),
        "guardian_phone": doc.get("guardian_phone", ""),
        "guardian_email": doc.get("guardian_email", ""),
        "guardian_report_consent": bool(doc.get("guardian_report_consent", False)),
        "guardian_report_enabled": bool(doc.get("guardian_report_enabled", True) if doc.get("guardian_email") else False),
        "assigned_caregiver_id": doc.get("assigned_caregiver_id"),
        "assigned_caregiver_name": doc.get("assigned_caregiver_name") or "Not Assigned",
        "assigned_doctor_id": doc.get("assigned_doctor_id"),
        "assigned_doctor_name": doc.get("assigned_doctor_name") or "Not Assigned",
        "medical_conditions": doc.get("medical_conditions", []),
        "allergies": doc.get("allergies", []),
        "medications": doc.get("medications", []),
        "ai_risk_score": ai_risk_score,
        "risk_level": risk_level,
        "wellness_history": doc.get("wellness_history", []),
        "profileImage": doc.get("profileImage") or user_info.get("profileImage") or "",
        "createdAt": doc.get("createdAt") or doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updatedAt": doc.get("updatedAt") or doc.get("updated_at") or datetime.now(timezone.utc).isoformat()
    }
