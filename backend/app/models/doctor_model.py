from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

def serialize_doctor_doc(doc: Dict[str, Any], user_doc: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Serializes a raw MongoDB doctor_profiles document and merges associated user fields.
    """
    if not doc and not user_doc:
        return {}

    user_info = user_doc or {}
    user_id = str(user_info.get("_id")) if user_info else str(doc.get("user_id", ""))

    full_name = doc.get("name") or user_info.get("full_name") or user_info.get("name") or "Dr. Unnamed"
    email = doc.get("email") or user_info.get("email") or ""
    phone = doc.get("phone") or user_info.get("phone") or ""

    assigned_patient_ids = doc.get("assigned_patient_ids", [])
    assigned_patient_names = doc.get("assigned_patient_names", [])

    return {
        "id": str(doc.get("_id")) if "_id" in doc else user_id,
        "user_id": user_id,
        "name": full_name,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "specialization": doc.get("specialization", "Geriatrician"),
        "license_number": doc.get("license_number", "MD-10023"),
        "hospital_affiliation": doc.get("hospital_affiliation", "HomeJoy Medical Network"),
        "experience_years": doc.get("experience_years", 12),
        "status": doc.get("status", "Active"),
        "assigned_patient_ids": [str(pid) for pid in assigned_patient_ids],
        "assigned_patient_names": assigned_patient_names,
        "appointments_count": doc.get("appointments_count", 0),
        "profileImage": doc.get("profileImage") or user_info.get("profileImage") or "",
        "createdAt": doc.get("createdAt") or doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updatedAt": doc.get("updatedAt") or doc.get("updated_at") or datetime.now(timezone.utc).isoformat()
    }

def serialize_medical_note_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}

    return {
        "id": str(doc.get("_id")),
        "doctor_id": str(doc.get("doctor_id", "")),
        "doctor_name": doc.get("doctor_name", "Doctor"),
        "elderly_id": str(doc.get("elderly_id", "")),
        "elderly_name": doc.get("elderly_name", "Elderly Patient"),
        "note_date": doc.get("note_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "diagnosis": doc.get("diagnosis", "Routine Geriatric Checkup"),
        "clinical_notes": doc.get("clinical_notes", "Patient is in stable health."),
        "prescriptions": doc.get("prescriptions", []),
        "follow_up_date": doc.get("follow_up_date", None),
        "created_at": doc.get("created_at") or datetime.now(timezone.utc).isoformat()
    }
