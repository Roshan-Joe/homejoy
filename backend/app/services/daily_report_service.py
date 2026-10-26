from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from bson import ObjectId

from app.database import (
    daily_reports_collection,
    elderly_collection,
    wellness_checkins_collection,
    vitals_collection,
    medications_collection,
    caregivers_collection
)
from app.services.caregiver_portal_service import CaregiverPortalService

IST = timezone(timedelta(hours=5, minutes=30))

def get_today_ist_str() -> str:
    return datetime.now(IST).strftime("%Y-%m-%d")


class DailyReportService:

    @staticmethod
    def generate_or_update_daily_report(user_id: str, date_str: Optional[str] = None) -> Dict[str, Any]:
        target_date = date_str or get_today_ist_str()
        now_iso = datetime.now(timezone.utc).isoformat()

        # Find elderly profile
        elderly_doc = elderly_collection.find_one({"user_id": user_id})
        if not elderly_doc:
            elderly_doc = elderly_collection.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
        
        elderly_id = str(elderly_doc["_id"]) if elderly_doc else user_id
        elderly_name = (elderly_doc.get("full_name") or elderly_doc.get("name", "Elderly Resident")) if elderly_doc else "Elderly Resident"
        cg_id = elderly_doc.get("assigned_caregiver_id") if elderly_doc else None
        cg_name = elderly_doc.get("assigned_caregiver_name", "Not Assigned") if elderly_doc else "Not Assigned"

        # Fetch check-in & vitals for today
        checkin_doc = wellness_checkins_collection.find_one({"user_id": user_id, "date": target_date})
        vitals_doc = vitals_collection.find_one({"user_id": user_id, "date": target_date})
        meds_list = list(medications_collection.find({"user_id": user_id}))

        checkin_completed = bool(checkin_doc)
        vitals_completed = bool(vitals_doc)
        is_complete = checkin_completed and vitals_completed
        report_status = "Complete" if is_complete else "Pending"

        # Determine medication adherence summary
        if checkin_doc and checkin_doc.get("medication_taken"):
            med_summary = checkin_doc.get("medication_taken")
        elif meds_list:
            med_summary = f"0 / {len(meds_list)} Taken"
        else:
            med_summary = "No medications registered"

        # Determine risk level
        wellness_risk = "Low"
        if checkin_doc and checkin_doc.get("wellness_risk"):
            wellness_risk = checkin_doc["wellness_risk"].capitalize()
        elif elderly_doc and elderly_doc.get("risk_level"):
            wellness_risk = elderly_doc["risk_level"].capitalize()

        # Compute explainable risk if checkin exists
        explainable_risk = None
        try:
            if checkin_doc or vitals_doc:
                explainable_risk = CaregiverPortalService._compute_explainable_ai_risk(
                    checkin_doc, elderly_doc or {}, meds_list
                )
        except Exception as e:
            print("[WARN] Explainable risk calculation note:", e)

        report_doc = {
            "user_id": user_id,
            "elderly_id": elderly_id,
            "elderly_name": elderly_name,
            "date": target_date,
            "status": report_status,
            "checkin_completed": checkin_completed,
            "vitals_completed": vitals_completed,
            "medication_adherence": med_summary,
            "checkin_data": checkin_doc and {
                "medication_taken": checkin_doc.get("medication_taken"),
                "appetite": checkin_doc.get("appetite"),
                "sleep_quality": checkin_doc.get("sleep_quality"),
                "mobility_difficulty": checkin_doc.get("mobility_difficulty"),
                "mood": checkin_doc.get("mood"),
                "symptoms": checkin_doc.get("symptoms"),
                "wellness_risk": checkin_doc.get("wellness_risk")
            },
            "vitals_data": {
                "recorded": bool(vitals_doc),
                "systolic": vitals_doc.get("systolic") if vitals_doc else None,
                "diastolic": vitals_doc.get("diastolic") if vitals_doc else None,
                "bp_display": f"{vitals_doc.get('systolic')}/{vitals_doc.get('diastolic')} mmHg" if (vitals_doc and vitals_doc.get("systolic") and vitals_doc.get("diastolic")) else "Not recorded",
                "oxygen_saturation": vitals_doc.get("oxygen_saturation") if vitals_doc else None,
                "oxygen_display": f"{vitals_doc.get('oxygen_saturation')}% SpO2" if (vitals_doc and vitals_doc.get("oxygen_saturation") is not None) else "Not recorded",
                "advisory_notes": (vitals_doc.get("advisory_notes") if vitals_doc else "Vitals not recorded today.")
            },
            "wellness_risk": wellness_risk,
            "explainable_risk": explainable_risk,
            "assigned_caregiver_id": cg_id,
            "assigned_caregiver_name": cg_name,
            "updated_at": now_iso
        }

        existing_report = daily_reports_collection.find_one({"user_id": user_id, "date": target_date})
        if existing_report:
            daily_reports_collection.update_one({"_id": existing_report["_id"]}, {"$set": report_doc})
            report_doc["_id"] = str(existing_report["_id"])
            report_doc["generated_at"] = existing_report.get("generated_at", now_iso)
        else:
            report_doc["generated_at"] = now_iso
            res = daily_reports_collection.insert_one(report_doc)
            report_doc["_id"] = str(res.inserted_id)

        report_doc["id"] = str(report_doc["_id"])
        return report_doc

    @staticmethod
    def get_daily_report(user_id: str, date_str: Optional[str] = None) -> Dict[str, Any]:
        target_date = date_str or get_today_ist_str()
        report = daily_reports_collection.find_one({"user_id": user_id, "date": target_date})
        if not report:
            # Auto-generate on demand
            return DailyReportService.generate_or_update_daily_report(user_id, target_date)
        report["id"] = str(report["_id"])
        report["_id"] = str(report["_id"])
        return report
