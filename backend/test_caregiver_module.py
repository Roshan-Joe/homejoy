"""
Verification Test Script for Caregiver Module in HomeJoy.
Tests RBAC role guards, IDOR security checks, assignment sync,
Explainable AI risk calculation, alert handling, task management, and care reporting.
"""
import unittest
from bson import ObjectId
from fastapi import HTTPException

from app.database import (
    users_collection, caregivers_collection, elderly_collection,
    wellness_checkins_collection, alerts_collection, caregiver_tasks_collection,
    medications_collection, notifications_collection
)
from app.services.caregiver_portal_service import CaregiverPortalService


class TestCaregiverModuleDirect(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Setup Test Users in Database
        # 1. Caregiver A User & Profile
        cls.cg_a_email = "caregiver_a@homejoy.com"
        users_collection.delete_many({"email": cls.cg_a_email})
        caregivers_collection.delete_many({"email": cls.cg_a_email})

        cg_a_user = users_collection.insert_one({
            "name": "Caregiver A", "full_name": "Caregiver A",
            "email": cls.cg_a_email, "role": "Caregiver", "status": "active"
        })
        cls.cg_a_user_id = str(cg_a_user.inserted_id)
        cls.cg_a_user_dict = {"id": cls.cg_a_user_id, "email": cls.cg_a_email, "role": "Caregiver", "full_name": "Caregiver A"}

        cg_a_prof = caregivers_collection.insert_one({
            "user_id": cls.cg_a_user_id, "name": "Caregiver A", "email": cls.cg_a_email,
            "shift": "Day", "qualification": "CNA", "status": "Active",
            "assigned_elderly_ids": [], "assigned_elderly_names": []
        })
        cls.cg_a_prof_id = str(cg_a_prof.inserted_id)

        # 2. Caregiver B User & Profile (for IDOR verification)
        cls.cg_b_email = "caregiver_b@homejoy.com"
        users_collection.delete_many({"email": cls.cg_b_email})
        caregivers_collection.delete_many({"email": cls.cg_b_email})

        cg_b_user = users_collection.insert_one({
            "name": "Caregiver B", "full_name": "Caregiver B",
            "email": cls.cg_b_email, "role": "Caregiver", "status": "active"
        })
        cls.cg_b_user_id = str(cg_b_user.inserted_id)
        cls.cg_b_user_dict = {"id": cls.cg_b_user_id, "email": cls.cg_b_email, "role": "Caregiver", "full_name": "Caregiver B"}

        cg_b_prof = caregivers_collection.insert_one({
            "user_id": cls.cg_b_user_id, "name": "Caregiver B", "email": cls.cg_b_email,
            "shift": "Night", "qualification": "RN", "status": "Active",
            "assigned_elderly_ids": [], "assigned_elderly_names": []
        })
        cls.cg_b_prof_id = str(cg_b_prof.inserted_id)

        # 3. Elderly Client X (assigned to Caregiver A)
        cls.eld_x_email = "elderly_x@homejoy.com"
        users_collection.delete_many({"email": cls.eld_x_email})
        elderly_collection.delete_many({"email": cls.eld_x_email})

        eld_x_user = users_collection.insert_one({
            "name": "Elderly Patient X", "full_name": "Elderly Patient X",
            "email": cls.eld_x_email, "role": "Elderly", "status": "active"
        })
        cls.eld_x_user_id = str(eld_x_user.inserted_id)

        eld_x_prof = elderly_collection.insert_one({
            "user_id": cls.eld_x_user_id, "name": "Elderly Patient X", "full_name": "Elderly Patient X",
            "email": cls.eld_x_email, "date_of_birth": "1948-05-12", "gender": "Female",
            "risk_level": "Moderate", "assigned_caregiver_id": cls.cg_a_user_id,
            "assigned_caregiver_name": "Caregiver A"
        })
        cls.eld_x_prof_id = str(eld_x_prof.inserted_id)

        caregivers_collection.update_one(
            {"_id": ObjectId(cls.cg_a_prof_id)},
            {"$set": {"assigned_elderly_ids": [cls.eld_x_prof_id], "assigned_elderly_names": ["Elderly Patient X"]}}
        )

        # 4. Elderly Client Y (assigned to Caregiver B)
        cls.eld_y_email = "elderly_y@homejoy.com"
        users_collection.delete_many({"email": cls.eld_y_email})
        elderly_collection.delete_many({"email": cls.eld_y_email})

        eld_y_user = users_collection.insert_one({
            "name": "Elderly Patient Y", "full_name": "Elderly Patient Y",
            "email": cls.eld_y_email, "role": "Elderly", "status": "active"
        })
        cls.eld_y_user_id = str(eld_y_user.inserted_id)

        eld_y_prof = elderly_collection.insert_one({
            "user_id": cls.eld_y_user_id, "name": "Elderly Patient Y", "full_name": "Elderly Patient Y",
            "email": cls.eld_y_email, "date_of_birth": "1942-08-20", "gender": "Male",
            "risk_level": "Low", "assigned_caregiver_id": cls.cg_b_user_id,
            "assigned_caregiver_name": "Caregiver B"
        })
        cls.eld_y_prof_id = str(eld_y_prof.inserted_id)

        caregivers_collection.update_one(
            {"_id": ObjectId(cls.cg_b_prof_id)},
            {"$set": {"assigned_elderly_ids": [cls.eld_y_prof_id], "assigned_elderly_names": ["Elderly Patient Y"]}}
        )

    def test_1_get_my_profile(self):
        profile = CaregiverPortalService.get_my_profile(self.cg_a_user_dict)
        self.assertEqual(profile["email"], self.cg_a_email)

    def test_2_dashboard_summary(self):
        dash = CaregiverPortalService.get_dashboard(self.cg_a_user_dict)
        self.assertIn("summary", dash)
        self.assertEqual(dash["summary"]["total_assigned"], 1)

    def test_3_assigned_elderly_list(self):
        assigned = CaregiverPortalService.get_assigned_elderly_list(self.cg_a_user_dict)
        self.assertEqual(len(assigned), 1)
        self.assertEqual(assigned[0]["id"], self.eld_x_prof_id)

    def test_4_idor_protection(self):
        """CRITICAL IDOR SECURITY CHECK: Caregiver A requesting Elderly Y MUST raise 403 Forbidden."""
        with self.assertRaises(HTTPException) as ctx:
            CaregiverPortalService.get_elderly_details(self.cg_a_user_dict, self.eld_y_prof_id)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Access denied", ctx.exception.detail)

    def test_5_explainable_ai_breakdown(self):
        details = CaregiverPortalService.get_elderly_details(self.cg_a_user_dict, self.eld_x_prof_id)
        self.assertIn("explainable_risk", details)
        exp = details["explainable_risk"]
        self.assertIn("safety_disclaimer", exp)
        self.assertIn("contributing_factors", exp)
        self.assertGreater(exp["confidence_score"], 0)

    def test_6_alerts_and_resolution(self):
        alerts = CaregiverPortalService.get_alerts(self.cg_a_user_dict)
        self.assertGreaterEqual(len(alerts), 1)
        alert_id = alerts[0]["id"]

        ack = CaregiverPortalService.acknowledge_alert(self.cg_a_user_dict, alert_id)
        self.assertEqual(ack["status"], "Acknowledged")

        res = CaregiverPortalService.resolve_alert(self.cg_a_user_dict, alert_id, "Patient contacted; condition normal.")
        self.assertEqual(res["status"], "Resolved")

    def test_7_task_management(self):
        from app.schemas.caregiver_portal_schema import CaregiverTaskCreatePayload, CaregiverTaskUpdatePayload
        payload = CaregiverTaskCreatePayload(
            elderly_id=self.eld_x_prof_id,
            title="Morning Vital Check",
            priority="High",
            due_date="2026-08-14"
        )
        task = CaregiverPortalService.create_task(self.cg_a_user_dict, payload)
        self.assertEqual(task["title"], "Morning Vital Check")

        up_payload = CaregiverTaskUpdatePayload(status="Completed")
        up = CaregiverPortalService.update_task(self.cg_a_user_dict, task["id"], up_payload)
        self.assertEqual(up["status"], "Completed")

    def test_8_care_report(self):
        report = CaregiverPortalService.generate_care_report(self.cg_a_user_dict, self.eld_x_prof_id)
        self.assertEqual(report["elderly_id"], self.eld_x_prof_id)
        self.assertIn("summary_notes", report)


if __name__ == "__main__":
    unittest.main()
