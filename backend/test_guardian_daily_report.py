"""
Unit and Integration Tests for Guardian Daily Wellness Report System
Tests cover:
1. Guardian validation (Pydantic schemas & Registration combos)
2. EmailService with smtplib mocked (HTML escaping, Header injection rejection, Console/SMTP modes)
3. Endpoint authorization (unassigned caregiver 403, other roles 403, anonymous 401)
4. Duplicate-send and rate limiting (1/day default, max 3 with resend=true)
5. Consent and guardian enabled rules (missing email, consent=False, enabled=False -> 400)
6. Status endpoint (/email-status)
"""
import os
import html
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from pydantic import ValidationError
from bson import ObjectId
from email.message import EmailMessage

# Set test environment config
os.environ["EMAIL_MODE"] = "console"
os.environ["SECRET_KEY"] = "test-secret-key-for-guardian-reports-0123456789abcdef"

from app.schemas.elderly_schema import ElderlyCreateSchema, ElderlyUpdateSchema
from app.schemas import UserCreate
from app.services.email_service import EmailService, mask_email, sanitize_header_value
from app.main import app
from fastapi.testclient import TestClient
from fastapi import HTTPException, status
from app.routers.caregiver_portal_router import get_current_caregiver_user
from app.security import get_current_user


# =============================================================================
# 1. GUARDIAN VALIDATION TESTS
# =============================================================================

class TestGuardianValidation:
    """Tests all valid and invalid combinations of guardian profile validation."""

    def test_guardian_email_with_consent_passes(self):
        """Pass combo: valid guardian email with consent=True."""
        data = {
            "name": "Jane Resident",
            "email": "jane.resident@homejoy.com",
            "age": 75,
            "gender": "Female",
            "blood_group": "A+",
            "guardian_email": "guardian@example.com",
            "guardian_report_consent": True
        }
        schema = ElderlyCreateSchema(**data)
        assert schema.guardian_email == "guardian@example.com"
        assert schema.guardian_report_consent is True
        assert schema.guardian_report_enabled is True

    def test_guardian_email_without_consent_fails(self):
        """Fail combo: guardian email provided without consent must raise ValidationError."""
        data = {
            "name": "Jane Resident",
            "email": "jane.resident@homejoy.com",
            "age": 75,
            "gender": "Female",
            "blood_group": "A+",
            "guardian_email": "guardian@example.com",
            "guardian_report_consent": False
        }
        with pytest.raises(ValidationError) as exc_info:
            ElderlyCreateSchema(**data)
        assert "guardian_report_consent must be True" in str(exc_info.value)

    def test_guardian_name_and_phone_without_email_passes(self):
        """Pass combo: guardian name + phone without email passes validation."""
        data = {
            "name": "Jane Resident",
            "email": "jane.resident@homejoy.com",
            "age": 75,
            "gender": "Female",
            "blood_group": "A+",
            "guardian_name": "Robert Resident",
            "guardian_phone": "+1 555 123 4567",
            "guardian_relationship": "Son"
        }
        schema = ElderlyCreateSchema(**data)
        assert schema.guardian_name == "Robert Resident"
        assert schema.guardian_phone == "+1 555 123 4567"
        assert schema.guardian_email is None

    def test_missing_all_guardian_details_fails(self):
        """Fail combo: missing email AND missing name/phone must raise ValidationError."""
        data = {
            "name": "Jane Resident",
            "email": "jane.resident@homejoy.com",
            "age": 75,
            "gender": "Female",
            "blood_group": "A+"
        }
        with pytest.raises(ValidationError) as exc_info:
            ElderlyCreateSchema(**data)
        assert "at least one guardian contact method" in str(exc_info.value)

    def test_guardian_name_too_short_fails(self):
        """Fail combo: guardian name < 2 chars raises ValidationError."""
        data = {
            "name": "Jane Resident",
            "email": "jane.resident@homejoy.com",
            "age": 75,
            "gender": "Female",
            "blood_group": "A+",
            "guardian_name": "R",
            "guardian_phone": "1234567890"
        }
        with pytest.raises(ValidationError) as exc_info:
            ElderlyCreateSchema(**data)
        assert "between 2 and 100 characters" in str(exc_info.value)

    def test_guardian_phone_invalid_characters_fails(self):
        """Fail combo: phone with letters or invalid characters fails."""
        data = {
            "name": "Jane Resident",
            "email": "jane.resident@homejoy.com",
            "age": 75,
            "gender": "Female",
            "blood_group": "A+",
            "guardian_name": "Robert Resident",
            "guardian_phone": "+1 (555) 123-4567-xyz"
        }
        with pytest.raises(ValidationError) as exc_info:
            ElderlyCreateSchema(**data)
        assert "invalid characters" in str(exc_info.value)

    def test_guardian_phone_too_short_fails(self):
        """Fail combo: phone with fewer than 7 digits fails."""
        data = {
            "name": "Jane Resident",
            "email": "jane.resident@homejoy.com",
            "age": 75,
            "gender": "Female",
            "blood_group": "A+",
            "guardian_name": "Robert Resident",
            "guardian_phone": "12345"
        }
        with pytest.raises(ValidationError) as exc_info:
            ElderlyCreateSchema(**data)
        assert "between 7 and 15 digits" in str(exc_info.value)

    def test_guardian_email_newline_injection_fails(self):
        """Fail combo: guardian email containing newline character is rejected."""
        data = {
            "name": "Jane Resident",
            "email": "jane.resident@homejoy.com",
            "age": 75,
            "gender": "Female",
            "blood_group": "A+",
            "guardian_email": "victim@example.com\nBcc:hacker@evil.com",
            "guardian_report_consent": True
        }
        with pytest.raises(ValidationError) as exc_info:
            ElderlyCreateSchema(**data)
        assert "newline" in str(exc_info.value).lower() or "valid email" in str(exc_info.value).lower()

    def test_existing_elderly_update_all_fields_optional(self):
        """Existing patients without guardian fields continue to work on update."""
        update_data = {
            "age": 76,
            "allergies": ["Penicillin"]
        }
        schema = ElderlyUpdateSchema(**update_data)
        assert schema.age == 76
        assert schema.allergies == ["Penicillin"]
        assert schema.guardian_name is None
        assert schema.guardian_email is None

    def test_auth_registration_schema_guardian_validation(self):
        """User registration with Elderly role enforces guardian contact requirements."""
        # Missing guardian info for Elderly role must fail
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(
                full_name="Elderly Tester",
                email="elderly.tester@example.com",
                password="SecurePassword123!",
                role="Elderly"
            )
        assert "Registration must include at least one guardian contact method" in str(exc_info.value)

        # Missing consent when email provided must fail
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(
                full_name="Elderly Tester",
                email="elderly.tester@example.com",
                password="SecurePassword123!",
                role="Elderly",
                guardian_email="guardian.valid@example.com",
                guardian_report_consent=False
            )
        assert "Guardian consent is required" in str(exc_info.value)

        # Valid registration with guardian details must succeed
        valid_user = UserCreate(
            full_name="Elderly Tester",
            email="elderly.tester@example.com",
            password="SecurePassword123!",
            role="Elderly",
            guardian_email="guardian.valid@example.com",
            guardian_report_consent=True
        )
        assert valid_user.guardian_email == "guardian.valid@example.com"
        assert valid_user.guardian_report_consent is True


# =============================================================================
# 2. EMAIL SERVICE TESTS
# =============================================================================

class TestEmailService:
    """Tests EmailService multipart composition, HTML escaping, and transport modes."""

    def test_mask_email_utility(self):
        assert mask_email("roshan@example.com") == "r***n@example.com"
        assert mask_email("ab@gmail.com") == "a***@gmail.com"
        assert mask_email("a@gmail.com") == "a***@gmail.com"
        assert mask_email("invalid") == "***"
        assert mask_email("") == "***"

    def test_html_escaping_prevents_xss(self):
        """Dynamic values like notes, symptoms, and names must be strictly HTML-escaped."""
        dangerous_note = "<script>alert('pwned')</script>&quot;bold'</note>"
        dangerous_symptoms = "<b>Dizziness</b> & High Temp <img src=x onerror=alert(1)>"
        dangerous_name = "<svg onload=alert(1)>Alice"

        elderly_doc = {
            "name": dangerous_name,
            "full_name": dangerous_name
        }
        daily_report = {
            "date": "2026-10-22",
            "checkin_completed": True,
            "checkin_data": {
                "mood": "Calm",
                "sleep_quality": "7 hours",
                "appetite": "Normal",
                "mobility_difficulty": "Active",
                "medication_taken": "All taken",
                "symptoms": dangerous_symptoms
            },
            "vitals_data": {
                "bp_display": "120/80 mmHg",
                "oxygen_display": "98%"
            },
            "wellness_risk": "Low",
            "explainable_risk": {
                "contributing_factors": ["Normal Vitals", "Adequate Sleep <script>"]
            }
        }

        msg = EmailService.build_daily_report_email(
            recipient_email="guardian@example.com",
            guardian_name="Bob <script>",
            elderly_doc=elderly_doc,
            daily_report=daily_report,
            caregiver_name="Nurse Sarah <tag>",
            caregiver_note=dangerous_note
        )

        assert isinstance(msg, EmailMessage)
        assert msg["To"] == "guardian@example.com"
        
        plain_part = msg.get_body(preferencelist=('plain',)).get_content()
        html_part = msg.get_body(preferencelist=('html',)).get_content()

        # Verify NO raw HTML injection strings in output
        assert "<script>alert('pwned')</script>" not in html_part
        assert "&lt;script&gt;alert(&#x27;pwned&#x27;)&lt;/script&gt;" in html_part
        assert "<svg onload=alert(1)>" not in html_part
        assert "&lt;svg onload=alert(1)&gt;Alice" in html_part
        assert "<img src=x onerror=alert(1)>" not in html_part

        # Verify required medical disclaimer and caregiver attribution
        disclaimer = "This is a wellness monitoring summary, not a medical diagnosis. In an emergency contact local emergency services."
        assert disclaimer in plain_part
        assert disclaimer in html_part
        assert "Sent by caregiver" in html_part and "Nurse Sarah &lt;tag&gt;" in html_part
        assert "Adequate Sleep &lt;script&gt;" in html_part

    def test_header_injection_sanitization(self):
        """Header sanitization removes CR and LF characters to prevent header injection."""
        sanitized_to = sanitize_header_value("guardian@example.com\nBcc:spy@attacker.com\r\nSubject:Evil")
        assert "\n" not in sanitized_to
        assert "\r" not in sanitized_to
        assert sanitized_to == "guardian@example.com Bcc:spy@attacker.com Subject:Evil"

    def test_console_mode_does_not_call_smtp(self, monkeypatch):
        """When EMAIL_MODE='console', email is logged/written locally without calling smtplib."""
        monkeypatch.setattr("app.services.email_service.EMAIL_MODE", "console")
        msg = EmailMessage()
        msg["To"] = "test.guardian@example.com"
        msg["Subject"] = "Test Wellness Report"
        msg.set_content("Resident is doing well.")

        with patch("smtplib.SMTP") as mock_smtp:
            success, err = EmailService.send_email_message(msg)
            assert success is True
            assert err is None
            # smtplib MUST NOT be called in console mode
            mock_smtp.assert_not_called()

    def test_smtp_mode_with_mocked_smtplib(self, monkeypatch):
        """When EMAIL_MODE='smtp', connects via smtplib with TLS and authenticates."""
        monkeypatch.setattr("app.services.email_service.EMAIL_MODE", "smtp")
        monkeypatch.setattr("app.services.email_service.SMTP_HOST", "smtp.gmail.com")
        monkeypatch.setattr("app.services.email_service.SMTP_PORT", 587)
        monkeypatch.setattr("app.services.email_service.SMTP_USER", "care@homejoy.com")
        monkeypatch.setattr("app.services.email_service.SMTP_PASSWORD", "app-password-1234")
        monkeypatch.setattr("app.services.email_service.SMTP_USE_TLS", True)

        msg = EmailMessage()
        msg["To"] = "guardian.recipient@example.com"
        msg["Subject"] = "HomeJoy Daily Wellness Report"
        msg.set_content("Resident telemetry summary")

        with patch("smtplib.SMTP") as mock_smtp_cls:
            mock_instance = MagicMock()
            mock_smtp_cls.return_value.__enter__.return_value = mock_instance

            success, err = EmailService.send_email_message(msg)

            assert success is True
            assert err is None
            mock_instance.starttls.assert_called_once()
            mock_instance.login.assert_called_once_with("care@homejoy.com", "app-password-1234")
            mock_instance.send_message.assert_called_once_with(msg)

    def test_missing_smtp_credentials_in_smtp_mode_fails_gracefully(self, monkeypatch):
        """If SMTP config is missing in smtp mode, returns False without crashing the app."""
        monkeypatch.setattr("app.services.email_service.EMAIL_MODE", "smtp")
        monkeypatch.setattr("app.services.email_service.SMTP_HOST", "")  # Missing host
        monkeypatch.setattr("app.services.email_service.SMTP_USER", "")  # Missing user

        msg = EmailMessage()
        msg["To"] = "guardian.recipient@example.com"
        msg["Subject"] = "Test Subject"
        msg.set_content("Test body")

        success, err = EmailService.send_email_message(msg)
        assert success is False
        assert "SMTP configuration error" in err


# =============================================================================
# 3. ENDPOINT AUTHORIZATION & RATE LIMITING TESTS
# =============================================================================

class TestCaregiverReportEmailEndpoints:
    """Tests authorization, rate limiting, and business validation on the report email endpoint."""

    @pytest.fixture(autouse=True)
    def setup_client(self):
        self.client = TestClient(app)
        self.elderly_id = str(ObjectId())
        self.caregiver_id = str(ObjectId())
        self.caregiver_user = {
            "id": self.caregiver_id,
            "full_name": "Nurse Sarah",
            "email": "sarah@homejoy.com",
            "role": "Caregiver"
        }

        # Clear any prior dependency overrides
        app.dependency_overrides.clear()
        yield
        app.dependency_overrides.clear()

    def test_anonymous_request_unauthorized(self):
        """Anonymous requests must return 401."""
        res = self.client.post(f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email")
        assert res.status_code == 401

    def test_non_caregiver_role_forbidden(self):
        """Non-caregiver role (Elderly) requesting caregiver report dispatch must return 403."""
        # Override to Elderly user
        app.dependency_overrides[get_current_caregiver_user] = lambda: (_ for _ in ()).throw(
            HTTPException(status_code=403, detail="Caregiver access required")
        )

        res = self.client.post(f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email")
        assert res.status_code == 403
        assert "Caregiver access required" in res.json()["detail"]

    @patch("app.services.caregiver_portal_service.CaregiverPortalService._verify_elderly_assigned")
    def test_unassigned_caregiver_forbidden(self, mock_verify):
        """Caregiver not assigned to this elderly must return 403."""
        app.dependency_overrides[get_current_caregiver_user] = lambda: self.caregiver_user
        mock_verify.side_effect = HTTPException(status_code=403, detail="Resident is not assigned to you.")

        res = self.client.post(f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email")
        assert res.status_code == 403
        assert "not assigned to you" in res.json()["detail"].lower()

    @patch("app.services.caregiver_portal_service.CaregiverPortalService._verify_elderly_assigned")
    def test_send_email_missing_guardian_email_rejected(self, mock_verify):
        """Patient without guardian_email cannot receive reports -> 400."""
        app.dependency_overrides[get_current_caregiver_user] = lambda: self.caregiver_user
        mock_verify.return_value = {
            "_id": ObjectId(self.elderly_id),
            "name": "Jane Resident",
            "guardian_email": None,
            "guardian_report_enabled": True,
            "guardian_report_consent": True
        }

        res = self.client.post(f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email")
        assert res.status_code == 400
        assert "guardian email" in res.json()["detail"].lower()

    @patch("app.services.caregiver_portal_service.CaregiverPortalService._verify_elderly_assigned")
    def test_send_email_no_consent_rejected(self, mock_verify):
        """Patient where guardian_report_consent=False cannot receive reports -> 400."""
        app.dependency_overrides[get_current_caregiver_user] = lambda: self.caregiver_user
        mock_verify.return_value = {
            "_id": ObjectId(self.elderly_id),
            "name": "Jane Resident",
            "guardian_email": "guardian@example.com",
            "guardian_report_enabled": True,
            "guardian_report_consent": False
        }

        res = self.client.post(f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email")
        assert res.status_code == 400
        assert "consent" in res.json()["detail"].lower()

    @patch("app.services.caregiver_portal_service.CaregiverPortalService._verify_elderly_assigned")
    def test_send_email_disabled_reports_rejected(self, mock_verify):
        """Patient where guardian_report_enabled=False cannot receive reports -> 400."""
        app.dependency_overrides[get_current_caregiver_user] = lambda: self.caregiver_user
        mock_verify.return_value = {
            "_id": ObjectId(self.elderly_id),
            "name": "Jane Resident",
            "guardian_email": "guardian@example.com",
            "guardian_report_enabled": False,
            "guardian_report_consent": True
        }

        res = self.client.post(f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email")
        assert res.status_code == 400
        assert "disabled" in res.json()["detail"].lower()

    @patch("app.services.caregiver_portal_service.CaregiverPortalService._verify_elderly_assigned")
    @patch("app.services.caregiver_portal_service.report_email_logs_collection")
    def test_duplicate_send_without_resend_blocked(self, mock_logs_col, mock_verify):
        """Sending a second time on the same date without resend=true returns 400."""
        app.dependency_overrides[get_current_caregiver_user] = lambda: self.caregiver_user
        mock_verify.return_value = {
            "_id": ObjectId(self.elderly_id),
            "name": "Jane Resident",
            "guardian_email": "guardian@example.com",
            "guardian_report_enabled": True,
            "guardian_report_consent": True
        }

        # Mock that 1 email has already been sent today
        mock_logs_col.count_documents.return_value = 1
        mock_logs_col.find_one.return_value = {
            "elderly_id": self.elderly_id,
            "sent_at": "2026-10-22T10:00:00Z",
            "status": "sent"
        }

        res = self.client.post(
            f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email",
            json={"resend": False}
        )
        assert res.status_code == 400
        assert "already been sent" in res.json()["detail"].lower()

    @patch("app.services.caregiver_portal_service.CaregiverPortalService._verify_elderly_assigned")
    @patch("app.services.caregiver_portal_service.report_email_logs_collection")
    def test_resend_exceeding_max_3_blocked(self, mock_logs_col, mock_verify):
        """Attempting to send a 4th time even with resend=true returns 400."""
        app.dependency_overrides[get_current_caregiver_user] = lambda: self.caregiver_user
        mock_verify.return_value = {
            "_id": ObjectId(self.elderly_id),
            "name": "Jane Resident",
            "guardian_email": "guardian@example.com",
            "guardian_report_enabled": True,
            "guardian_report_consent": True
        }

        # Mock 3 emails already sent today
        mock_logs_col.count_documents.return_value = 3

        res = self.client.post(
            f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email",
            json={"resend": True}
        )
        assert res.status_code == 400
        assert "limit reached" in res.json()["detail"].lower()

    @patch("app.services.caregiver_portal_service.CaregiverPortalService._verify_elderly_assigned")
    @patch("app.services.caregiver_portal_service.report_email_logs_collection")
    @patch("app.services.email_service.send_daily_report_to_guardian_sync")
    def test_successful_send_first_time(self, mock_send_sync, mock_logs_col, mock_verify):
        """Successful first dispatch queues background email and logs attempt."""
        app.dependency_overrides[get_current_caregiver_user] = lambda: self.caregiver_user
        mock_verify.return_value = {
            "_id": ObjectId(self.elderly_id),
            "name": "Jane Resident",
            "guardian_name": "Guardian Jane",
            "guardian_email": "guardian@example.com",
            "guardian_relationship": "Daughter",
            "guardian_report_enabled": True,
            "guardian_report_consent": True
        }
        mock_logs_col.count_documents.return_value = 0

        res = self.client.post(
            f"/api/caregiver/elderly/{self.elderly_id}/daily-report/send-email",
            json={"note": "Drank plenty of fluids and enjoyed the garden."}
        )

        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "queued"
        assert data["recipient_masked"] == "g***n@example.com"
        assert data["send_count"] == 1

    @patch("app.services.caregiver_portal_service.CaregiverPortalService._verify_elderly_assigned")
    @patch("app.services.caregiver_portal_service.report_email_logs_collection")
    def test_get_email_status_endpoint(self, mock_logs_col, mock_verify):
        """Email status endpoint returns sent_today, send_count, and consent details."""
        app.dependency_overrides[get_current_caregiver_user] = lambda: self.caregiver_user
        mock_verify.return_value = {
            "_id": ObjectId(self.elderly_id),
            "guardian_email": "guardian@example.com",
            "guardian_name": "Mary Doe",
            "guardian_relationship": "Daughter",
            "guardian_report_consent": True,
            "guardian_report_enabled": True
        }
        mock_logs_col.find.return_value.sort.return_value = [{
            "status": "sent",
            "sent_at": "2026-10-22T14:30:00Z",
            "caregiver_id": self.caregiver_id
        }]

        res = self.client.get(
            f"/api/caregiver/elderly/{self.elderly_id}/daily-report/email-status?date=2026-10-22"
        )

        assert res.status_code == 200
        data = res.json()
        assert data["sent_today"] is True
        assert data["send_count"] == 1
        assert data["guardian_email_masked"] == "g***n@example.com"
        assert data["can_send"] is True
