import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import users_collection
from app.models.user_model import serialize_user_doc
from app.schemas.user_schema import UserCreateSchema, UserUpdateSchema, UserStatusUpdateSchema
from app.security import get_password_hash

class UserService:

    @staticmethod
    def get_users(
        search: Optional[str] = None,
        role: Optional[str] = None,
        status_filter: Optional[str] = None,
        sort_by: Optional[str] = "createdAt",
        sort_order: Optional[str] = "desc",
        page: int = 1,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Retrieves paginated, filtered, searched, and sorted users from MongoDB Atlas.
        """
        query: Dict[str, Any] = {}

        # Search by Name, Email, or Phone
        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"full_name": {"$regex": s, "$options": "i"}},
                {"name": {"$regex": s, "$options": "i"}},
                {"email": {"$regex": s, "$options": "i"}},
                {"phone": {"$regex": s, "$options": "i"}}
            ]

        # Filter by Role
        if role and role != "all":
            query["role"] = {"$regex": f"^{role.strip()}$", "$options": "i"}

        # Filter by Status
        if status_filter and status_filter != "all":
            sf = status_filter.strip().lower()
            if sf == "active":
                query["$or"] = [
                    {"is_active": True},
                    {"status": "active"},
                    {"is_active": {"$exists": False}, "status": {"$exists": False}}
                ]
            elif sf == "inactive":
                query["$or"] = [
                    {"is_active": False},
                    {"status": "inactive"}
                ]

        # Sorting logic
        direction = -1 if sort_order == "desc" else 1
        sort_field_map = {
            "name": "full_name",
            "email": "email",
            "role": "role",
            "status": "is_active",
            "createdAt": "created_at",
            "created_at": "created_at"
        }
        db_sort_field = sort_field_map.get(sort_by, "created_at")

        total_users = users_collection.count_documents(query)
        total_pages = math.ceil(total_users / limit) if limit > 0 else 1
        skip = (max(page, 1) - 1) * limit

        cursor = users_collection.find(query).sort(db_sort_field, direction).skip(skip).limit(limit)
        serialized_users = [serialize_user_doc(u) for u in cursor]

        return {
            "users": serialized_users,
            "total": total_users,
            "page": max(page, 1),
            "limit": limit,
            "total_pages": max(total_pages, 1)
        }

    @staticmethod
    def get_user_by_id(user_id: str) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format")

        user_doc = users_collection.find_one({"_id": obj_id})
        if not user_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return serialize_user_doc(user_doc)

    @staticmethod
    def create_user(user_data: UserCreateSchema) -> Dict[str, Any]:
        email_clean = user_data.email.lower().strip()
        existing = users_collection.find_one({"email": email_clean})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        hashed_password = get_password_hash(user_data.password)

        new_doc = {
            "name": user_data.name.strip(),
            "full_name": user_data.name.strip(),
            "email": email_clean,
            "phone": user_data.phone.strip() if user_data.phone else "",
            "passwordHash": hashed_password,
            "hashed_password": hashed_password,
            "role": user_data.role.value,
            "status": user_data.status.value,
            "is_active": user_data.status.value == "active",
            "profileImage": user_data.profileImage or "",
            "googleId": None,
            "createdAt": now_iso,
            "created_at": now_iso,
            "updatedAt": now_iso,
            "updated_at": now_iso
        }

        result = users_collection.insert_one(new_doc)
        new_doc["_id"] = result.inserted_id
        return serialize_user_doc(new_doc)

    @staticmethod
    def update_user(user_id: str, update_data: UserUpdateSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format")

        existing = users_collection.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        updates: Dict[str, Any] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if update_data.name is not None:
            updates["name"] = update_data.name.strip()
            updates["full_name"] = update_data.name.strip()

        if update_data.email is not None:
            email_clean = update_data.email.lower().strip()
            dup = users_collection.find_one({"email": email_clean, "_id": {"$ne": obj_id}})
            if dup:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already in use by another user.")
            updates["email"] = email_clean

        if update_data.phone is not None:
            updates["phone"] = update_data.phone.strip()

        if update_data.password is not None and update_data.password.strip():
            hashed_pwd = get_password_hash(update_data.password)
            updates["passwordHash"] = hashed_pwd
            updates["hashed_password"] = hashed_pwd

        if update_data.role is not None:
            updates["role"] = update_data.role.value

        if update_data.status is not None:
            updates["status"] = update_data.status.value
            updates["is_active"] = update_data.status.value == "active"

        if update_data.profileImage is not None:
            updates["profileImage"] = update_data.profileImage

        updates["updatedAt"] = now_iso
        updates["updated_at"] = now_iso

        if updates:
            users_collection.update_one({"_id": obj_id}, {"$set": updates})

        updated_doc = users_collection.find_one({"_id": obj_id})
        return serialize_user_doc(updated_doc)

    @staticmethod
    def update_user_status(user_id: str, status_data: UserStatusUpdateSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format")

        existing = users_collection.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        now_iso = datetime.now(timezone.utc).isoformat()
        
        is_active = True
        if status_data.is_active is not None:
            is_active = status_data.is_active
        elif status_data.status is not None:
            is_active = status_data.status.value == "active"

        status_str = "active" if is_active else "inactive"

        users_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "is_active": is_active,
                "status": status_str,
                "updatedAt": now_iso,
                "updated_at": now_iso
            }}
        )

        updated_doc = users_collection.find_one({"_id": obj_id})
        return serialize_user_doc(updated_doc)

    @staticmethod
    def delete_user(user_id: str) -> Dict[str, str]:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format")

        result = users_collection.delete_one({"_id": obj_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return {"message": "User deleted successfully", "id": user_id}
