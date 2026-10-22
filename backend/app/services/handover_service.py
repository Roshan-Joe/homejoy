"""
Caregiver Handover Notes Service
Allows departing caregivers to securely log clinical shift transition notes,
patient behavioral changes, pending medication checks, and action items for the incoming team.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from app.database import db

handover_collection = db["handover_notes"]

class HandoverService:

    @staticmethod
    def create_handover(caregiver_user: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        doc = {
            "caregiver_id": caregiver_user["id"],
            "caregiver_name": caregiver_user.get("full_name") or caregiver_user.get("name", "Caregiver"),
            "shift": payload.get("shift", "Day Shift"),
            "incoming_caregiver": payload.get("incoming_caregiver", "Next Shift Care Team"),
            "resident_highlights": payload.get("resident_highlights", ""),
            "vitals_concerns": payload.get("vitals_concerns", "All logged resident vitals within expected baseline tolerances."),
            "action_items": payload.get("action_items", ""),
            "flagged_resident_ids": payload.get("flagged_resident_ids", []),
            "created_at": now_iso
        }
        res = handover_collection.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def get_handovers(limit: int = 15) -> List[Dict[str, Any]]:
        docs = list(handover_collection.find().sort("created_at", -1).limit(limit))
        return [
            {
                "id": str(d["_id"]),
                "caregiver_name": d.get("caregiver_name", "Caregiver"),
                "shift": d.get("shift", "Day Shift"),
                "incoming_caregiver": d.get("incoming_caregiver", "Next Shift"),
                "resident_highlights": d.get("resident_highlights", ""),
                "vitals_concerns": d.get("vitals_concerns", ""),
                "action_items": d.get("action_items", ""),
                "created_at": d.get("created_at")
            }
            for d in docs
        ]
