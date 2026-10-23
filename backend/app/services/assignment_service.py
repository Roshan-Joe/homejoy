"""
Assignment Service - Single Source of Truth for Caregiver-Elderly Allocation.
Maintains elderly.assigned_caregiver_id as the authoritative assignment,
mirrors assigned_elderly_ids into caregiver_profiles,
enforces atomic conditional capacity checks,
logs immutable assignment history, and delivers caregiver in-app notifications.
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import (
    elderly_collection,
    caregivers_collection,
    users_collection,
    assignment_history_collection,
    notifications_collection
)
from app.models.elderly_model import serialize_elderly_doc


class AssignmentService:

    @staticmethod
    def _find_elderly(elderly_id: str) -> Dict[str, Any]:
        eld_clean = str(elderly_id).strip()
        doc = None
        if ObjectId.is_valid(eld_clean):
            doc = elderly_collection.find_one({"_id": ObjectId(eld_clean)})
        if not doc:
            doc = elderly_collection.find_one({"user_id": eld_clean})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Elderly resident profile not found for identifier '{elderly_id}'."
            )
        return doc

    @staticmethod
    def _find_caregiver(caregiver_id: str) -> Dict[str, Any]:
        cg_clean = str(caregiver_id).strip()
        doc = None
        if ObjectId.is_valid(cg_clean):
            doc = caregivers_collection.find_one({"_id": ObjectId(cg_clean)})
        if not doc:
            doc = caregivers_collection.find_one({"user_id": cg_clean})
        if not doc:
            # Fallback: check users collection
            if ObjectId.is_valid(cg_clean):
                u = users_collection.find_one({"_id": ObjectId(cg_clean)})
                if u and (u.get("role") or "").lower() == "caregiver":
                    doc = caregivers_collection.find_one({"user_id": str(u["_id"])})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Caregiver profile not found for identifier '{caregiver_id}'."
            )
        return doc

    @classmethod
    def assign(
        cls,
        elderly_id: str,
        caregiver_id: str,
        admin_user: Optional[Dict[str, Any]] = None,
        note: Optional[str] = ""
    ) -> Dict[str, Any]:
        """
        Assigns or reassigns an elderly resident to a designated caregiver.
        Guarantees capacity enforcement via atomic conditional update,
        rolls back if elderly update fails, maintains mirror list,
        logs history, and issues notifications.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        elderly_doc = cls._find_elderly(elderly_id)
        caregiver_doc = cls._find_caregiver(caregiver_id)

        eld_pk_str = str(elderly_doc["_id"])
        eld_name = elderly_doc.get("full_name") or elderly_doc.get("name", "Elderly Patient")

        cg_pk_str = str(caregiver_doc["_id"])
        cg_user_id = str(caregiver_doc.get("user_id") or cg_pk_str)
        cg_name = caregiver_doc.get("name") or caregiver_doc.get("full_name", "Caregiver Staff")

        # 1. Enforce caregiver active status
        cg_status = str(caregiver_doc.get("status", "Active")).strip().lower()
        if cg_status not in ["active", "available"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot assign client to caregiver '{cg_name}' because their status is '{caregiver_doc.get('status')}'. Only Active caregivers can accept assignments."
            )

        # 2. Idempotency check: Already assigned to this caregiver?
        current_assigned_id = elderly_doc.get("assigned_caregiver_id")
        if current_assigned_id and str(current_assigned_id) in [cg_pk_str, cg_user_id]:
            # Ensure mirror list contains resident
            caregivers_collection.update_one(
                {"_id": caregiver_doc["_id"]},
                {
                    "$addToSet": {"assigned_elderly_ids": eld_pk_str, "assigned_elderly_names": eld_name},
                    "$set": {"updatedAt": now_iso}
                }
            )
            updated_eld = elderly_collection.find_one({"_id": elderly_doc["_id"]})
            return serialize_elderly_doc(updated_eld)

        # 3. Conditional atomic capacity check on new caregiver
        max_patients = int(caregiver_doc.get("max_patients", 8))
        capacity_filter = {
            "_id": caregiver_doc["_id"],
            "$expr": {
                "$lt": [
                    {"$size": {"$ifNull": ["$assigned_elderly_ids", []]}},
                    {"$ifNull": ["$max_patients", max_patients]}
                ]
            }
        }
        capacity_update = {
            "$addToSet": {"assigned_elderly_ids": eld_pk_str, "assigned_elderly_names": eld_name},
            "$set": {"updatedAt": now_iso}
        }

        cg_update_res = caregivers_collection.update_one(capacity_filter, capacity_update)
        if cg_update_res.matched_count == 0:
            # Check why it matched 0: check if currently at or over capacity
            current_cg = caregivers_collection.find_one({"_id": caregiver_doc["_id"]})
            assigned_count = len(current_cg.get("assigned_elderly_ids", [])) if current_cg else max_patients
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Caregiver '{cg_name}' is at full capacity ({assigned_count}/{max_patients} clients assigned). Cannot assign additional residents."
            )

        # 4. Authoritative update on elderly document
        try:
            elderly_collection.update_one(
                {"_id": elderly_doc["_id"]},
                {
                    "$set": {
                        "assigned_caregiver_id": cg_user_id,
                        "assigned_caregiver_name": cg_name,
                        "updatedAt": now_iso
                    }
                }
            )
        except Exception as e:
            # Rollback addition to new caregiver
            caregivers_collection.update_one(
                {"_id": caregiver_doc["_id"]},
                {
                    "$pull": {"assigned_elderly_ids": eld_pk_str, "assigned_elderly_names": eld_name},
                    "$set": {"updatedAt": now_iso}
                }
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update resident assignment record: {str(e)}"
            )

        # 5. Remove resident from previous caregiver if reassigning
        if current_assigned_id and str(current_assigned_id) != "Not Assigned":
            old_conditions: List[Dict[str, Any]] = [
                {"user_id": str(current_assigned_id)},
                {"assigned_elderly_ids": eld_pk_str}
            ]
            if ObjectId.is_valid(str(current_assigned_id)):
                old_conditions.append({"_id": ObjectId(str(current_assigned_id))})

            caregivers_collection.update_many(
                {"$and": [{"_id": {"$ne": caregiver_doc["_id"]}}, {"$or": old_conditions}]},
                {
                    "$pull": {"assigned_elderly_ids": eld_pk_str, "assigned_elderly_names": eld_name},
                    "$set": {"updatedAt": now_iso}
                }
            )

        # 6. Audit logging in assignment_history collection
        admin_id = str(admin_user.get("id") or admin_user.get("_id") or "system_admin") if admin_user else "system_admin"
        admin_name = str(admin_user.get("full_name") or admin_user.get("name") or "Administrator") if admin_user else "System Admin"
        action_type = "reassign" if (current_assigned_id and str(current_assigned_id) != "Not Assigned") else "assign"

        history_doc = {
            "elderly_id": eld_pk_str,
            "elderly_name": eld_name,
            "from_caregiver_id": str(current_assigned_id) if current_assigned_id and str(current_assigned_id) != "Not Assigned" else None,
            "to_caregiver_id": cg_pk_str,
            "to_caregiver_user_id": cg_user_id,
            "to_caregiver_name": cg_name,
            "assigned_by": admin_id,
            "assigned_by_name": admin_name,
            "note": (note or "").strip(),
            "timestamp": now_iso,
            "action": action_type
        }
        assignment_history_collection.insert_one(history_doc)

        # 7. Deliver in-app notification to the new caregiver
        notifications_collection.insert_one({
            "user_id": cg_user_id,
            "target_role": "Caregiver",
            "title": "📋 New Client Assigned",
            "message": f"Resident {eld_name} has been assigned to your care roster.",
            "type": "system",
            "status": "unread",
            "created_at": now_iso,
            "created_by": admin_name
        })

        # On reassign, notify the previous caregiver
        if current_assigned_id and str(current_assigned_id) != "Not Assigned":
            notifications_collection.insert_one({
                "user_id": str(current_assigned_id),
                "target_role": "Caregiver",
                "title": "🔄 Client Reassigned",
                "message": f"Resident {eld_name} has been transferred to another caregiver ({cg_name}).",
                "type": "system",
                "status": "unread",
                "created_at": now_iso,
                "created_by": admin_name
            })

        updated_doc = elderly_collection.find_one({"_id": elderly_doc["_id"]})
        return serialize_elderly_doc(updated_doc)

    @classmethod
    def unassign(
        cls,
        elderly_id: str,
        admin_user: Optional[Dict[str, Any]] = None,
        note: Optional[str] = ""
    ) -> Dict[str, Any]:
        """
        Unassigns an elderly resident from their current caregiver.
        Sets elderly.assigned_caregiver_id to None, pulls resident from caregiver's list,
        writes history, and sends notification to departing caregiver.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        elderly_doc = cls._find_elderly(elderly_id)
        eld_pk_str = str(elderly_doc["_id"])
        eld_name = elderly_doc.get("full_name") or elderly_doc.get("name", "Elderly Patient")

        old_caregiver_id = elderly_doc.get("assigned_caregiver_id")

        if not old_caregiver_id or str(old_caregiver_id) == "Not Assigned":
            # Already unassigned
            return {
                "message": f"Resident '{eld_name}' is already unassigned.",
                "elderly": serialize_elderly_doc(elderly_doc)
            }

        # 1. Authoritative update on elderly document
        elderly_collection.update_one(
            {"_id": elderly_doc["_id"]},
            {
                "$set": {
                    "assigned_caregiver_id": None,
                    "assigned_caregiver_name": "Not Assigned",
                    "updatedAt": now_iso
                }
            }
        )

        # 2. Pull from old caregiver(s)
        old_conditions: List[Dict[str, Any]] = [
            {"user_id": str(old_caregiver_id)},
            {"assigned_elderly_ids": eld_pk_str}
        ]
        if ObjectId.is_valid(str(old_caregiver_id)):
            old_conditions.append({"_id": ObjectId(str(old_caregiver_id))})

        caregivers_collection.update_many(
            {"$or": old_conditions},
            {
                "$pull": {"assigned_elderly_ids": eld_pk_str, "assigned_elderly_names": eld_name},
                "$set": {"updatedAt": now_iso}
            }
        )

        # 3. Log history
        admin_id = str(admin_user.get("id") or admin_user.get("_id") or "system_admin") if admin_user else "system_admin"
        admin_name = str(admin_user.get("full_name") or admin_user.get("name") or "Administrator") if admin_user else "System Admin"

        history_doc = {
            "elderly_id": eld_pk_str,
            "elderly_name": eld_name,
            "from_caregiver_id": str(old_caregiver_id),
            "to_caregiver_id": None,
            "to_caregiver_name": None,
            "assigned_by": admin_id,
            "assigned_by_name": admin_name,
            "note": (note or "").strip(),
            "timestamp": now_iso,
            "action": "unassign"
        }
        assignment_history_collection.insert_one(history_doc)

        # 4. Notify departing caregiver
        notifications_collection.insert_one({
            "user_id": str(old_caregiver_id),
            "target_role": "Caregiver",
            "title": "⚠️ Client Unassigned",
            "message": f"Resident {eld_name} has been removed from your active care roster.",
            "type": "system",
            "status": "unread",
            "created_at": now_iso,
            "created_by": admin_name
        })

        updated_doc = elderly_collection.find_one({"_id": elderly_doc["_id"]})
        return {
            "message": f"Resident '{eld_name}' was successfully unassigned.",
            "elderly": serialize_elderly_doc(updated_doc)
        }
