from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database import (
    help_requests_collection,
    elderly_collection,
    caregivers_collection,
    alerts_collection,
    notifications_collection
)
from app.schemas.help_request_schema import HelpRequestCreate

class HelpRequestService:

    @staticmethod
    def create_help_request(user_id: str, payload: HelpRequestCreate) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()

        # Find elderly profile
        elderly_doc = elderly_collection.find_one({"user_id": user_id})
        if not elderly_doc:
            elderly_doc = elderly_collection.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None

        if not elderly_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly profile not found.")

        elderly_id = str(elderly_doc["_id"])
        elderly_name = elderly_doc.get("full_name") or elderly_doc.get("name", "Elderly Resident")
        cg_id = elderly_doc.get("assigned_caregiver_id")
        cg_name = elderly_doc.get("assigned_caregiver_name", "Assigned Caregiver")

        if not cg_id or cg_name == "Not Assigned":
            # Fallback: check if any caregiver has this elderly in assigned_elderly_ids
            cg_doc = caregivers_collection.find_one({
                "$or": [
                    {"assigned_elderly_ids": elderly_id},
                    {"assigned_elderly_ids": user_id}
                ]
            })
            if cg_doc:
                cg_id = str(cg_doc["_id"])
                cg_name = cg_doc.get("name", "Assigned Caregiver")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No caregiver is currently assigned to your account. Please contact your care team or system admin."
                )

        request_doc = {
            "user_id": user_id,
            "elderly_id": elderly_id,
            "elderly_name": elderly_name,
            "caregiver_id": str(cg_id),
            "caregiver_name": cg_name,
            "reason": payload.reason,
            "message": payload.message or "",
            "status": "Pending",
            "created_at": now_iso,
            "acknowledged_at": None,
            "resolved_at": None,
            "resolution_note": ""
        }

        res = help_requests_collection.insert_one(request_doc)
        request_doc["_id"] = str(res.inserted_id)
        request_doc["id"] = str(res.inserted_id)

        # ALSO trigger an urgent alert in alerts_collection for Caregiver dashboard
        alert_doc = {
            "alert_type": "Help Request",
            "severity": "High",
            "title": f"🚨 URGENT HELP REQUEST: {elderly_name}",
            "reason": f"Resident requested immediate assistance: '{payload.reason}'",
            "elderly_id": elderly_id,
            "elderly_name": elderly_name,
            "caregiver_id": str(cg_id),
            "help_request_id": str(res.inserted_id),
            "status": "Pending",
            "created_at": now_iso
        }
        alerts_collection.insert_one(alert_doc)

        return request_doc

    @staticmethod
    def get_elderly_help_requests(user_id: str) -> List[Dict[str, Any]]:
        cursor = help_requests_collection.find({"user_id": user_id}).sort("created_at", -1)
        requests = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            doc["_id"] = str(doc["_id"])
            requests.append(doc)
        return requests

    @staticmethod
    def get_caregiver_help_requests(cg_context: Dict[str, Any], status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        cg_id = cg_context["caregiver_id"]
        cg_user_id = cg_context["user_id"]
        assigned_ids = cg_context["assigned_elderly_ids"]

        query = {
            "$or": [
                {"caregiver_id": cg_id},
                {"caregiver_id": cg_user_id},
                {"elderly_id": {"$in": assigned_ids}},
                {"user_id": {"$in": assigned_ids}}
            ]
        }

        if status_filter and status_filter.lower() != "all":
            query["status"] = status_filter.capitalize()

        cursor = help_requests_collection.find(query).sort("created_at", -1)
        requests = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            doc["_id"] = str(doc["_id"])
            requests.append(doc)
        return requests

    @staticmethod
    def acknowledge_help_request(request_id: str, cg_context: Dict[str, Any]) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            req_obj = ObjectId(request_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid help request ID.")

        doc = help_requests_collection.find_one({"_id": req_obj})
        if not doc:
            raise HTTPException(status_code=404, detail="Help request not found.")

        # Update help request
        help_requests_collection.update_one(
            {"_id": req_obj},
            {"$set": {"status": "Acknowledged", "acknowledged_at": now_iso}}
        )
        # Update associated alert if exists
        alerts_collection.update_many(
            {"help_request_id": request_id},
            {"$set": {"status": "Acknowledged", "acknowledged_at": now_iso}}
        )

        doc["status"] = "Acknowledged"
        doc["acknowledged_at"] = now_iso
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        return doc

    @staticmethod
    def resolve_help_request(request_id: str, cg_context: Dict[str, Any], note: str = "") -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            req_obj = ObjectId(request_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid help request ID.")

        doc = help_requests_collection.find_one({"_id": req_obj})
        if not doc:
            raise HTTPException(status_code=404, detail="Help request not found.")

        # Update help request
        help_requests_collection.update_one(
            {"_id": req_obj},
            {"$set": {"status": "Resolved", "resolved_at": now_iso, "resolution_note": note}}
        )
        # Update associated alert if exists
        alerts_collection.update_many(
            {"help_request_id": request_id},
            {"$set": {"status": "Resolved", "resolved_at": now_iso, "resolution_note": note}}
        )

        doc["status"] = "Resolved"
        doc["resolved_at"] = now_iso
        doc["resolution_note"] = note
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        return doc
