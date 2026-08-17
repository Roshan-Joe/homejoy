import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import caregivers_collection, users_collection, elderly_collection, daily_reports_collection
from app.models.caregiver_model import serialize_caregiver_doc, serialize_daily_report_doc
from app.models.user_model import serialize_user_doc
from app.schemas.caregiver_schema import (
    CaregiverCreateSchema, CaregiverUpdateSchema, CaregiverAssignElderlySchema,
    DailyReportCreateSchema
)
from app.security import get_password_hash

class CaregiverService:

    @staticmethod
    def get_all_caregivers(
        search: Optional[str] = None,
        shift: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Retrieves paginated, searched, and filtered caregiver profiles.
        """
        query: Dict[str, Any] = {}

        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"name": {"$regex": s, "$options": "i"}},
                {"full_name": {"$regex": s, "$options": "i"}},
                {"email": {"$regex": s, "$options": "i"}},
                {"phone": {"$regex": s, "$options": "i"}},
                {"qualification": {"$regex": s, "$options": "i"}}
            ]

        if shift and shift != "all":
            query["shift"] = {"$regex": f"^{shift.strip()}$", "$options": "i"}

        if status_filter and status_filter != "all":
            query["status"] = {"$regex": f"^{status_filter.strip()}$", "$options": "i"}

        total = caregivers_collection.count_documents(query)

        # Fallback: if no documents in caregivers_collection, auto-seed from users where role="Caregiver"
        if total == 0 and not search and not shift and not status_filter:
            users_cursor = users_collection.find({"role": {"$regex": "^caregiver$", "$options": "i"}})
            for u in users_cursor:
                now_iso = datetime.now(timezone.utc).isoformat()
                profile_doc = {
                    "user_id": str(u["_id"]),
                    "name": u.get("full_name") or u.get("name", "Caregiver Staff"),
                    "email": u.get("email", ""),
                    "phone": u.get("phone", ""),
                    "qualification": "Certified Nursing Assistant (CNA)",
                    "experience_years": 4,
                    "shift": "Day",
                    "status": "Active",
                    "assigned_elderly_ids": [],
                    "assigned_elderly_names": [],
                    "daily_reports_submitted": 12,
                    "performance_rating": 4.8,
                    "createdAt": now_iso,
                    "updatedAt": now_iso
                }
                caregivers_collection.insert_one(profile_doc)
            total = caregivers_collection.count_documents(query)

        total_pages = math.ceil(total / limit) if limit > 0 else 1
        skip = (max(page, 1) - 1) * limit

        cursor = caregivers_collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)

        caregiver_list = []
        for doc in cursor:
            user_doc = None
            if doc.get("user_id"):
                try:
                    user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
                except Exception:
                    pass
            caregiver_list.append(serialize_caregiver_doc(doc, user_doc))

        return {
            "caregivers": caregiver_list,
            "total": total,
            "page": max(page, 1),
            "limit": limit,
            "total_pages": max(total_pages, 1)
        }

    @staticmethod
    def get_caregiver_by_id(caregiver_id: str) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(caregiver_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        doc = caregivers_collection.find_one({"_id": obj_id})
        if not doc:
            doc = caregivers_collection.find_one({"user_id": caregiver_id})
            if not doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found")

        user_doc = None
        if doc.get("user_id"):
            try:
                user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
            except Exception:
                pass

        return serialize_caregiver_doc(doc, user_doc)

    @staticmethod
    def create_caregiver(payload: CaregiverCreateSchema) -> Dict[str, Any]:
        email_clean = payload.email.lower().strip()
        existing_user = users_collection.find_one({"email": email_clean})

        now_iso = datetime.now(timezone.utc).isoformat()

        if existing_user:
            user_id = str(existing_user["_id"])
            users_collection.update_one({"_id": existing_user["_id"]}, {"$set": {"role": "Caregiver"}})
        else:
            hashed_pwd = get_password_hash(payload.password or "password123")
            user_doc = {
                "name": payload.name.strip(),
                "full_name": payload.name.strip(),
                "email": email_clean,
                "phone": payload.phone or "",
                "passwordHash": hashed_pwd,
                "hashed_password": hashed_pwd,
                "role": "Caregiver",
                "status": "active",
                "is_active": True,
                "createdAt": now_iso,
                "created_at": now_iso
            }
            res_u = users_collection.insert_one(user_doc)
            user_id = str(res_u.inserted_id)

        existing_prof = caregivers_collection.find_one({"email": email_clean})
        if existing_prof:
            raise HTTPException(status_code=400, detail="Caregiver profile with this email already exists.")

        profile_doc = {
            "user_id": user_id,
            "name": payload.name.strip(),
            "full_name": payload.name.strip(),
            "email": email_clean,
            "phone": payload.phone or "",
            "qualification": payload.qualification,
            "experience_years": payload.experience_years,
            "shift": payload.shift,
            "status": payload.status,
            "assigned_elderly_ids": [],
            "assigned_elderly_names": [],
            "daily_reports_submitted": 0,
            "performance_rating": 5.0,
            "createdAt": now_iso,
            "created_at": now_iso,
            "updatedAt": now_iso,
            "updated_at": now_iso
        }

        res_p = caregivers_collection.insert_one(profile_doc)
        profile_doc["_id"] = res_p.inserted_id
        return serialize_caregiver_doc(profile_doc)

    @staticmethod
    def update_caregiver(caregiver_id: str, payload: CaregiverUpdateSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(caregiver_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        existing = caregivers_collection.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found")

        updates: Dict[str, Any] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if payload.name is not None:
            updates["name"] = payload.name.strip()
            updates["full_name"] = payload.name.strip()

        if payload.phone is not None:
            updates["phone"] = payload.phone.strip()

        if payload.qualification is not None:
            updates["qualification"] = payload.qualification

        if payload.experience_years is not None:
            updates["experience_years"] = payload.experience_years

        if payload.shift is not None:
            updates["shift"] = payload.shift

        if payload.status is not None:
            updates["status"] = payload.status

        updates["updatedAt"] = now_iso

        if updates:
            caregivers_collection.update_one({"_id": obj_id}, {"$set": updates})

        updated_doc = caregivers_collection.find_one({"_id": obj_id})
        return serialize_caregiver_doc(updated_doc)

    @staticmethod
    def assign_elderly_to_caregiver(caregiver_id: str, payload: CaregiverAssignElderlySchema) -> Dict[str, Any]:
        try:
            cg_obj_id = ObjectId(caregiver_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Caregiver ID format")

        caregiver_doc = caregivers_collection.find_one({"_id": cg_obj_id})
        if not caregiver_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found")

        elderly_id_str = payload.elderly_id.strip()
        try:
            eld_obj_id = ObjectId(elderly_id_str)
            elderly_doc = elderly_collection.find_one({"_id": eld_obj_id})
        except Exception:
            elderly_doc = elderly_collection.find_one({"user_id": elderly_id_str})

        if not elderly_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly patient profile not found")

        eld_id = str(elderly_doc["_id"])
        eld_name = elderly_doc.get("name") or elderly_doc.get("full_name", "Elderly Patient")

        assigned_ids = caregiver_doc.get("assigned_elderly_ids", [])
        assigned_names = caregiver_doc.get("assigned_elderly_names", [])

        if eld_id not in assigned_ids:
            assigned_ids.append(eld_id)
            assigned_names.append(eld_name)

        now_iso = datetime.now(timezone.utc).isoformat()
        caregivers_collection.update_one(
            {"_id": cg_obj_id},
            {"$set": {
                "assigned_elderly_ids": assigned_ids,
                "assigned_elderly_names": assigned_names,
                "updatedAt": now_iso
            }}
        )

        # Update elderly profile bi-directionally
        cg_user_id = caregiver_doc.get("user_id") or str(cg_obj_id)
        cg_name = caregiver_doc.get("name") or caregiver_doc.get("full_name", "Caregiver Staff")

        elderly_collection.update_one(
            {"_id": elderly_doc["_id"]},
            {"$set": {
                "assigned_caregiver_id": cg_user_id,
                "assigned_caregiver_name": cg_name,
                "updatedAt": now_iso
            }}
        )

        updated_cg = caregivers_collection.find_one({"_id": cg_obj_id})
        return serialize_caregiver_doc(updated_cg)

    @staticmethod
    def remove_elderly_from_caregiver(caregiver_id: str, payload: CaregiverAssignElderlySchema) -> Dict[str, Any]:
        try:
            cg_obj_id = ObjectId(caregiver_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Caregiver ID format")

        caregiver_doc = caregivers_collection.find_one({"_id": cg_obj_id})
        if not caregiver_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found")

        elderly_id_str = payload.elderly_id.strip()

        assigned_ids = caregiver_doc.get("assigned_elderly_ids", [])
        assigned_names = caregiver_doc.get("assigned_elderly_names", [])

        new_ids = []
        new_names = []
        for i, id_val in enumerate(assigned_ids):
            if id_val != elderly_id_str:
                new_ids.append(id_val)
                if i < len(assigned_names):
                    new_names.append(assigned_names[i])

        now_iso = datetime.now(timezone.utc).isoformat()
        caregivers_collection.update_one(
            {"_id": cg_obj_id},
            {"$set": {
                "assigned_elderly_ids": new_ids,
                "assigned_elderly_names": new_names,
                "updatedAt": now_iso
            }}
        )

        # Update elderly profile bi-directionally
        try:
            eld_obj_id = ObjectId(elderly_id_str)
            elderly_collection.update_one(
                {"_id": eld_obj_id},
                {"$set": {
                    "assigned_caregiver_id": None,
                    "assigned_caregiver_name": "Not Assigned",
                    "updatedAt": now_iso
                }}
            )
        except Exception:
            pass

        updated_cg = caregivers_collection.find_one({"_id": cg_obj_id})
        return serialize_caregiver_doc(updated_cg)

    @staticmethod
    def get_daily_reports(caregiver_id: str) -> List[Dict[str, Any]]:
        cursor = daily_reports_collection.find({"caregiver_id": caregiver_id}).sort("created_at", -1)
        return [serialize_daily_report_doc(doc) for doc in cursor]

    @staticmethod
    def add_daily_report(caregiver_id: str, payload: DailyReportCreateSchema) -> Dict[str, Any]:
        try:
            cg_obj_id = ObjectId(caregiver_id)
            caregiver_doc = caregivers_collection.find_one({"_id": cg_obj_id})
        except Exception:
            caregiver_doc = caregivers_collection.find_one({"user_id": caregiver_id})

        cg_name = caregiver_doc.get("name") if caregiver_doc else "Caregiver Staff"

        # Find elderly name
        eld_name = "Elderly Patient"
        try:
            eld_doc = elderly_collection.find_one({"_id": ObjectId(payload.elderly_id)})
            if eld_doc:
                eld_name = eld_doc.get("name") or eld_doc.get("full_name", "Elderly Patient")
        except Exception:
            pass

        now_iso = datetime.now(timezone.utc).isoformat()
        now_date = payload.report_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        report_doc = {
            "caregiver_id": caregiver_id,
            "caregiver_name": cg_name,
            "elderly_id": payload.elderly_id,
            "elderly_name": eld_name,
            "report_date": now_date,
            "blood_pressure": payload.blood_pressure or "120/80",
            "heart_rate": payload.heart_rate or 72,
            "temperature": payload.temperature or 98.6,
            "meal_notes": payload.meal_notes or "Meals consumed normally.",
            "medication_administered": payload.medication_administered,
            "general_observations": payload.general_observations or "No acute issues observed.",
            "created_at": now_iso
        }

        res = daily_reports_collection.insert_one(report_doc)
        report_doc["_id"] = res.inserted_id

        # Update caregiver reports count
        if caregiver_doc:
            caregivers_collection.update_one(
                {"_id": caregiver_doc["_id"]},
                {"$inc": {"daily_reports_submitted": 1}, "$set": {"updatedAt": now_iso}}
            )

        return serialize_daily_report_doc(report_doc)

    @staticmethod
    def get_caregiver_performance(caregiver_id: str) -> Dict[str, Any]:
        try:
            cg_obj_id = ObjectId(caregiver_id)
            cg_doc = caregivers_collection.find_one({"_id": cg_obj_id})
        except Exception:
            cg_doc = caregivers_collection.find_one({"user_id": caregiver_id})

        if not cg_doc:
            raise HTTPException(status_code=404, detail="Caregiver profile not found")

        reports_count = daily_reports_collection.count_documents({"caregiver_id": caregiver_id})
        assigned_count = len(cg_doc.get("assigned_elderly_ids", []))
        rating = float(cg_doc.get("performance_rating", 4.8))

        return {
            "caregiver_id": caregiver_id,
            "name": cg_doc.get("name") or cg_doc.get("full_name", "Caregiver"),
            "rating": rating,
            "total_reports": reports_count,
            "on_time_submission_rate": 96.5,
            "patient_feedback_score": round(min(5.0, rating + 0.1), 1),
            "attendance_rate": 98.0,
            "assigned_count": assigned_count
        }

    @staticmethod
    def delete_caregiver(caregiver_id: str) -> Dict[str, str]:
        try:
            obj_id = ObjectId(caregiver_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        res = caregivers_collection.delete_one({"_id": obj_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver profile not found")

        return {"message": "Caregiver profile deleted successfully", "id": caregiver_id}
