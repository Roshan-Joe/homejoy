"""
HomeJoy Comprehensive End-to-End System Readiness Test Suite
Tests authentication, authorization, role boundary guards,
core elderly care telemetry, caregiver assignment sync,
explainable risk calculation, help requests, and IDOR isolation.
"""
import unittest
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.database import (
    users_collection, elderly_collection, caregivers_collection,
    wellness_checkins_collection, vitals_collection, help_requests_collection,
    alerts_collection, medications_collection, emergency_contacts_collection,
    daily_reports_collection
)
from app.config import ADMIN_SETUP_SECRET


class TestHomeJoyE2EReadiness(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # 1. Clean test records from DB
        test_emails = [
            "e2e_admin@homejoy.com",
            "e2e_elderly_alice@homejoy.com",
            "e2e_elderly_bob@homejoy.com",
            "e2e_caregiver_mary@homejoy.com",
            "e2e_caregiver_john@homejoy.com",
            "e2e_caregiver_self@homejoy.com",
            "e2e_family_david@homejoy.com",
            "e2e_hacker@test.com"
        ]
        users_collection.delete_many({"email": {"$in": test_emails}})
        elderly_collection.delete_many({"email": {"$in": test_emails}})
        caregivers_collection.delete_many({"email": {"$in": test_emails}})

        # 2. Seed Admin User
        admin_doc = {
            "full_name": "E2E Administrator",
            "email": "e2e_admin@homejoy.com",
            "role": "Admin",
            "is_active": True,
            "created_at": "2026-10-07T00:00:00"
        }
        from app.security import get_password_hash
        admin_doc["hashed_password"] = get_password_hash("AdminPass123!")
        res_adm = users_collection.insert_one(admin_doc)
        cls.admin_user_id = str(res_adm.inserted_id)

        # Login Admin and get token
        login_res = cls.client.post("/api/auth/login", json={
            "email": "e2e_admin@homejoy.com",
            "password": "AdminPass123!"
        })
        assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
        cls.admin_token = login_res.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    def test_01_health_endpoint(self):
        """GET /health must return healthy status without exposing secrets"""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertEqual(data.get("database"), "healthy")
        self.assertNotIn("mongodb+srv", str(data))

    def test_02_registration_role_guards(self):
        """Public self-registration must reject Admin and Doctor roles, allowing only Elderly and Caregiver"""
        # Attempt to register as Admin
        res_adm = self.client.post("/api/auth/register", json={
            "full_name": "Infiltrator",
            "email": "e2e_hacker@test.com",
            "password": "Password123!",
            "role": "Admin"
        })
        self.assertEqual(res_adm.status_code, 403)
        self.assertIn("restricted", res_adm.json()["detail"].lower())

        # Attempt to register as Doctor (unpermitted public role)
        res_doc = self.client.post("/api/auth/register", json={
            "full_name": "Infiltrator Doctor",
            "email": "e2e_hacker@test.com",
            "password": "Password123!",
            "role": "Doctor"
        })
        self.assertEqual(res_doc.status_code, 403)
        self.assertIn("restricted", res_doc.json()["detail"].lower())

        # Valid self-registration as Elderly
        res_eld = self.client.post("/api/auth/register", json={
            "full_name": "Alice Resident",
            "email": "e2e_elderly_alice@homejoy.com",
            "password": "Password123!",
            "role": "Elderly",
            "guardian_email": "alice.guardian@example.com",
            "guardian_report_consent": True
        })
        self.assertEqual(res_eld.status_code, 201)
        self.assertEqual(res_eld.json()["user"]["role"], "Elderly")

        # Attempt to self-register as Caregiver (restricted to Admin provisioning)
        res_cg = self.client.post("/api/auth/register", json={
            "full_name": "Self-Reg Caregiver",
            "email": "e2e_caregiver_self@homejoy.com",
            "password": "Password123!",
            "role": "Caregiver"
        })
        self.assertEqual(res_cg.status_code, 403)
        self.assertIn("restricted", res_cg.json()["detail"].lower())

    def test_03_admin_provisions_caregiver_and_elderly(self):
        """Admin provisions Caregiver and Elderly, then assigns Caregiver with bidirectional sync"""
        # Create Caregiver via Admin
        cg_payload = {
            "name": "Mary Caregiver",
            "email": "e2e_caregiver_mary@homejoy.com",
            "phone": "+1-555-0101",
            "password": "CaregiverPass123!",
            "qualification": "Certified Nursing Assistant (CNA)",
            "experience_years": 5,
            "shift": "Day",
            "status": "Active"
        }
        res_cg = self.client.post("/api/caregivers", json=cg_payload, headers=self.admin_headers)
        self.assertEqual(res_cg.status_code, 201)
        cg_data = res_cg.json()
        cg_id = cg_data["id"]

        # Create Elderly Bob via Admin
        eld_payload = {
            "name": "Bob Senior",
            "email": "e2e_elderly_bob@homejoy.com",
            "phone": "+1-555-0202",
            "password": "SeniorPass123!",
            "age": 78,
            "gender": "Male",
            "blood_group": "O+",
            "address": "123 Sunshine Lane",
            "date_of_birth": "1948-06-15",
            "guardian_name": "Robert Senior",
            "guardian_phone": "+1-555-9988",
            "guardian_relationship": "Son"
        }
        res_eld = self.client.post("/api/elderly", json=eld_payload, headers=self.admin_headers)
        self.assertEqual(res_eld.status_code, 201)
        eld_data = res_eld.json()
        eld_id = eld_data["id"]

        # Assign Caregiver Mary to Elderly Bob via Admin
        res_assign = self.client.patch(f"/api/elderly/{eld_id}/assign-caregiver", json={
            "caregiver_id": cg_id
        }, headers=self.admin_headers)
        self.assertEqual(res_assign.status_code, 200)
        self.assertEqual(res_assign.json()["assigned_caregiver_name"], "Mary Caregiver")

        # Verify Bidirectional Sync in database
        cg_doc = caregivers_collection.find_one({"_id": ObjectId(cg_id)})
        self.assertIn(eld_id, cg_doc.get("assigned_elderly_ids", []))
        self.assertIn("Bob Senior", cg_doc.get("assigned_elderly_names", []))

    def test_04_elderly_wellness_checkin_and_explainable_risk(self):
        """Elderly logs in, submits wellness check-in, verifies explainability and duplicate prevention"""
        # Login Elderly Alice
        login_res = self.client.post("/api/auth/login", json={
            "email": "e2e_elderly_alice@homejoy.com",
            "password": "Password123!"
        })
        self.assertEqual(login_res.status_code, 200)
        alice_token = login_res.json()["access_token"]
        alice_headers = {"Authorization": f"Bearer {alice_token}"}

        # Submit First Check-In for today
        checkin_payload = {
            "date": "2026-10-07",
            "medication_taken": "Yes, partially taken",
            "appetite": "Poor",
            "sleep_quality": "Poor",
            "mobility_difficulty": "Moderate difficulty",
            "mood": "Poor",
            "symptoms": "Mild dizziness on standing",
            "notes": "Felt tired today"
        }
        res_checkin = self.client.post("/api/elderly/me/checkins", json=checkin_payload, headers=alice_headers)
        self.assertIn(res_checkin.status_code, [200, 201])
        checkin_data = res_checkin.json()

        # Verify Explainable Risk Calculation
        self.assertIn(checkin_data["wellness_risk"], ["Moderate", "High"])
        self.assertTrue(len(checkin_data["contributing_factors"]) > 0)
        self.assertIn("baseline_comparison", checkin_data)
        self.assertIn("engine_note", checkin_data)

        # Duplicate Check-in Prevention (Phase 9 requirement)
        res_dup = self.client.post("/api/elderly/me/checkins", json=checkin_payload, headers=alice_headers)
        self.assertEqual(res_dup.status_code, 400)
        self.assertIn("already completed", res_dup.json()["detail"].lower())

    def test_05_vitals_telemetry_and_advisory(self):
        """Elderly logs blood pressure and SpO2; vitals service generates monitoring notes"""
        login_res = self.client.post("/api/auth/login", json={
            "email": "e2e_elderly_alice@homejoy.com",
            "password": "Password123!"
        })
        alice_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        vitals_payload = {
            "date": "2026-10-07",
            "systolic": 145,
            "diastolic": 92,
            "oxygen_saturation": 93
        }
        res_vitals = self.client.post("/api/elderly/me/vitals", json=vitals_payload, headers=alice_headers)
        self.assertEqual(res_vitals.status_code, 200)
        vitals_data = res_vitals.json()
        self.assertEqual(vitals_data["systolic"], 145)
        self.assertIn("verify", vitals_data["advisory_notes"].lower())

    def test_06_request_help_workflow(self):
        """Elderly requests urgent help -> assigned caregiver receives alert"""
        # Assign Caregiver Mary to Elderly Alice so request routes correctly
        cg_mary = caregivers_collection.find_one({"email": "e2e_caregiver_mary@homejoy.com"})
        eld_alice = elderly_collection.find_one({"email": "e2e_elderly_alice@homejoy.com"})

        elderly_collection.update_one(
            {"_id": eld_alice["_id"]},
            {"$set": {
                "assigned_caregiver_id": str(cg_mary["_id"]),
                "assigned_caregiver_name": cg_mary["name"]
            }}
        )
        caregivers_collection.update_one(
            {"_id": cg_mary["_id"]},
            {"$addToSet": {"assigned_elderly_ids": str(eld_alice["_id"])}}
        )

        login_res = self.client.post("/api/auth/login", json={
            "email": "e2e_elderly_alice@homejoy.com",
            "password": "Password123!"
        })
        alice_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        # Alice creates help request
        help_payload = {
            "reason": "I am not feeling well",
            "message": "Dizziness after taking morning medication."
        }
        res_help = self.client.post("/api/elderly/me/help-request", json=help_payload, headers=alice_headers)
        self.assertEqual(res_help.status_code, 200)
        help_req_id = res_help.json()["id"]
        self.assertEqual(res_help.json()["status"], "Pending")

        # Caregiver Mary logs in and inspects help requests
        cg_login = self.client.post("/api/auth/login", json={
            "email": "e2e_caregiver_mary@homejoy.com",
            "password": "CaregiverPass123!"
        })
        mary_headers = {"Authorization": f"Bearer {cg_login.json()['access_token']}"}

        res_cg_help = self.client.get("/api/caregiver/me/help-requests", headers=mary_headers)
        self.assertEqual(res_cg_help.status_code, 200)
        req_ids = [r["id"] for r in res_cg_help.json()]
        self.assertIn(help_req_id, req_ids)

        # Mary acknowledges the request
        res_ack = self.client.put(f"/api/caregiver/me/help-requests/{help_req_id}/acknowledge", headers=mary_headers)
        self.assertEqual(res_ack.status_code, 200)
        self.assertEqual(res_ack.json()["status"], "Acknowledged")

        # Mary resolves the request
        res_res = self.client.put(
            f"/api/caregiver/me/help-requests/{help_req_id}/resolve",
            json={"resolution_note": "Checked vitals and provided water"},
            headers=mary_headers
        )
        self.assertEqual(res_res.status_code, 200)
        self.assertEqual(res_res.json()["status"], "Resolved")

    def test_07_caregiver_daily_report_missing_data_awareness(self):
        """Caregiver fetches daily report and verifies missing data awareness ('Not recorded')"""
        cg_login = self.client.post("/api/auth/login", json={
            "email": "e2e_caregiver_mary@homejoy.com",
            "password": "CaregiverPass123!"
        })
        mary_headers = {"Authorization": f"Bearer {cg_login.json()['access_token']}"}

        eld_bob = elderly_collection.find_one({"email": "e2e_elderly_bob@homejoy.com"})
        eld_bob_id = str(eld_bob["_id"])

        # Bob has NOT recorded vitals today
        res_rep = self.client.get(
            f"/api/caregiver/me/elderly/{eld_bob_id}/daily-report?date=2026-10-07",
            headers=mary_headers
        )
        self.assertEqual(res_rep.status_code, 200)
        rep_data = res_rep.json()
        self.assertIn("vitals_data", rep_data)
        self.assertEqual(rep_data["vitals_data"]["recorded"], False)
        self.assertEqual(rep_data["vitals_data"]["bp_display"], "Not recorded")
        self.assertEqual(rep_data["vitals_data"]["oxygen_display"], "Not recorded")

    def test_08_idor_and_role_access_boundaries(self):
        """Strict IDOR verification: Caregiver John cannot access Elderly assigned to Caregiver Mary"""
        # Create second caregiver John
        res_john = self.client.post("/api/caregivers", json={
            "name": "John Caregiver",
            "email": "e2e_caregiver_john@homejoy.com",
            "phone": "+1-555-0999",
            "password": "JohnPass123!",
            "qualification": "RN",
            "experience_years": 3,
            "shift": "Night",
            "status": "Active"
        }, headers=self.admin_headers)
        self.assertEqual(res_john.status_code, 201)

        # Login John
        john_login = self.client.post("/api/auth/login", json={
            "email": "e2e_caregiver_john@homejoy.com",
            "password": "JohnPass123!"
        })
        john_headers = {"Authorization": f"Bearer {john_login.json()['access_token']}"}

        # John tries to access Alice (assigned to Mary, not John)
        eld_alice = elderly_collection.find_one({"email": "e2e_elderly_alice@homejoy.com"})
        res_unauth = self.client.get(f"/api/caregiver/me/elderly/{eld_alice['_id']}", headers=john_headers)
        self.assertEqual(res_unauth.status_code, 403)
        self.assertIn("access denied", res_unauth.json()["detail"].lower())

        # Elderly tries to access Admin route
        alice_login = self.client.post("/api/auth/login", json={
            "email": "e2e_elderly_alice@homejoy.com",
            "password": "Password123!"
        })
        alice_headers = {"Authorization": f"Bearer {alice_login.json()['access_token']}"}
        res_admin_forbidden = self.client.get("/api/admin/dashboard/stats", headers=alice_headers)
        self.assertEqual(res_admin_forbidden.status_code, 403)

        # Admin tries to access elderly self-service route
        res_elderly_forbidden = self.client.get("/api/elderly/me", headers=self.admin_headers)
        self.assertEqual(res_elderly_forbidden.status_code, 403)


if __name__ == "__main__":
    unittest.main()
