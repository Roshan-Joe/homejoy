from datetime import datetime, timezone
from typing import Dict, Any, List

DEFAULT_SYSTEM_ROLES = [
    {
        "role_name": "Admin",
        "description": "Full system access, user administration, role management, audit logs, and system settings.",
        "is_system_role": True,
        "permissions": [
            "users:manage", "roles:manage", "elderly:manage", "caregivers:manage",
            "doctors:manage", "family:manage", "health:manage", "appointments:manage",
            "emergencies:manage", "notifications:manage", "ai:view", "reports:manage",
            "settings:manage", "audit:view"
        ]
    },
    {
        "role_name": "Elderly",
        "description": "Elderly user profile, daily wellness check-ins, appointment tracking, emergency button, and personal health insights.",
        "is_system_role": True,
        "permissions": [
            "profile:read_write", "health:read_write", "appointments:read_write",
            "notifications:read", "emergency:trigger", "ai_insights:read"
        ]
    },
    {
        "role_name": "Caregiver",
        "description": "Caregiver portal, assigned elderly management, daily health log entry, emergency response, and notifications.",
        "is_system_role": True,
        "permissions": [
            "assigned_elderly:read_write", "health_records:write", "daily_reports:write",
            "appointments:read", "emergencies:respond", "notifications:read_write"
        ]
    },
    {
        "role_name": "Doctor",
        "description": "Medical professional access, patient medical notes, prescription management, appointment scheduling, and AI risk prediction reviews.",
        "is_system_role": True,
        "permissions": [
            "assigned_patients:read_write", "medical_notes:read_write", "prescriptions:manage",
            "appointments:manage", "ai_predictions:read"
        ]
    },
    {
        "role_name": "Family Member",
        "description": "Family relative access for linked elderly health monitoring, emergency alert notifications, and summary reports.",
        "is_system_role": True,
        "permissions": [
            "linked_elderly:read", "health_summary:read", "notifications:read",
            "emergency_alerts:read", "contact:update"
        ]
    }
]

ALL_AVAILABLE_PERMISSIONS = [
    {"key": "users:manage", "label": "User Management (CRUD)", "category": "Administration"},
    {"key": "roles:manage", "label": "Role & Permissions Management", "category": "Administration"},
    {"key": "audit:view", "label": "View System Audit Logs", "category": "Administration"},
    {"key": "settings:manage", "label": "System Settings & Database Config", "category": "Administration"},

    {"key": "elderly:manage", "label": "Elderly Profile & Record Management", "category": "Care & Health"},
    {"key": "caregivers:manage", "label": "Caregiver Assignments & Reviews", "category": "Care & Health"},
    {"key": "doctors:manage", "label": "Doctor Appointments & Clinical Notes", "category": "Care & Health"},
    {"key": "family:manage", "label": "Family Member Connections", "category": "Care & Health"},
    {"key": "health:manage", "label": "Health Monitoring & Vital Logs", "category": "Care & Health"},

    {"key": "appointments:manage", "label": "Appointment Scheduling & Status", "category": "Operations"},
    {"key": "emergencies:manage", "label": "Emergency Alert Handling & SOS", "category": "Operations"},
    {"key": "notifications:manage", "label": "Broadcast & SMS/Push Notifications", "category": "Operations"},

    {"key": "ai:view", "label": "AI Risk Prediction Dashboard & Reports", "category": "AI Analytics"},
    {"key": "reports:manage", "label": "Export PDF/CSV Reports & Analytics", "category": "AI Analytics"}
]

def serialize_role_doc(doc: Dict[str, Any], user_count: int = 0) -> Dict[str, Any]:
    """
    Serializes a raw MongoDB role document into a dictionary format.
    """
    if not doc:
        return {}

    return {
        "id": str(doc.get("_id")),
        "role_name": doc.get("role_name", ""),
        "description": doc.get("description", ""),
        "is_system_role": bool(doc.get("is_system_role", True)),
        "permissions": doc.get("permissions", []),
        "user_count": user_count,
        "createdAt": doc.get("createdAt") or doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "updatedAt": doc.get("updatedAt") or doc.get("updated_at") or datetime.now(timezone.utc).isoformat()
    }
