import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import elderly_collection, users_collection
from app.models.elderly_model import serialize_elderly_doc, calculate_risk_level
from app.models.user_model import serialize_user_doc
from app.schemas.elderly_schema import (
    ElderlyCreateSchema, ElderlyUpdateSchema, AssignCaregiverSchema,
    AssignDoctorSchema, WellnessCheckinSchema
)
from app.security import get_password_hash

class ElderlyService:

    @staticmethod
    def get_all_elderly(
        search: Optional[str] = None,
        caregiver_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
        risk_level: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Retrieves paginated, searched, and filtered elderly patient profiles.
        """
        query: Dict[str, Any] = {}

        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"name": {"$regex": s, "$options": "i"}},
                {"full_name": {"$regex": s, "$options": "i"}},
                {"email": {"$regex": s, "$options": "i"}},
                {"phone": {"$regex": s, "$options": "i"}}
            ]

        if caregiver_id and caregiver_id != "all":
            query["assigned_caregiver_id"] = caregiver_id

        if doctor_id and doctor_id != "all":
            query["assigned_doctor_id"] = doctor_id

        if risk_level and risk_level != "all":
            query["risk_level"] = {"$regex": f"^{risk_level.strip()}$", "$options": "i"}

        total = elderly_collection.count_documents(query)

        # Fallback: if no documents in elderly_collection yet, check users collection where role="Elderly"
        if total == 0 and not search and not caregiver_id and not doctor_id and not risk_level:
            users_cursor = users_collection.find({"role": {"$regex": "^elderly$", "$options": "i"}})
            for u in users_cursor:
                now_iso = datetime.now(timezone.utc).isoformat()
                profile_doc = {
                    "user_id": str(u["_id"]),
                    "name": u.get("full_name") or u.get("name", "Elderly Patient"),
                    "email": u.get("email", ""),
                    "phone": u.get("phone", ""),
                    "age": 72,
                    "date_of_birth": "1954-04-12",
                    "gender": "Female",
                    "blood_group": "O+",
                    "emergency_contact_name": "Family Contact",
                    "emergency_contact_phone": u.get("phone", ""),
                    "assigned_caregiver_id": None,
                    "assigned_caregiver_name": "Not Assigned",
                    "assigned_doctor_id": None,
                    "assigned_doctor_name": "Not Assigned",
                    "medical_conditions": ["Hypertension"],
                    "allergies": ["None"],
                    "medications": ["Daily Multivitamin"],
                    "ai_risk_score": 0.20,
                    "risk_level": "Low",
                    "wellness_history": [
                        {"date": now_iso[:10], "mood": "Good", "blood_pressure": "120/80", "heart_rate": 72, "notes": "Initial assessment."}
                    ],
                    "createdAt": now_iso,
                    "updatedAt": now_iso
                }
                elderly_collection.insert_one(profile_doc)
            total = elderly_collection.count_documents(query)

        total_pages = math.ceil(total / limit) if limit > 0 else 1
        skip = (max(page, 1) - 1) * limit

        cursor = elderly_collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)

        elderly_list = []
        for doc in cursor:
            user_doc = None
            if doc.get("user_id"):
                try:
                    user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
                except Exception:
                    pass
            elderly_list.append(serialize_elderly_doc(doc, user_doc))

        return {
            "elderly": elderly_list,
            "total": total,
            "page": max(page, 1),
            "limit": limit,
            "total_pages": max(total_pages, 1)
        }

    @staticmethod
    def get_elderly_by_id(elderly_id: str) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(elderly_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        doc = elderly_collection.find_one({"_id": obj_id})
        if not doc:
            # Fallback search by user_id
            doc = elderly_collection.find_one({"user_id": elderly_id})
            if not doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly profile not found")

        user_doc = None
        if doc.get("user_id"):
            try:
                user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
            except Exception:
                pass

        return serialize_elderly_doc(doc, user_doc)

    @staticmethod
    def create_elderly(payload: ElderlyCreateSchema) -> Dict[str, Any]:
        email_clean = payload.email.lower().strip()
        existing_user = users_collection.find_one({"email": email_clean})

        now_iso = datetime.now(timezone.utc).isoformat()

        if existing_user:
            user_id = str(existing_user["_id"])
        else:
            hashed_pwd = get_password_hash(payload.password or "password123")
            user_doc = {
                "name": payload.name.strip(),
                "full_name": payload.name.strip(),
                "email": email_clean,
                "phone": payload.phone or "",
                "passwordHash": hashed_pwd,
                "hashed_password": hashed_pwd,
                "role": "Elderly",
                "status": "active",
                "is_active": True,
                "createdAt": now_iso,
                "created_at": now_iso
            }
            res_u = users_collection.insert_one(user_doc)
            user_id = str(res_u.inserted_id)

        # Check existing profile
        existing_prof = elderly_collection.find_one({"email": email_clean})
        if existing_prof:
            raise HTTPException(status_code=400, detail="Elderly profile with this email already exists.")

        profile_doc = {
            "user_id": user_id,
            "name": payload.name.strip(),
            "full_name": payload.name.strip(),
            "email": email_clean,
            "phone": payload.phone or "",
            "age": payload.age,
            "date_of_birth": payload.date_of_birth or "1954-04-12",
            "gender": payload.gender,
            "blood_group": payload.blood_group,
            "address": payload.address or "",
            "emergency_contact_name": payload.emergency_contact_name or "",
            "emergency_contact_phone": payload.emergency_contact_phone or "",
            "assigned_caregiver_id": None,
            "assigned_caregiver_name": "Not Assigned",
            "assigned_doctor_id": None,
            "assigned_doctor_name": "Not Assigned",
            "medical_conditions": payload.medical_conditions or [],
            "allergies": payload.allergies or [],
            "medications": payload.medications or [],
            "ai_risk_score": 0.15,
            "risk_level": "Low",
            "wellness_history": [],
            "createdAt": now_iso,
            "created_at": now_iso,
            "updatedAt": now_iso,
            "updated_at": now_iso
        }

        res_p = elderly_collection.insert_one(profile_doc)
        profile_doc["_id"] = res_p.inserted_id
        return serialize_elderly_doc(profile_doc)

    @staticmethod
    def update_elderly(elderly_id: str, payload: ElderlyUpdateSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(elderly_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        existing = elderly_collection.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly profile not found")

        updates: Dict[str, Any] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if payload.name is not None:
            updates["name"] = payload.name.strip()
            updates["full_name"] = payload.name.strip()

        if payload.phone is not None:
            updates["phone"] = payload.phone.strip()

        if payload.age is not None:
            updates["age"] = payload.age

        if payload.date_of_birth is not None:
            updates["date_of_birth"] = payload.date_of_birth

        if payload.gender is not None:
            updates["gender"] = payload.gender

        if payload.blood_group is not None:
            updates["blood_group"] = payload.blood_group

        if payload.address is not None:
            updates["address"] = payload.address

        if payload.emergency_contact_name is not None:
            updates["emergency_contact_name"] = payload.emergency_contact_name

        if payload.emergency_contact_phone is not None:
            updates["emergency_contact_phone"] = payload.emergency_contact_phone

        if payload.medical_conditions is not None:
            updates["medical_conditions"] = payload.medical_conditions

        if payload.allergies is not None:
            updates["allergies"] = payload.allergies

        if payload.medications is not None:
            updates["medications"] = payload.medications

        updates["updatedAt"] = now_iso

        if updates:
            elderly_collection.update_one({"_id": obj_id}, {"$set": updates})

        updated_doc = elderly_collection.find_one({"_id": obj_id})
        return serialize_elderly_doc(updated_doc)

    @staticmethod
    def assign_caregiver(elderly_id: str, payload: AssignCaregiverSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(elderly_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        elderly_doc = elderly_collection.find_one({"_id": obj_id})
        if not elderly_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly profile not found")

        caregiver_id = payload.caregiver_id
        caregiver_name = "Not Assigned"

        if caregiver_id and caregiver_id.strip():
            try:
                cg_obj_id = ObjectId(caregiver_id.strip())
                cg_user = users_collection.find_one({"_id": cg_obj_id})
                if cg_user:
                    caregiver_name = cg_user.get("full_name") or cg_user.get("name", "Caregiver")
            except Exception:
                pass

        now_iso = datetime.now(timezone.utc).isoformat()
        elderly_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "assigned_caregiver_id": caregiver_id if caregiver_id and caregiver_id.strip() else None,
                "assigned_caregiver_name": caregiver_name,
                "updatedAt": now_iso
            }}
        )

        updated_doc = elderly_collection.find_one({"_id": obj_id})
        return serialize_elderly_doc(updated_doc)

    @staticmethod
    def assign_doctor(elderly_id: str, payload: AssignDoctorSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(elderly_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        elderly_doc = elderly_collection.find_one({"_id": obj_id})
        if not elderly_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly profile not found")

        doctor_id = payload.doctor_id
        doctor_name = "Not Assigned"

        if doctor_id and doctor_id.strip():
            try:
                doc_obj_id = ObjectId(doctor_id.strip())
                doc_user = users_collection.find_one({"_id": doc_obj_id})
                if doc_user:
                    doctor_name = doc_user.get("full_name") or doc_user.get("name", "Doctor")
            except Exception:
                pass

        now_iso = datetime.now(timezone.utc).isoformat()
        elderly_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "assigned_doctor_id": doctor_id if doctor_id and doctor_id.strip() else None,
                "assigned_doctor_name": doctor_name,
                "updatedAt": now_iso
            }}
        )

        updated_doc = elderly_collection.find_one({"_id": obj_id})
        return serialize_elderly_doc(updated_doc)

    @staticmethod
    def add_wellness_checkin(elderly_id: str, payload: WellnessCheckinSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(elderly_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        elderly_doc = elderly_collection.find_one({"_id": obj_id})
        if not elderly_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly profile not found")

        new_entry = {
            "date": payload.date,
            "mood": payload.mood,
            "blood_pressure": payload.blood_pressure,
            "heart_rate": payload.heart_rate,
            "sleep_hours": payload.sleep_hours,
            "notes": payload.notes
        }

        history = elderly_doc.get("wellness_history", [])
        history.insert(0, new_entry)

        # Simple risk score calculation simulation
        risk_score = 0.15
        if payload.mood.lower() in ["poor", "bad", "depressed"]:
            risk_score += 0.30
        if payload.heart_rate and (payload.heart_rate > 100 or payload.heart_rate < 55):
            risk_score += 0.35

        risk_level = calculate_risk_level(risk_score)
        now_iso = datetime.now(timezone.utc).isoformat()

        elderly_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "wellness_history": history,
                "ai_risk_score": risk_score,
                "risk_level": risk_level,
                "updatedAt": now_iso
            }}
        )

        updated_doc = elderly_collection.find_one({"_id": obj_id})
        return serialize_elderly_doc(updated_doc)

    @staticmethod
    def delete_elderly(elderly_id: str) -> Dict[str, str]:
        try:
            obj_id = ObjectId(elderly_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        res = elderly_collection.delete_one({"_id": obj_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly profile not found")

        return {"message": "Elderly patient profile deleted successfully", "id": elderly_id}
