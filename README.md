# HomeJoy - AI-Based Elderly Care and Wellness Monitoring System

HomeJoy is a comprehensive, production-grade elderly care and wellness monitoring platform designed to provide proactive health tracking, explainable wellness risk scoring, vital sign monitoring, and automated guardian daily reporting.

---

## Architecture Overview

- **Backend**: FastAPI, MongoDB (pymongo), Pydantic v2, Python `smtplib`/`email` (100% free; zero paid email APIs).
- **Frontend**: React 19, Vite, Axios, Tailwind CSS-free vanilla CSS architecture with glassmorphic cards and interactive modals.
- **Roles**:
  - `Admin`: System configuration, caregiver and resident management.
  - `Caregiver`: Patient assignment, telemetry review, and daily wellness report dispatch.
  - `Elderly`: Conversational check-ins, vitals logging, medication adherence, and emergency requests.
  *(Note: The legacy Family role has been decommissioned in favor of verified single-guardian daily report dispatches).*

---

## Free SMTP Email Service & Configuration

HomeJoy's Guardian Reporting engine sends multipart (HTML + plain text) daily wellness summaries to residents' authorized guardians at zero cost using Python's built-in `smtplib` and `email` packages.

### 1. `EMAIL_MODE=console` (Demo Mode - Zero Configuration)
By default, the backend operates in `console` mode:
```env
EMAIL_MODE=console
```
- When a caregiver dispatches a report, the email is logged to stdout and saved locally to `backend/scratch/sent_emails.log`.
- No credentials or live internet connection required—ideal for local testing, demos, and CI/CD pipelines.

### 2. Live Free SMTP Setup via Gmail App Password
To deliver actual emails to guardians without paid services (SendGrid/Mailgun/Amazon SES), use a free Google account with an **App Password**:

1. **Enable 2-Step Verification**:
   - Go to your Google Account -> [Security Settings](https://myaccount.google.com/security).
   - Under "How you sign in to Google", ensure **2-Step Verification** is turned **ON**.
2. **Generate an App Password**:
   - In the search bar at the top of your Google Account settings, search for **"App passwords"**.
   - Create a new App Password named `HomeJoy`.
   - Copy the generated 16-character password (e.g. `abcd efgh ijkl mnop`).
3. **Configure `backend/.env`**:
   Copy `backend/.env.example` to `backend/.env` and update the SMTP block:
   ```env
   EMAIL_MODE=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   SMTP_FROM="HomeJoy Wellness Care <your_email@gmail.com>"
   SMTP_USE_TLS=true
   ```
4. **Safety & Fallback**:
   If credentials are wrong or missing in `smtp` mode, the app gracefully falls back to error logging without crashing or breaking the caregiver UI. Dynamic user fields (notes, names, symptoms) are strictly HTML-escaped to prevent injection.

---

## API Endpoints: Guardian Daily Wellness Report

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/caregiver/elderly/{elderly_id}/daily-report/send-email` | Caregiver (Assigned) | Dispatches the daily wellness report to the registered guardian email. Rate limited to 1 send/day (or 3 with `resend: true`). |
| `GET` | `/api/caregiver/elderly/{elderly_id}/daily-report/email-status?date=YYYY-MM-DD` | Caregiver (Assigned) | Returns dispatch status, delivery count, masked guardian email, and sending eligibility. |
| `POST` | `/api/elderly` | Admin | Creates an elderly resident profile with required guardian contacts. |
| `PATCH` | `/api/elderly/{id}` | Admin | Updates resident profile including guardian contacts, report toggle, and consent. |
| `POST` | `/api/auth/register` | Public (Elderly/Caregiver) | Public signup. Elderly registrations require guardian contact + consent. |

### Send Report Payload (`POST /api/caregiver/elderly/{id}/daily-report/send-email`)
```json
{
  "date": "2026-10-22",
  "note": "Resident enjoyed afternoon garden stroll and took all prescribed evening medication.",
  "resend": false
}
```

### Rate Limiting & Validation Rules
1. **Validation**: Every elderly registration requires either `guardian_email` (with `guardian_report_consent: true`) OR `guardian_name` + `guardian_phone`.
2. **Strict Authorization**: Unassigned caregivers, elderly residents, and unauthorized users are blocked with `403 Forbidden` / `401 Unauthorized`.
3. **Daily Cap**: Maximum 1 email per date unless `resend: true` is explicitly provided, with a strict ceiling of 3 emails per day per resident.

---

## Migration from Family Role

If migrating an existing database that previously had linked `Family` accounts:
```bash
# Preview links and proposed guardian fields without modifying database (Dry Run)
python backend/scripts/migrate_family_to_guardian.py

# Execute migration and write guardian contacts into elderly profiles
python backend/scripts/migrate_family_to_guardian.py --apply
```

---

## Running the Tests

### 1. Backend Automated Tests (Pytest)
```bash
# Activate virtual environment
cd backend
source venv/Scripts/activate   # On Windows: venv\Scripts\activate

# Run comprehensive Guardian Daily Report test suite
pytest test_guardian_daily_report.py -v

# Run entire backend test suite
pytest -v -W ignore
```

### 2. Frontend Production Build
```bash
cd frontend
npm install
npm run build
```

---

## Local Development Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
