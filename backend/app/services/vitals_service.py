from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from bson import ObjectId

from app.database import vitals_collection, elderly_collection
from app.schemas.vitals_schema import VitalsCreate

# IST Timezone UTC+5:30
IST = timezone(timedelta(hours=5, minutes=30))

def get_today_ist_str() -> str:
    return datetime.now(IST).strftime("%Y-%m-%d")

class VitalsService:

    @staticmethod
    def get_advisory_notes(systolic: int, diastolic: int, oxygen_saturation: int) -> str:
        notes = []
        if systolic > 140 or diastolic > 90:
            notes.append("Please verify blood pressure reading.")
        if oxygen_saturation < 95:
            notes.append("Please verify oxygen saturation reading.")
        return " ".join(notes) if notes else "Readings within expected monitoring limits."

    @staticmethod
    def upsert_vitals(user_id: str, elderly_id: str, payload: VitalsCreate) -> Dict[str, Any]:
        target_date = payload.date or get_today_ist_str()
        now_iso = datetime.now(timezone.utc).isoformat()
        advisory = VitalsService.get_advisory_notes(payload.systolic, payload.diastolic, payload.oxygen_saturation)

        existing = vitals_collection.find_one({"user_id": user_id, "date": target_date})
        vitals_doc = {
            "user_id": user_id,
            "elderly_id": elderly_id,
            "date": target_date,
            "systolic": payload.systolic,
            "diastolic": payload.diastolic,
            "oxygen_saturation": payload.oxygen_saturation,
            "advisory_notes": advisory,
            "updated_at": now_iso
        }

        if existing:
            vitals_collection.update_one({"_id": existing["_id"]}, {"$set": vitals_doc})
            vitals_doc["_id"] = str(existing["_id"])
            vitals_doc["created_at"] = existing.get("created_at", now_iso)
        else:
            vitals_doc["created_at"] = now_iso
            res = vitals_collection.insert_one(vitals_doc)
            vitals_doc["_id"] = str(res.inserted_id)

        # Format output
        vitals_doc["id"] = str(vitals_doc["_id"])
        return vitals_doc

    @staticmethod
    def get_vitals_by_date(user_id: str, date_str: Optional[str] = None) -> Optional[Dict[str, Any]]:
        target_date = date_str or get_today_ist_str()
        doc = vitals_collection.find_one({"user_id": user_id, "date": target_date})
        if not doc:
            return None
        doc["_id"] = str(doc["_id"])
        doc["id"] = str(doc["_id"])
        return doc
