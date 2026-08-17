from datetime import datetime, timezone
from typing import Dict, Any, Optional

def serialize_user_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Serializes a raw MongoDB user document into a standardized dictionary
    compatible with frontend requirements and Pydantic response schemas.
    """
    if not doc:
        return {}
    
    user_id = str(doc.get("_id"))
    full_name = doc.get("name") or doc.get("full_name") or "Unnamed User"
    email = doc.get("email", "")
    phone = doc.get("phone", "")
    role = doc.get("role", "Elderly")
    
    # Handle status (support boolean is_active and string status)
    if "is_active" in doc:
        is_active = bool(doc.get("is_active"))
    elif "status" in doc:
        is_active = str(doc.get("status")).lower() == "active"
    else:
        is_active = True
        
    status_str = "active" if is_active else "inactive"
    profile_image = doc.get("profileImage") or doc.get("profile_image") or ""
    google_id = doc.get("googleId") or doc.get("google_id") or None
    created_at = doc.get("createdAt") or doc.get("created_at") or datetime.now(timezone.utc).isoformat()
    updated_at = doc.get("updatedAt") or doc.get("updated_at") or datetime.now(timezone.utc).isoformat()
    
    return {
        "id": user_id,
        "name": full_name,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "role": role,
        "status": status_str,
        "is_active": is_active,
        "profileImage": profile_image,
        "googleId": google_id,
        "createdAt": created_at,
        "updatedAt": updated_at
    }
