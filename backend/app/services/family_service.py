import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import family_collection, users_collection, elderly_collection
from app.models.family_model import serialize_family_doc, serialize_emergency_summary_doc
from app.models.user_model import serialize_user_doc
from app.schemas.family_schema import (
    FamilyCreateSchema, FamilyUpdateSchema, FamilyLinkElderlySchema
)
from app.security import get_password_hash

class FamilyService:

    @staticmethod
    def get_all_family_members(
        search: Optional[str] = None,
        relationship: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Retrieves paginated, searched, and filtered family member profiles.
        """
        query: Dict[str, Any] = {}

        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"name": {"$regex": s, "$options": "i"}},
                {"full_name": {"$regex": s, "$options": "i"}},
                {"email": {"$regex": s, "$options": "i"}},
                {"phone": {"$regex": s, "$options": "i"}},
                {"relationship": {"$regex": s, "$options": "i"}}
            ]

        if relationship and relationship != "all":
            query["relationship"] = {"$regex": f"^{relationship.strip()}$", "$options": "i"}

        if status_filter and status_filter != "all":
            query["status"] = {"$regex": f"^{status_filter.strip()}$", "$options": "i"}

        total = family_collection.count_documents(query)

        # Fallback: if no documents in family_collection, auto-seed from users where role="Family Member"
        if total == 0 and not search and not relationship and not status_filter:
            users_cursor = users_collection.find({"role": {"$regex": "^family member$", "$options": "i"}})
            for u in users_cursor:
                now_iso = datetime.now(timezone.utc).isoformat()
                profile_doc = {
                    "user_id": str(u["_id"]),
                    "name": u.get("full_name") or u.get("name", "Family Member"),
                    "email": u.get("email", ""),
                    "phone": u.get("phone", ""),
                    "relationship": "Son",
                    "is_primary_contact": True,
                    "status": "Active",
                    "linked_elderly_ids": [],
                    "linked_elderly_names": [],
                    "createdAt": now_iso,
                    "updatedAt": now_iso
                }
                family_collection.insert_one(profile_doc)
            total = family_collection.count_documents(query)

        total_pages = math.ceil(total / limit) if limit > 0 else 1
        skip = (max(page, 1) - 1) * limit

        cursor = family_collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)

        family_list = []
        for doc in cursor:
            user_doc = None
            if doc.get("user_id"):
                try:
                    user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
                except Exception:
                    pass
            family_list.append(serialize_family_doc(doc, user_doc))

        return {
            "family_members": family_list,
            "total": total,
            "page": max(page, 1),
            "limit": limit,
            "total_pages": max(total_pages, 1)
        }

    @staticmethod
    def get_family_member_by_id(family_id: str) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(family_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        doc = family_collection.find_one({"_id": obj_id})
        if not doc:
            doc = family_collection.find_one({"user_id": family_id})
            if not doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member profile not found")

        user_doc = None
        if doc.get("user_id"):
            try:
                user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
            except Exception:
                pass

        return serialize_family_doc(doc, user_doc)

    @staticmethod
    def create_family_member(payload: FamilyCreateSchema) -> Dict[str, Any]:
        email_clean = payload.email.lower().strip()
        existing_user = users_collection.find_one({"email": email_clean})

        now_iso = datetime.now(timezone.utc).isoformat()

        if existing_user:
            user_id = str(existing_user["_id"])
            users_collection.update_one({"_id": existing_user["_id"]}, {"$set": {"role": "Family Member"}})
        else:
            hashed_pwd = get_password_hash(payload.password or "password123")
            user_doc = {
                "name": payload.name.strip(),
                "full_name": payload.name.strip(),
                "email": email_clean,
                "phone": payload.phone or "",
                "passwordHash": hashed_pwd,
                "hashed_password": hashed_pwd,
                "role": "Family Member",
                "status": "active",
                "is_active": True,
                "createdAt": now_iso,
                "created_at": now_iso
            }
            res_u = users_collection.insert_one(user_doc)
            user_id = str(res_u.inserted_id)

        existing_prof = family_collection.find_one({"email": email_clean})
        if existing_prof:
            raise HTTPException(status_code=400, detail="Family member profile with this email already exists.")

        profile_doc = {
            "user_id": user_id,
            "name": payload.name.strip(),
            "full_name": payload.name.strip(),
            "email": email_clean,
            "phone": payload.phone or "",
            "relationship": payload.relationship,
            "is_primary_contact": payload.is_primary_contact,
            "status": payload.status,
            "linked_elderly_ids": [],
            "linked_elderly_names": [],
            "createdAt": now_iso,
            "created_at": now_iso,
            "updatedAt": now_iso,
            "updated_at": now_iso
        }

        res_p = family_collection.insert_one(profile_doc)
        profile_doc["_id"] = res_p.inserted_id
        return serialize_family_doc(profile_doc)

    @staticmethod
    def update_family_member(family_id: str, payload: FamilyUpdateSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(family_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        existing = family_collection.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member profile not found")

        updates: Dict[str, Any] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if payload.name is not None:
            updates["name"] = payload.name.strip()
            updates["full_name"] = payload.name.strip()

        if payload.phone is not None:
            updates["phone"] = payload.phone.strip()

        if payload.relationship is not None:
            updates["relationship"] = payload.relationship

        if payload.is_primary_contact is not None:
            updates["is_primary_contact"] = payload.is_primary_contact

        if payload.status is not None:
            updates["status"] = payload.status

        updates["updatedAt"] = now_iso

        if updates:
            family_collection.update_one({"_id": obj_id}, {"$set": updates})

        updated_doc = family_collection.find_one({"_id": obj_id})
        return serialize_family_doc(updated_doc)

    @staticmethod
    def link_elderly_to_family(family_id: str, payload: FamilyLinkElderlySchema) -> Dict[str, Any]:
        try:
            fam_obj_id = ObjectId(family_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Family Member ID format")

        family_doc = family_collection.find_one({"_id": fam_obj_id})
        if not family_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member profile not found")

        elderly_id_str = payload.elderly_id.strip()
        try:
            eld_obj_id = ObjectId(elderly_id_str)
            elderly_doc = elderly_collection.find_one({"_id": eld_obj_id})
        except Exception:
            elderly_doc = elderly_collection.find_one({"user_id": elderly_id_str})

        if not elderly_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly resident profile not found")

        eld_id = str(elderly_doc["_id"])
        eld_name = elderly_doc.get("name") or elderly_doc.get("full_name", "Elderly Resident")

        linked_ids = family_doc.get("linked_elderly_ids", [])
        linked_names = family_doc.get("linked_elderly_names", [])

        if eld_id not in linked_ids:
            linked_ids.append(eld_id)
            linked_names.append(eld_name)

        now_iso = datetime.now(timezone.utc).isoformat()
        family_collection.update_one(
            {"_id": fam_obj_id},
            {"$set": {
                "linked_elderly_ids": linked_ids,
                "linked_elderly_names": linked_names,
                "updatedAt": now_iso
            }}
        )

        # Update elderly emergency contacts array bi-directionally
        emergency_contacts = elderly_doc.get("emergency_contacts", [])
        contact_entry = {
            "name": family_doc.get("name") or family_doc.get("full_name", "Family Member"),
            "relationship": family_doc.get("relationship", "Family Member"),
            "phone": family_doc.get("phone", ""),
            "email": family_doc.get("email", ""),
            "is_primary_contact": family_doc.get("is_primary_contact", True)
        }

        # Check if already present
        exists = any(c.get("phone") == contact_entry["phone"] or c.get("name") == contact_entry["name"] for c in emergency_contacts)
        if not exists:
            emergency_contacts.append(contact_entry)
            elderly_collection.update_one(
                {"_id": elderly_doc["_id"]},
                {"$set": {"emergency_contacts": emergency_contacts, "updatedAt": now_iso}}
            )

        updated_family = family_collection.find_one({"_id": fam_obj_id})
        return serialize_family_doc(updated_family)

    @staticmethod
    def unlink_elderly_from_family(family_id: str, payload: FamilyLinkElderlySchema) -> Dict[str, Any]:
        try:
            fam_obj_id = ObjectId(family_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Family Member ID format")

        family_doc = family_collection.find_one({"_id": fam_obj_id})
        if not family_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member profile not found")

        elderly_id_str = payload.elderly_id.strip()

        linked_ids = family_doc.get("linked_elderly_ids", [])
        linked_names = family_doc.get("linked_elderly_names", [])

        new_ids = []
        new_names = []
        for i, id_val in enumerate(linked_ids):
            if id_val != elderly_id_str:
                new_ids.append(id_val)
                if i < len(linked_names):
                    new_names.append(linked_names[i])

        now_iso = datetime.now(timezone.utc).isoformat()
        family_collection.update_one(
            {"_id": fam_obj_id},
            {"$set": {
                "linked_elderly_ids": new_ids,
                "linked_elderly_names": new_names,
                "updatedAt": now_iso
            }}
        )

        updated_family = family_collection.find_one({"_id": fam_obj_id})
        return serialize_family_doc(updated_family)

    @staticmethod
    def get_emergency_summary(family_id: str) -> List[Dict[str, Any]]:
        try:
            fam_obj_id = ObjectId(family_id)
            fam_doc = family_collection.find_one({"_id": fam_obj_id})
        except Exception:
            fam_doc = family_collection.find_one({"user_id": family_id})

        if not fam_doc:
            raise HTTPException(status_code=404, detail="Family member profile not found")

        linked_ids = fam_doc.get("linked_elderly_ids", [])
        summary_list = []

        for eld_id_str in linked_ids:
            try:
                eld_obj = elderly_collection.find_one({"_id": ObjectId(eld_id_str)})
            except Exception:
                eld_obj = elderly_collection.find_one({"user_id": eld_id_str})

            if eld_obj:
                # Find all family members linked to this elderly resident
                family_cursor = family_collection.find({"linked_elderly_ids": str(eld_obj["_id"])})
                f_contacts = []
                for f in family_cursor:
                    f_contacts.append({
                        "name": f.get("name") or f.get("full_name", "Family Member"),
                        "relationship": f.get("relationship", "Family Member"),
                        "phone": f.get("phone", ""),
                        "email": f.get("email", ""),
                        "is_primary_contact": bool(f.get("is_primary_contact", True))
                    })

                summary_list.append(serialize_emergency_summary_doc(eld_obj, f_contacts))

        return summary_list

    @staticmethod
    def delete_family_member(family_id: str) -> Dict[str, str]:
        try:
            obj_id = ObjectId(family_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        res = family_collection.delete_one({"_id": obj_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member profile not found")

        return {"message": "Family member profile deleted successfully", "id": family_id}
