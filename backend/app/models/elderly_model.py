from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

def calculate_risk_level(score: float) -> str:
    if score >= 0.70:
        return "High"
    elif score >= 0.35:
        return "Medium"
    else:
        return "Low"

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

    ai_risk_score = float(doc.get("ai_risk_score", 0.15))
    risk_level = doc.get("risk_level") or calculate_risk_level(ai_risk_score)

    return {
        "id": str(doc.get("_id")) if "_id" in doc else user_id,
        "user_id": user_id,
        "name": full_name,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "age": doc.get("age", 72),
        "date_of_birth": doc.get("date_of_birth") or doc.get("dob") or "1952-05-14",
        "gender": doc.get("gender", "Female"),
        "blood_group": doc.get("blood_group", "O+"),
        "address": doc.get("address") or user_info.get("address") or "",
        "emergency_contact_name": doc.get("emergency_contact_name", ""),
        "emergency_contact_phone": doc.get("emergency_contact_phone", ""),
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
