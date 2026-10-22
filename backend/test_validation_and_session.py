import unittest
from datetime import timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.security import create_access_token
from app.database import users_collection

class TestValidationAndSession(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # Ensure a clean test elderly user exists
        users_collection.delete_many({"email": "test_session_user@homejoy.com"})
        reg_res = cls.client.post("/api/auth/register", json={
            "full_name": "Session Tester",
            "email": "test_session_user@homejoy.com",
            "phone": "+1-555-8888",
            "password": "ValidPassword123!",
            "role": "Elderly",
            "guardian_email": "guardian.tester@example.com",
            "guardian_report_consent": True
        })
        assert reg_res.status_code == 201

        # Login to obtain a genuine active session
        login_res = cls.client.post("/api/auth/login", json={
            "email": "test_session_user@homejoy.com",
            "password": "ValidPassword123!"
        })
        assert login_res.status_code == 200
        cls.token = login_res.json()["access_token"]
        cls.auth_headers = {"Authorization": f"Bearer {cls.token}"}

    @classmethod
    def tearDownClass(cls):
        users_collection.delete_many({"email": "test_session_user@homejoy.com"})

    # =========================================================================
    # 1. INPUT VALIDATION TESTS
    # =========================================================================

    def test_01_validation_invalid_email(self):
        """Invalid email formats must be rejected by FastAPI / Pydantic with 422"""
        res = self.client.post("/api/auth/register", json={
            "full_name": "Bad Email",
            "email": "not-an-email-at-all",
            "password": "ValidPassword123!",
            "role": "Elderly"
        })
        self.assertEqual(res.status_code, 422)

    def test_02_validation_short_password(self):
        """Password shorter than 6 characters must be rejected with 422"""
        res = self.client.post("/api/auth/register", json={
            "full_name": "Short Pass",
            "email": "shortpass@homejoy.com",
            "password": "123",
            "role": "Elderly"
        })
        self.assertEqual(res.status_code, 422)

    def test_03_validation_vitals_diastolic_greater_than_systolic(self):
        """Diastolic BP >= Systolic BP must be rejected with 422 validator error"""
        res = self.client.post("/api/elderly/me/vitals", json={
            "systolic": 110,
            "diastolic": 130,  # Invalid: diastolic is greater than systolic!
            "oxygen_saturation": 98,
            "date": "2026-10-09"
        }, headers=self.auth_headers)
        self.assertEqual(res.status_code, 422)
        errors = str(res.json())
        self.assertIn("Diastolic blood pressure must be lower than systolic pressure", errors)

    def test_04_validation_vitals_out_of_range(self):
        """Oxygen saturation > 100% or systolic > 250 must be rejected with 422"""
        res = self.client.post("/api/elderly/me/vitals", json={
            "systolic": 350,   # Out of clinical bounds
            "diastolic": 80,
            "oxygen_saturation": 105, # Impossible SpO2
            "date": "2026-10-09"
        }, headers=self.auth_headers)
        self.assertEqual(res.status_code, 422)

    def test_05_validation_wellness_invalid_options(self):
        """Invalid categorical options in daily check-in must be rejected with 422"""
        res = self.client.post("/api/elderly/me/checkins", json={
            "date": "2026-10-09",
            "medication_taken": "Bogus Choice",  # Not in ALLOWED_OPTIONS
            "appetite": "Good",
            "sleep_quality": "Good",
            "mobility_difficulty": "No difficulty",
            "mood": "Good"
        }, headers=self.auth_headers)
        self.assertEqual(res.status_code, 422)

    # =========================================================================
    # 2. SESSION & JWT SECURITY TESTS
    # =========================================================================

    def test_06_session_active_token_authentication(self):
        """Valid active token allows access to /api/auth/me and never leaks password hash"""
        res = self.client.get("/api/auth/me", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], "test_session_user@homejoy.com")
        self.assertNotIn("hashed_password", data)
        self.assertNotIn("password", data)

    def test_07_session_missing_token_rejection(self):
        """Accessing protected routes without Authorization header returns 401 Unauthorized"""
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)
        self.assertIn("Not authenticated", res.json()["detail"])

    def test_08_session_tampered_token_rejection(self):
        """Tampering with a single character in the JWT signature must return 401 Unauthorized"""
        tampered_token = self.token[:-4] + "xxxx"
        res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("Could not validate credentials", res.json()["detail"])

    def test_09_session_expired_token_rejection(self):
        """Expired JWT token must be rejected with 401 Unauthorized (automatic expiration guard)"""
        # Mint a token expired 10 minutes ago
        expired_token = create_access_token(
            data={"sub": "test_session_user@homejoy.com", "role": "Elderly"},
            expires_delta=timedelta(minutes=-10)
        )
        res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("Could not validate credentials", res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
