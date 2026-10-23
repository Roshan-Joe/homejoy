import unittest
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.database import users_collection

class TestSecurityFixes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        users_collection.delete_many({"email": {"$in": [
            "sec_test_admin@test.com",
            "sec_test_doctor@test.com",
            "sec_test_cg@test.com",
            "sec_test_eld@test.com"
        ]}})

    @classmethod
    def tearDownClass(cls):
        users_collection.delete_many({"email": {"$in": [
            "sec_test_admin@test.com",
            "sec_test_doctor@test.com",
            "sec_test_cg@test.com",
            "sec_test_eld@test.com"
        ]}})

    # 1. Role Guards on Public Signup
    def test_01_public_signup_rejects_admin_role(self):
        """User cannot register as Admin via /api/auth/register"""
        res = self.client.post("/api/auth/register", json={
            "full_name": "Attacker Admin",
            "email": "sec_test_admin@test.com",
            "password": "Password123!",
            "role": "Admin"
        })
        self.assertEqual(res.status_code, 403)
        self.assertIn("restricted", res.json()["detail"].lower())

    def test_02_public_signup_rejects_arbitrary_roles(self):
        """User cannot register with Doctor or arbitrary roles"""
        res = self.client.post("/api/auth/register", json={
            "full_name": "Attacker Doctor",
            "email": "sec_test_doctor@test.com",
            "password": "Password123!",
            "role": "Doctor"
        })
        self.assertEqual(res.status_code, 403)
        self.assertIn("restricted", res.json()["detail"].lower())

    def test_03_public_signup_allows_elderly_and_caregiver(self):
        """Public signup allows Elderly and rejects Caregiver (Caregiver provisioned by Admin)"""
        res_eld = self.client.post("/api/auth/register", json={
            "full_name": "Valid Elderly",
            "email": "sec_test_eld@test.com",
            "password": "Password123!",
            "role": "Elderly",
            "guardian_email": "guardian.sec@example.com",
            "guardian_report_consent": True
        })
        self.assertEqual(res_eld.status_code, 201)
        self.assertEqual(res_eld.json()["user"]["role"], "Elderly")

        res_cg = self.client.post("/api/auth/register", json={
            "full_name": "Attempted Caregiver",
            "email": "sec_test_cg@test.com",
            "password": "Password123!",
            "role": "Caregiver"
        })
        self.assertEqual(res_cg.status_code, 403)
        self.assertIn("restricted", res_cg.json()["detail"].lower())

    # 2. Seed-Admin Route Removed
    def test_04_seed_admin_route_is_removed(self):
        """POST /api/admin/seed-admin endpoint does not exist (404/405)"""
        res = self.client.post("/api/admin/seed-admin")
        self.assertIn(res.status_code, [404, 405])

    # 3. Google Login Security (aud and email_verified check)
    @patch("urllib.request.urlopen")
    def test_05_google_login_rejects_aud_mismatch(self, mock_urlopen):
        """Google token with mismatched aud must be rejected with 401"""
        fake_payload = {
            "aud": "rogue_client_id.apps.googleusercontent.com",
            "email": "google_test@homejoy.com",
            "email_verified": True,
            "sub": "123456789"
        }
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = bytes(str(fake_payload).replace("'", '"').replace("True", "true"), "utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        res = self.client.post("/api/auth/google", json={
            "credential": "fake_token",
            "role": "Elderly"
        })
        self.assertEqual(res.status_code, 401)
        self.assertIn("aud", res.json()["detail"].lower())

    @patch("urllib.request.urlopen")
    def test_06_google_login_rejects_unverified_email(self, mock_urlopen):
        """Google token with unverified email must be rejected with 401"""
        from app.config import GOOGLE_CLIENT_ID
        fake_payload = {
            "aud": GOOGLE_CLIENT_ID,
            "email": "unverified@homejoy.com",
            "email_verified": False,
            "sub": "123456789"
        }
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = bytes(str(fake_payload).replace("'", '"').replace("False", "false"), "utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        res = self.client.post("/api/auth/google", json={
            "credential": "fake_token",
            "role": "Elderly"
        })
        self.assertEqual(res.status_code, 401)
        self.assertIn("verified", res.json()["detail"].lower())

    @patch("urllib.request.urlopen")
    def test_07_google_login_rejects_admin_role_request(self, mock_urlopen):
        """Google login requesting Admin role must be rejected with 403"""
        from app.config import GOOGLE_CLIENT_ID
        fake_payload = {
            "aud": GOOGLE_CLIENT_ID,
            "email": "google_admin_wannabe@homejoy.com",
            "email_verified": True,
            "sub": "999888777"
        }
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = bytes(str(fake_payload).replace("'", '"').replace("True", "true"), "utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        res = self.client.post("/api/auth/google", json={
            "credential": "fake_token",
            "role": "Admin"
        })
        self.assertEqual(res.status_code, 403)
        self.assertIn("restricted", res.json()["detail"].lower())

    # 4. CORS Wildcard Check
    def test_08_cors_does_not_permit_wildcard_with_credentials(self):
        """CORS preflight request must not allow '*' origin with allow_credentials"""
        res = self.client.options(
            "/api/auth/login",
            headers={
                "Origin": "http://evil-site.com",
                "Access-Control-Request-Method": "POST"
            }
        )
        allow_origin = res.headers.get("access-control-allow-origin")
        self.assertNotEqual(allow_origin, "*")

if __name__ == "__main__":
    unittest.main()
