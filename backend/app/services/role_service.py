from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import roles_collection, users_collection
from app.models.role_model import DEFAULT_SYSTEM_ROLES, ALL_AVAILABLE_PERMISSIONS, serialize_role_doc
from app.models.user_model import serialize_user_doc
from app.schemas.role_schema import RolePermissionsUpdateSchema, UserRoleChangeSchema

class RoleService:

    @staticmethod
    def seed_default_roles() -> List[Dict[str, Any]]:
        """
        Seeds default RBAC system roles into MongoDB if they do not exist.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        seeded = []

        for role_def in DEFAULT_SYSTEM_ROLES:
            existing = roles_collection.find_one({
                "role_name": {"$regex": f"^{role_def['role_name']}$", "$options": "i"}
            })

            if not existing:
                doc = {
                    "role_name": role_def["role_name"],
                    "description": role_def["description"],
                    "is_system_role": True,
                    "permissions": role_def["permissions"],
                    "createdAt": now_iso,
                    "created_at": now_iso,
                    "updatedAt": now_iso,
                    "updated_at": now_iso
                }
                res = roles_collection.insert_one(doc)
                doc["_id"] = res.inserted_id
                seeded.append(doc)

        return seeded

    @staticmethod
    def get_all_roles() -> List[Dict[str, Any]]:
        """
        Retrieves all roles along with real-time user counts per role.
        """
        # Ensure default roles exist
        RoleService.seed_default_roles()

        cursor = roles_collection.find()
        roles_list = []

        for r_doc in cursor:
            role_name = r_doc.get("role_name", "")
            user_count = users_collection.count_documents({
                "role": {"$regex": f"^{role_name}$", "$options": "i"}
            })
            roles_list.append(serialize_role_doc(r_doc, user_count=user_count))

        return roles_list

    @staticmethod
    def get_role_by_name(role_name: str) -> Dict[str, Any]:
        RoleService.seed_default_roles()
        role_doc = roles_collection.find_one({
            "role_name": {"$regex": f"^{role_name.strip()}$", "$options": "i"}
        })

        if not role_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role_name}' not found."
            )

        user_count = users_collection.count_documents({
            "role": {"$regex": f"^{role_doc.get('role_name')}$", "$options": "i"}
        })
        return serialize_role_doc(role_doc, user_count=user_count)

    @staticmethod
    def update_role_permissions(role_name: str, payload: RolePermissionsUpdateSchema) -> Dict[str, Any]:
        RoleService.seed_default_roles()
        role_doc = roles_collection.find_one({
            "role_name": {"$regex": f"^{role_name.strip()}$", "$options": "i"}
        })

        if not role_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role_name}' not found."
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        roles_collection.update_one(
            {"_id": role_doc["_id"]},
            {"$set": {
                "permissions": payload.permissions,
                "updatedAt": now_iso,
                "updated_at": now_iso
            }}
        )

        updated_doc = roles_collection.find_one({"_id": role_doc["_id"]})
        user_count = users_collection.count_documents({
            "role": {"$regex": f"^{role_doc.get('role_name')}$", "$options": "i"}
        })
        return serialize_role_doc(updated_doc, user_count=user_count)

    @staticmethod
    def assign_user_role(user_id: str, payload: UserRoleChangeSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format")

        user_doc = users_collection.find_one({"_id": obj_id})
        if not user_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Verify target role exists or seed
        target_role = payload.role.strip()
        RoleService.seed_default_roles()
        role_doc = roles_collection.find_one({
            "role_name": {"$regex": f"^{target_role}$", "$options": "i"}
        })

        if not role_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid target role '{target_role}'. Must be one of system roles."
            )

        canonical_role = role_doc["role_name"]
        now_iso = datetime.now(timezone.utc).isoformat()

        users_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "role": canonical_role,
                "updatedAt": now_iso,
                "updated_at": now_iso
            }}
        )

        updated_user = users_collection.find_one({"_id": obj_id})
        return serialize_user_doc(updated_user)

    @staticmethod
    def get_user_permissions(user_id: str) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format")

        user_doc = users_collection.find_one({"_id": obj_id})
        if not user_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user_role = user_doc.get("role", "Elderly")
        RoleService.seed_default_roles()
        role_doc = roles_collection.find_one({
            "role_name": {"$regex": f"^{user_role}$", "$options": "i"}
        })

        permissions = role_doc.get("permissions", []) if role_doc else []

        return {
            "user_id": str(user_doc["_id"]),
            "role": user_role,
            "permissions": permissions
        }

    @staticmethod
    def get_all_permissions_catalog() -> List[Dict[str, str]]:
        return ALL_AVAILABLE_PERMISSIONS
