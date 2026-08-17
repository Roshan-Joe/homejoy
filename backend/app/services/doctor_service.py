import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import doctors_collection, users_collection, elderly_collection, medical_notes_collection
from app.models.doctor_model import serialize_doctor_doc, serialize_medical_note_doc
from app.models.user_model import serialize_user_doc
from app.schemas.doctor_schema import (
    DoctorCreateSchema, DoctorUpdateSchema, DoctorAssignPatientSchema,
    MedicalNoteCreateSchema
)
from app.security import get_password_hash

class DoctorService:

    @staticmethod
    def get_all_doctors(
        search: Optional[str] = None,
        specialization: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Retrieves paginated, searched, and filtered doctor profiles.
        """
        query: Dict[str, Any] = {}

        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"name": {"$regex": s, "$options": "i"}},
                {"full_name": {"$regex": s, "$options": "i"}},
                {"email": {"$regex": s, "$options": "i"}},
                {"phone": {"$regex": s, "$options": "i"}},
                {"specialization": {"$regex": s, "$options": "i"}},
                {"license_number": {"$regex": s, "$options": "i"}}
            ]

        if specialization and specialization != "all":
            query["specialization"] = {"$regex": f"^{specialization.strip()}$", "$options": "i"}

        if status_filter and status_filter != "all":
            query["status"] = {"$regex": f"^{status_filter.strip()}$", "$options": "i"}

        total = doctors_collection.count_documents(query)

        # Fallback: if no documents in doctors_collection, auto-seed from users where role="Doctor"
        if total == 0 and not search and not specialization and not status_filter:
            users_cursor = users_collection.find({"role": {"$regex": "^doctor$", "$options": "i"}})
            for u in users_cursor:
                now_iso = datetime.now(timezone.utc).isoformat()
                profile_doc = {
                    "user_id": str(u["_id"]),
                    "name": u.get("full_name") or u.get("name", "Dr. Medical Staff"),
                    "email": u.get("email", ""),
                    "phone": u.get("phone", ""),
                    "specialization": "Geriatrician",
                    "license_number": "MD-89241",
                    "hospital_affiliation": "City General Hospital",
                    "experience_years": 12,
                    "status": "Active",
                    "assigned_patient_ids": [],
                    "assigned_patient_names": [],
                    "appointments_count": 5,
                    "createdAt": now_iso,
                    "updatedAt": now_iso
                }
                doctors_collection.insert_one(profile_doc)
            total = doctors_collection.count_documents(query)

        total_pages = math.ceil(total / limit) if limit > 0 else 1
        skip = (max(page, 1) - 1) * limit

        cursor = doctors_collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)

        doctor_list = []
        for doc in cursor:
            user_doc = None
            if doc.get("user_id"):
                try:
                    user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
                except Exception:
                    pass
            doctor_list.append(serialize_doctor_doc(doc, user_doc))

        return {
            "doctors": doctor_list,
            "total": total,
            "page": max(page, 1),
            "limit": limit,
            "total_pages": max(total_pages, 1)
        }

    @staticmethod
    def get_doctor_by_id(doctor_id: str) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(doctor_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        doc = doctors_collection.find_one({"_id": obj_id})
        if not doc:
            doc = doctors_collection.find_one({"user_id": doctor_id})
            if not doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")

        user_doc = None
        if doc.get("user_id"):
            try:
                user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
            except Exception:
                pass

        return serialize_doctor_doc(doc, user_doc)

    @staticmethod
    def create_doctor(payload: DoctorCreateSchema) -> Dict[str, Any]:
        email_clean = payload.email.lower().strip()
        existing_user = users_collection.find_one({"email": email_clean})

        now_iso = datetime.now(timezone.utc).isoformat()

        if existing_user:
            user_id = str(existing_user["_id"])
            users_collection.update_one({"_id": existing_user["_id"]}, {"$set": {"role": "Doctor"}})
        else:
            hashed_pwd = get_password_hash(payload.password or "password123")
            user_doc = {
                "name": payload.name.strip(),
                "full_name": payload.name.strip(),
                "email": email_clean,
                "phone": payload.phone or "",
                "passwordHash": hashed_pwd,
                "hashed_password": hashed_pwd,
                "role": "Doctor",
                "status": "active",
                "is_active": True,
                "createdAt": now_iso,
                "created_at": now_iso
            }
            res_u = users_collection.insert_one(user_doc)
            user_id = str(res_u.inserted_id)

        existing_prof = doctors_collection.find_one({"email": email_clean})
        if existing_prof:
            raise HTTPException(status_code=400, detail="Doctor profile with this email already exists.")

        profile_doc = {
            "user_id": user_id,
            "name": payload.name.strip(),
            "full_name": payload.name.strip(),
            "email": email_clean,
            "phone": payload.phone or "",
            "specialization": payload.specialization,
            "license_number": payload.license_number,
            "hospital_affiliation": payload.hospital_affiliation or "HomeJoy Medical Network",
            "experience_years": payload.experience_years,
            "status": payload.status,
            "assigned_patient_ids": [],
            "assigned_patient_names": [],
            "appointments_count": 0,
            "createdAt": now_iso,
            "created_at": now_iso,
            "updatedAt": now_iso,
            "updated_at": now_iso
        }

        res_p = doctors_collection.insert_one(profile_doc)
        profile_doc["_id"] = res_p.inserted_id
        return serialize_doctor_doc(profile_doc)

    @staticmethod
    def update_doctor(doctor_id: str, payload: DoctorUpdateSchema) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(doctor_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        existing = doctors_collection.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")

        updates: Dict[str, Any] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if payload.name is not None:
            updates["name"] = payload.name.strip()
            updates["full_name"] = payload.name.strip()

        if payload.phone is not None:
            updates["phone"] = payload.phone.strip()

        if payload.specialization is not None:
            updates["specialization"] = payload.specialization

        if payload.license_number is not None:
            updates["license_number"] = payload.license_number

        if payload.hospital_affiliation is not None:
            updates["hospital_affiliation"] = payload.hospital_affiliation

        if payload.experience_years is not None:
            updates["experience_years"] = payload.experience_years

        if payload.status is not None:
            updates["status"] = payload.status

        updates["updatedAt"] = now_iso

        if updates:
            doctors_collection.update_one({"_id": obj_id}, {"$set": updates})

        updated_doc = doctors_collection.find_one({"_id": obj_id})
        return serialize_doctor_doc(updated_doc)

    @staticmethod
    def assign_elderly_to_doctor(doctor_id: str, payload: DoctorAssignPatientSchema) -> Dict[str, Any]:
        try:
            doc_obj_id = ObjectId(doctor_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Doctor ID format")

        doctor_doc = doctors_collection.find_one({"_id": doc_obj_id})
        if not doctor_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")

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

        assigned_ids = doctor_doc.get("assigned_patient_ids", [])
        assigned_names = doctor_doc.get("assigned_patient_names", [])

        if eld_id not in assigned_ids:
            assigned_ids.append(eld_id)
            assigned_names.append(eld_name)

        now_iso = datetime.now(timezone.utc).isoformat()
        doctors_collection.update_one(
            {"_id": doc_obj_id},
            {"$set": {
                "assigned_patient_ids": assigned_ids,
                "assigned_patient_names": assigned_names,
                "updatedAt": now_iso
            }}
        )

        # Update elderly profile bi-directionally
        doc_user_id = doctor_doc.get("user_id") or str(doc_obj_id)
        doc_name = doctor_doc.get("name") or doctor_doc.get("full_name", "Doctor")

        elderly_collection.update_one(
            {"_id": elderly_doc["_id"]},
            {"$set": {
                "assigned_doctor_id": doc_user_id,
                "assigned_doctor_name": doc_name,
                "updatedAt": now_iso
            }}
        )

        updated_doctor = doctors_collection.find_one({"_id": doc_obj_id})
        return serialize_doctor_doc(updated_doctor)

    @staticmethod
    def remove_elderly_from_doctor(doctor_id: str, payload: DoctorAssignPatientSchema) -> Dict[str, Any]:
        try:
            doc_obj_id = ObjectId(doctor_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Doctor ID format")

        doctor_doc = doctors_collection.find_one({"_id": doc_obj_id})
        if not doctor_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")

        elderly_id_str = payload.elderly_id.strip()

        assigned_ids = doctor_doc.get("assigned_patient_ids", [])
        assigned_names = doctor_doc.get("assigned_patient_names", [])

        new_ids = []
        new_names = []
        for i, id_val in enumerate(assigned_ids):
            if id_val != elderly_id_str:
                new_ids.append(id_val)
                if i < len(assigned_names):
                    new_names.append(assigned_names[i])

        now_iso = datetime.now(timezone.utc).isoformat()
        doctors_collection.update_one(
            {"_id": doc_obj_id},
            {"$set": {
                "assigned_patient_ids": new_ids,
                "assigned_patient_names": new_names,
                "updatedAt": now_iso
            }}
        )

        # Update elderly profile bi-directionally
        try:
            eld_obj_id = ObjectId(elderly_id_str)
            elderly_collection.update_one(
                {"_id": eld_obj_id},
                {"$set": {
                    "assigned_doctor_id": None,
                    "assigned_doctor_name": "Not Assigned",
                    "updatedAt": now_iso
                }}
            )
        except Exception:
            pass

        updated_doctor = doctors_collection.find_one({"_id": doc_obj_id})
        return serialize_doctor_doc(updated_doctor)

    @staticmethod
    def get_medical_notes(doctor_id: str) -> List[Dict[str, Any]]:
        cursor = medical_notes_collection.find({"doctor_id": doctor_id}).sort("created_at", -1)
        return [serialize_medical_note_doc(doc) for doc in cursor]

    @staticmethod
    def create_medical_note(doctor_id: str, payload: MedicalNoteCreateSchema) -> Dict[str, Any]:
        try:
            doc_obj_id = ObjectId(doctor_id)
            doctor_doc = doctors_collection.find_one({"_id": doc_obj_id})
        except Exception:
            doctor_doc = doctors_collection.find_one({"user_id": doctor_id})

        doc_name = doctor_doc.get("name") if doctor_doc else "Doctor Staff"

        eld_name = "Elderly Patient"
        try:
            eld_doc = elderly_collection.find_one({"_id": ObjectId(payload.elderly_id)})
            if eld_doc:
                eld_name = eld_doc.get("name") or eld_doc.get("full_name", "Elderly Patient")
        except Exception:
            pass

        now_iso = datetime.now(timezone.utc).isoformat()
        now_date = payload.note_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        note_doc = {
            "doctor_id": doctor_id,
            "doctor_name": doc_name,
            "elderly_id": payload.elderly_id,
            "elderly_name": eld_name,
            "note_date": now_date,
            "diagnosis": payload.diagnosis,
            "clinical_notes": payload.clinical_notes,
            "prescriptions": payload.prescriptions or [],
            "follow_up_date": payload.follow_up_date,
            "created_at": now_iso
        }

        res = medical_notes_collection.insert_one(note_doc)
        note_doc["_id"] = res.inserted_id
        return serialize_medical_note_doc(note_doc)

    @staticmethod
    def get_doctor_appointments(doctor_id: str) -> List[Dict[str, Any]]:
        # Simulated/Structured appointments list for the doctor
        now = datetime.now(timezone.utc)
        return [
            {
                "id": "apt-101",
                "doctor_id": doctor_id,
                "doctor_name": "Doctor Staff",
                "elderly_id": "eld-1",
                "elderly_name": "Eleanor Vance",
                "appointment_date": (now + timedelta(days=2)).strftime("%Y-%m-%d"),
                "time_slot": "10:30 AM",
                "status": "Scheduled",
                "type": "Routine Geriatric Checkup"
            },
            {
                "id": "apt-102",
                "doctor_id": doctor_id,
                "doctor_name": "Doctor Staff",
                "elderly_id": "eld-2",
                "elderly_name": "Arthur Pendelton",
                "appointment_date": (now + timedelta(days=4)).strftime("%Y-%m-%d"),
                "time_slot": "02:15 PM",
                "status": "Scheduled",
                "type": "Blood Pressure Follow-up"
            }
        ]

    @staticmethod
    def delete_doctor(doctor_id: str) -> Dict[str, str]:
        try:
            obj_id = ObjectId(doctor_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        res = doctors_collection.delete_one({"_id": obj_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")

        return {"message": "Doctor profile deleted successfully", "id": doctor_id}
