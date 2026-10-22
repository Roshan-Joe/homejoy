"""
HomeJoy Email Service for Guardian Daily Wellness Reports
=========================================================
Architectural Rules:
- 100% Free: uses Python standard library `smtplib` and `email.message.EmailMessage`.
- Zero paid APIs / services.
- Clean separation: supports EMAIL_MODE='console' (local file/stdout logging) and 'smtp' (e.g. Gmail App Password).
- Safe: all dynamic values are HTML-escaped with html.escape(), header fields sanitized against CRLF injection.
- Reuses DailyReportService.get_daily_report data.
"""

import os
import smtplib
import html
import re
from email.message import EmailMessage
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List

from app.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM,
    SMTP_USE_TLS,
    EMAIL_MODE
)
from app.services.daily_report_service import DailyReportService


def sanitize_header_value(val: str) -> str:
    """Removes CR and LF characters to prevent header injection attacks."""
    if not val:
        return ""
    return re.sub(r"[\r\n]+", " ", str(val)).strip()


def mask_email(email: str) -> str:
    """Masks an email address for safe logging/display (e.g. g***@gmail.com)."""
    if not email or "@" not in email:
        return "***"
    parts = email.split("@", 1)
    user, domain = parts[0], parts[1]
    if len(user) <= 2:
        masked_user = user[0] + "***" if user else "***"
    else:
        masked_user = user[0] + "***" + user[-1]
    return f"{masked_user}@{domain}"


class EmailService:

    @staticmethod
    def build_daily_report_email(
        recipient_email: str,
        guardian_name: str,
        elderly_doc: Dict[str, Any],
        daily_report: Dict[str, Any],
        caregiver_name: str,
        caregiver_note: Optional[str] = None
    ) -> EmailMessage:
        """
        Builds a safe, multipart (plain text + modern HTML) email message.
        All user/patient-provided strings are strictly HTML-escaped.
        """
        clean_to = sanitize_header_value(recipient_email)
        clean_from = sanitize_header_value(SMTP_FROM or SMTP_USER or "care@homejoy.care")
        
        elderly_name = elderly_doc.get("full_name") or elderly_doc.get("name") or "Elderly Resident"
        report_date = daily_report.get("date") or datetime.now().strftime("%Y-%m-%d")
        
        subject = sanitize_header_value(f"HomeJoy Daily Wellness Report: {elderly_name} ({report_date})")

        # Extract telemetry details
        checkin_data = daily_report.get("checkin_data") or {}
        vitals_data = daily_report.get("vitals_data") or {}
        checkin_done = daily_report.get("checkin_completed", False)
        
        mood = checkin_data.get("mood") or "Not recorded"
        sleep = checkin_data.get("sleep_quality") or "Not recorded"
        appetite = checkin_data.get("appetite") or "Not recorded"
        mobility = checkin_data.get("mobility_difficulty") or "Not recorded"
        med_adherence = daily_report.get("medication_adherence") or checkin_data.get("medication_taken") or "Not recorded"
        symptoms = checkin_data.get("symptoms") or "None reported"

        bp_display = vitals_data.get("bp_display") or "Not recorded"
        oxygen_display = vitals_data.get("oxygen_display") or "Not recorded"
        
        wellness_risk = daily_report.get("wellness_risk") or "Low"
        
        # Extract top 3 contributing factors from explainable_risk
        contributing_factors: List[str] = []
        explainable = daily_report.get("explainable_risk") or {}
        raw_factors = explainable.get("contributing_factors") or []
        for factor in raw_factors[:3]:
            if isinstance(factor, str):
                contributing_factors.append(factor)
            elif isinstance(factor, dict):
                contributing_factors.append(factor.get("label") or factor.get("reason") or str(factor))

        if not contributing_factors:
            contributing_factors = ["All daily wellness metrics within normal baseline limits."]

        # Risk colors for HTML template
        risk_color_map = {
            "Low": "#059669",
            "Medium": "#d97706",
            "Moderate": "#d97706",
            "High": "#dc2626"
        }
        risk_color = risk_color_map.get(wellness_risk, "#059669")
        risk_bg = "#f0fdf4" if wellness_risk == "Low" else ("#fffbeb" if wellness_risk in ["Medium", "Moderate"] else "#fef2f2")

        # HTML Escape dynamic contents
        esc_guardian_name = html.escape(guardian_name or "Designated Guardian")
        esc_elderly_name = html.escape(elderly_name)
        esc_report_date = html.escape(report_date)
        esc_mood = html.escape(str(mood))
        esc_sleep = html.escape(str(sleep))
        esc_appetite = html.escape(str(appetite))
        esc_mobility = html.escape(str(mobility))
        esc_med_adherence = html.escape(str(med_adherence))
        esc_symptoms = html.escape(str(symptoms))
        esc_bp = html.escape(str(bp_display))
        esc_spo2 = html.escape(str(oxygen_display))
        esc_risk = html.escape(str(wellness_risk))
        esc_caregiver = html.escape(caregiver_name or "Assigned Care Team")
        esc_note = html.escape(caregiver_note.strip()) if caregiver_note and caregiver_note.strip() else None

        disclaimer = "This is a wellness monitoring summary, not a medical diagnosis. In an emergency contact local emergency services."

        # Plain Text Body
        text_lines = [
            f"HOMEJOY DAILY WELLNESS REPORT",
            f"Resident: {elderly_name}",
            f"Date: {report_date}",
            f"Recipient: {guardian_name or 'Guardian'}",
            "=" * 50,
            f"CHECK-IN STATUS: {'Completed' if checkin_done else 'Pending / Not Completed'}",
            f"WELLNESS RISK: {wellness_risk}",
            f"Mood: {mood}",
            f"Sleep: {sleep}",
            f"Appetite: {appetite}",
            f"Mobility: {mobility}",
            f"Medication Adherence: {med_adherence}",
            f"Symptoms: {symptoms}",
            "-" * 50,
            f"VITALS:",
            f"Blood Pressure: {bp_display}",
            f"Blood Oxygen (SpO2): {oxygen_display}",
            "-" * 50,
            f"KEY OBSERVATIONS / RISK FACTORS:",
        ]
        for f in contributing_factors:
            text_lines.append(f"• {f}")
        
        if esc_note:
            text_lines.extend([
                "-" * 50,
                f"CAREGIVER NOTE:",
                f"{caregiver_note.strip()}"
            ])

        text_lines.extend([
            "=" * 50,
            f"Sent by caregiver {caregiver_name} via HomeJoy",
            f"DISCLAIMER: {disclaimer}"
        ])
        plain_text_content = "\n".join(text_lines)

        # HTML Body
        factors_html = "".join([f"<li style='margin-bottom: 4px;'>{html.escape(f)}</li>" for f in contributing_factors])
        caregiver_note_html = ""
        if esc_note:
            caregiver_note_html = f"""
            <div style="margin-top: 20px; padding: 14px 18px; background-color: #f8fafc; border-left: 4px solid #0d9488; border-radius: 6px;">
                <div style="font-size: 12px; font-weight: 700; color: #0d9488; text-transform: uppercase; margin-bottom: 4px;">Personal Caregiver Note</div>
                <div style="font-size: 14px; color: #334155; font-style: italic;">"{esc_note}"</div>
            </div>
            """

        html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HomeJoy Daily Wellness Report</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 26px 30px; color: #ffffff;">
            <div style="font-size: 12px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; opacity: 0.9;">HomeJoy Eldercare Protocol</div>
            <h1 style="margin: 6px 0 2px 0; font-size: 22px; font-weight: 800;">Daily Wellness Summary</h1>
            <div style="font-size: 14px; opacity: 0.95;">Resident: <strong>{esc_elderly_name}</strong> &bull; Date: <strong>{esc_report_date}</strong></div>
        </div>

        <div style="padding: 26px 30px;">
            <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.5; color: #334155;">
                Dear <strong>{esc_guardian_name}</strong>,<br>
                Here is the verified daily health and routine check-in summary for <strong>{esc_elderly_name}</strong> recorded today by the care staff.
            </p>

            <!-- Status Banner -->
            <div style="display: flex; gap: 12px; margin-bottom: 22px;">
                <div style="flex: 1; padding: 14px; background-color: {'#ecfdf5' if checkin_done else '#fff7ed'}; border: 1px solid {'#a7f3d0' if checkin_done else '#fed7aa'}; border-radius: 10px;">
                    <div style="font-size: 11px; font-weight: 700; color: {'#047857' if checkin_done else '#c2410c'}; text-transform: uppercase;">Check-in Status</div>
                    <div style="font-size: 16px; font-weight: 800; color: {'#065f46' if checkin_done else '#9a3412'}; margin-top: 2px;">
                        {'✓ Completed' if checkin_done else '⏳ Pending / Missed'}
                    </div>
                </div>

                <div style="flex: 1; padding: 14px; background-color: {risk_bg}; border: 1px solid {risk_color}33; border-radius: 10px;">
                    <div style="font-size: 11px; font-weight: 700; color: {risk_color}; text-transform: uppercase;">Wellness Risk Level</div>
                    <div style="font-size: 16px; font-weight: 800; color: {risk_color}; margin-top: 2px;">
                        {esc_risk} Risk
                    </div>
                </div>
            </div>

            <!-- Core Indicators Table -->
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 22px;">
                <div style="background-color: #f8fafc; padding: 10px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">
                    Daily Activity & Vitals Log
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 16px; color: #64748b; width: 45%;">Medication Adherence</td>
                        <td style="padding: 10px 16px; font-weight: 700; color: #0d9488;">{esc_med_adherence}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 16px; color: #64748b;">Blood Pressure</td>
                        <td style="padding: 10px 16px; font-weight: 600; color: #1e293b;">{esc_bp}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 16px; color: #64748b;">Blood Oxygen (SpO2)</td>
                        <td style="padding: 10px 16px; font-weight: 600; color: #1e293b;">{esc_spo2}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 16px; color: #64748b;">Mood & Energy</td>
                        <td style="padding: 10px 16px; font-weight: 600; color: #1e293b;">{esc_mood}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 16px; color: #64748b;">Sleep Quality</td>
                        <td style="padding: 10px 16px; font-weight: 600; color: #1e293b;">{esc_sleep}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 16px; color: #64748b;">Appetite</td>
                        <td style="padding: 10px 16px; font-weight: 600; color: #1e293b;">{esc_appetite}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 16px; color: #64748b;">Mobility</td>
                        <td style="padding: 10px 16px; font-weight: 600; color: #1e293b;">{esc_mobility}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 16px; color: #64748b;">Reported Symptoms</td>
                        <td style="padding: 10px 16px; font-weight: 600; color: {'#dc2626' if symptoms != 'None reported' else '#1e293b'};">{esc_symptoms}</td>
                    </tr>
                </table>
            </div>

            <!-- Key Observations / Top Factors -->
            <div style="background-color: #f8fafc; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px; border: 1px solid #e2e8f0;">
                <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Key Observations & Contributing Factors</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #334155; line-height: 1.6;">
                    {factors_html}
                </ul>
            </div>

            <!-- Optional Caregiver Note -->
            {caregiver_note_html}

            <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.5;">
                <div>Sent by caregiver <strong>{esc_caregiver}</strong> via HomeJoy.</div>
                <div style="margin-top: 6px; font-size: 12px; color: #94a3b8; font-style: italic;">
                    <strong>Disclaimer:</strong> {html.escape(disclaimer)}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
        """

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = clean_from
        msg["To"] = clean_to
        msg.set_content(plain_text_content)
        msg.add_alternative(html_content, subtype="html")

        return msg

    @staticmethod
    def send_email_message(msg: EmailMessage) -> Tuple[bool, Optional[str]]:
        """
        Dispatches email via smtplib (when EMAIL_MODE='smtp') or writes to console/log
        (when EMAIL_MODE='console' for zero-cost demo).
        Returns (success: bool, error_message: Optional[str]).
        """
        mode = (EMAIL_MODE or "console").strip().lower()

        if mode == "console":
            # Zero-cost demo mode: log the email content clearly
            to_addr = msg["To"]
            subject = msg["Subject"]
            body_part = msg.get_body(preferencelist=('plain',))
            body_text = body_part.get_content() if body_part else str(msg)
            print(f"\n[EMAIL SERVICE - CONSOLE MODE]")
            print(f"To: {to_addr}")
            print(f"Subject: {subject}")
            print(f"--- Plaintext Preview ---")
            print(body_text[:400] + ("..." if len(body_text) > 400 else ""))
            print(f"[EMAIL SERVICE] Email successfully recorded in console mode.\n")

            # Write to scratch/demo log file for verification
            try:
                log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "scratch")
                os.makedirs(log_dir, exist_ok=True)
                log_path = os.path.join(log_dir, "sent_emails.log")
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(f"\n{'='*70}\nTIMESTAMP: {datetime.now(timezone.utc).isoformat()}\nTO: {to_addr}\nSUBJECT: {subject}\n{body_text}\n")
            except Exception as e:
                # Logging failure should not fail the response
                pass

            return True, None

        elif mode == "smtp":
            # Verify required SMTP config is present
            if not SMTP_USER or not SMTP_PASSWORD or not SMTP_HOST:
                err_msg = "SMTP configuration error: SMTP_USER, SMTP_PASSWORD, or SMTP_HOST missing in .env"
                print(f"[ERROR] {err_msg}")
                return False, err_msg

            try:
                if SMTP_USE_TLS:
                    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                        server.starttls()
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.send_message(msg)
                else:
                    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.send_message(msg)

                return True, None
            except Exception as e:
                err = f"SMTP transmission failed: {str(e)}"
                print(f"[ERROR] {err}")
                return False, err
        else:
            return False, f"Unknown EMAIL_MODE: '{mode}'. Must be 'smtp' or 'console'."


def send_daily_report_to_guardian_sync(
    elderly_id: str,
    caregiver_id: str,
    caregiver_name: str,
    target_date: str,
    note: Optional[str] = None
) -> Tuple[bool, Optional[str]]:
    """
    Synchronous worker called directly or within FastAPI BackgroundTasks.
    Fetches elderly profile, verifies guardian consent, compiles report, sends email,
    and records the transaction in `report_email_logs`.
    """
    from bson import ObjectId
    from app.database import db, elderly_collection

    logs_collection = db["report_email_logs"]

    # 1. Fetch elderly profile
    try:
        obj_id = ObjectId(elderly_id) if ObjectId.is_valid(elderly_id) else None
        elderly = elderly_collection.find_one({"_id": obj_id}) if obj_id else elderly_collection.find_one({"user_id": elderly_id})
    except Exception as e:
        elderly = None

    if not elderly:
        return False, "Elderly profile not found."

    guardian_email = elderly.get("guardian_email")
    guardian_name = elderly.get("guardian_name") or "Guardian"
    consent = bool(elderly.get("guardian_report_consent", False))
    enabled = bool(elderly.get("guardian_report_enabled", True))

    if not guardian_email:
        return False, "Elderly profile has no guardian email registered."
    if not consent:
        return False, "Guardian has not provided consent to receive daily wellness reports."
    if not enabled:
        return False, "Guardian daily reports are currently disabled for this patient."

    # 2. Get Daily Report
    user_id = str(elderly.get("user_id") or elderly.get("_id"))
    daily_report = DailyReportService.get_daily_report(user_id=user_id, date_str=target_date)

    # 3. Build Email Message
    msg = EmailService.build_daily_report_email(
        recipient_email=guardian_email,
        guardian_name=guardian_name,
        elderly_doc=elderly,
        daily_report=daily_report,
        caregiver_name=caregiver_name,
        caregiver_note=note
    )

    # 4. Dispatch Email
    success, error = EmailService.send_email_message(msg)

    # 5. Log Attempt in report_email_logs (Never store report body)
    now_iso = datetime.now(timezone.utc).isoformat()
    log_doc = {
        "elderly_id": str(elderly["_id"]),
        "caregiver_id": caregiver_id,
        "date": target_date,
        "to_email_masked": mask_email(guardian_email),
        "status": "sent" if success else "failed",
        "error": error,
        "sent_at": now_iso
    }
    try:
        logs_collection.insert_one(log_doc)
    except Exception as e:
        print("[WARN] Failed to write report_email_logs:", e)

    return success, error
