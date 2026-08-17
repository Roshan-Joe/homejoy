from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

def serialize_family_doc(doc: Dict[str, Any], user_doc: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Serializes a raw MongoDB family_profiles document and merges associated user fields.
    """
    if not doc and not user_doc:
        return {}

    user_info = user_doc or {}
    user_id = str(user_info.get("_id")) if user_info else str(doc.get("user_id", ""))

    full_name = doc.get("name") or user_info.get("full_name") or user_info.get("name") or "Family Member"
    email = doc.get("email") or user_info.get("email") or ""
    phone = doc.get("phone") or user_info.get("phone") or ""

    linked_elderly_ids = doc.get("linked_elderly_ids", [])
    linked_elderly_names = doc.get("linked_elderly_names", [])

    return {
        "id": str(doc.get("_id")) if "_id" in doc else user_id,
        "user_id": user_id,
        "name": full_name,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "relationship": doc.get("relationship", "Son/Daughter"),
        "is_primary_contact": bool(doc.get("is_primary_contact", True)),
        "status": doc.get("status", "Active"),
        "linked_elderly_ids": [str(eid) for eid in linked_elderly_ids],
        "linked_elderly_names": linked_elderly_names,
        "profileImage": doc.get("profileImage") or user_info.get("profileImage") or "",
        "createdAt": doc.get("createdAt") or doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updatedAt": doc.get("updatedAt") or doc.get("updated_at") or datetime.now(timezone.utc).isoformat()
    }

def serialize_emergency_summary_doc(elderly_doc: Dict[str, Any], family_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not elderly_doc:
        return {}

    return {
        "elderly_id": str(elderly_doc.get("_id")),
        "elderly_name": elderly_doc.get("name") or elderly_doc.get("full_name", "Elderly Patient"),
        "age": elderly_doc.get("age", 75),
        "blood_group": elderly_doc.get("blood_group", "O+"),
        "risk_level": elderly_doc.get("risk_level", "Medium"),
        "risk_score": elderly_doc.get("risk_score", 45),
        "medical_conditions": elderly_doc.get("medical_conditions", []),
        "allergies": elderly_doc.get("allergies", []),
        "active_prescriptions": elderly_doc.get("active_prescriptions", []),
        "primary_caregiver_name": elderly_doc.get("assigned_caregiver_name", "Assigned Caregiver"),
        "primary_doctor_name": elderly_doc.get("assigned_doctor_name", "Assigned Doctor"),
        "family_contacts": family_list
    }
