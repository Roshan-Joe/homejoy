# HomeJoy Project Audit

**Document Date:** October 2026  
**Project:** HomeJoy — AI-Assisted Elderly Care & Wellness Monitoring System  
**Audit Scope:** Full Stack (Backend, Frontend, Database, Security, Workflows, Deployment)

---

## 1. Existing Features

- **Authentication & RBAC:**
  - JWT-based authentication with email/password and bcrypt hashing.
  - Role-based routing supporting `Admin`, `Elderly`, `Caregiver`, `Doctor`, and `Family Member`.
  - Google OAuth token validation via Google TokenInfo API endpoint (`/api/auth/google`).
- **Elderly Self-Service Client Portal (`/api/elderly/me` & `/elderly/*`):**
  - Personal profile view & updates (name, phone, address, gender, date of birth with dynamic age calculation).
  - Health information management (medical conditions, allergies, notes).
  - Hospital details & assigned doctor information.
  - Medication management (prescription schedule, dose logging, adherence tracking).
  - Emergency contacts management with phone call/SMS triggers.
  - Daily wellness check-in (mood, appetite, sleep quality, mobility difficulty, medication taken, symptoms).
  - Vitals monitoring (Blood Pressure systolic/diastolic, Oxygen Saturation SpO2, and monitoring advisory notes).
  - 9 AM Daily Reminder system for pending check-in, BP, or oxygen entries.
  - Urgent Help Request trigger dispatched to assigned caregiver with live status.
  - Wellness check-in historical logs with pagination.
  - Read-only assigned caregiver card with contact information.
- **Caregiver Self-Service Portal (`/api/caregiver/me` & `/caregiver/*`):**
  - Caregiver dashboard with real-time statistics (assigned clients count, check-ins completed vs. missed, alerts, pending tasks).
  - Assigned elderly client list with name/phone search, risk level filter, and check-in status filter.
  - Read-only elderly client detail view with telemetry breakdown and explainable risk factor breakdown.
  - Telemetry check-in history & care report generation by custom date range.
  - Real-time urgent help request banner with status progression (`Pending` -> `Acknowledged` -> `Resolved`).
  - Alert center for unresolved high/moderate telemetry risk alerts.
  - Task manager (create, mark in-progress/completed).
  - Care report generation & dispatch preview (WhatsApp/SMS and Email digest formats).
  - Profile & shift management.
- **Admin Management Portal (`/api/admin`, `/api/users`, `/api/elderly`, `/api/caregivers`, etc.):**
  - Central dashboard metrics (total users, active accounts, elderly/caregiver counts, recent registrations).
  - User management (search, filter by role/status, sorting, pagination, activate/deactivate, delete).
  - Elderly profile management (CRUD, medical profile inspection, caregiver assignment, doctor assignment).
  - Caregiver staff management (CRUD, shift assignment, qualifications, assigned clients).
  - Doctor directory & appointment scheduling.
  - Family member linking & emergency contact associations.
  - Role-based permission management (RBAC catalog inspection).
  - Broadcast notification dispatch (system, emergency, announcements).

---

## 2. Existing Backend Architecture

- **Framework:** FastAPI (Python 3.11+) with ASGI runner (Uvicorn).
- **Directory Structure:**
  - `backend/app/main.py`: Application entrypoint, CORS configuration, startup hooks, exception handlers, router registration.
  - `backend/app/config.py`: Environment variable configuration (`load_dotenv()`).
  - `backend/app/database.py`: PyMongo client connection to MongoDB Atlas with SSL certifi fallback.
  - `backend/app/security.py`: Password hashing (bcrypt), JWT creation/validation (python-jose), dependency guards (`get_current_user`, `get_current_admin_user`).
  - `backend/app/routers/`:
    - `auth.py`: Registration, login, Google OAuth, current user profile.
    - `admin.py`: Admin statistics, user list, broadcast notifications.
    - `user_router.py`: User CRUD, status toggling, searching, pagination.
    - `role_router.py`: System roles and RBAC catalog.
    - `elderly_client_router.py`: Self-service endpoints under `/api/elderly/me`.
    - `elderly_router.py`: Admin management of elderly under `/api/elderly`.
    - `caregiver_portal_router.py`: Self-service caregiver endpoints under `/api/caregiver/me`.
    - `caregiver_router.py`: Admin management of caregivers under `/api/caregivers`.
    - `doctor_router.py`: Doctor profiles and medical notes under `/api/doctors`.
    - `family_router.py`: Family member profiles under `/api/family-members`.
  - `backend/app/services/`: Modular business logic classes (`ElderlyClientService`, `CaregiverPortalService`, `HelpRequestService`, `DailyReportService`, `VitalsService`, `UserService`, `ElderlyService`, `CaregiverService`, `DoctorService`, `FamilyService`, `RoleService`).
  - `backend/app/schemas/`: Pydantic models for strict payload validation and serialization.
  - `backend/app/models/`: MongoDB document serialization utilities.

---

## 3. Existing Frontend Architecture

- **Framework:** React 19 + Vite.
- **Routing:** React Router v7 (`react-router-dom`) with client-side role guards:
  - `ProtectedRoute`: requires valid JWT.
  - `AdminRoute`: enforces role `Admin`.
  - `ElderlyRoute`: enforces role `Elderly`.
  - `CaregiverRoute`: enforces role `Caregiver`.
- **State Management & Context:**
  - `AuthContext.jsx`: Centralizes authentication, login, register, Google login, token storage in `localStorage`, logout, session expiration handling.
- **Styling:** Custom CSS design system with CSS custom properties (`--primary: #00685b`, glassmorphism, responsive cards, typography using Plus Jakarta Sans).
- **Service Layer:** Modular Axios client (`frontend/src/services/api.js`) attaching Bearer tokens via request interceptors and handling 401s via response interceptors. Dedicated services: `elderlyClientService`, `caregiverPortalService`, `userService`, `elderlyService`, `caregiverService`, etc.

---

## 4. Existing Database Collections

The application utilizes MongoDB with the following collections:
1. `users`: Authentication records, email, hashed passwords, roles, active status.
2. `roles`: RBAC permission schemas and descriptions.
3. `elderly_profiles`: Medical profile, age, date of birth, emergency contacts, caregiver & doctor assignment IDs.
4. `caregiver_profiles`: Caregiver shift, qualifications, assigned elderly client IDs and names.
5. `doctor_profiles`: Doctor credentials, hospital affiliation, medical specialization.
6. `family_profiles`: Linked family members and relationships.
7. `medications`: Prescription schedules, dosages, dose logs per elderly user.
8. `emergency_contacts`: Priority contact records per elderly client.
9. `wellness_checkins`: Daily self-reported wellness logs, symptoms, and risk outcomes.
10. `vitals`: Daily blood pressure and oxygen saturation telemetry.
11. `help_requests`: Urgent help requests from elderly to assigned caregivers.
12. `alerts`: Telemetry alerts and help request notices.
13. `caregiver_tasks`: Caregiver task checklist.
14. `daily_reports`: Daily generated wellness summaries.
15. `notifications`: System notifications and broadcast messages.
16. `medical_notes`: Clinical notes and physician observations.

---

## 5. Existing API Endpoints

- **Auth:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/google`
  - `GET /api/auth/me`
- **Admin:**
  - `POST /api/admin/seed-admin`
  - `GET /api/admin/dashboard/stats`
  - `GET /api/admin/users`
  - `POST /api/admin/notifications`
  - `GET /api/admin/notifications`
  - `GET /api/admin/analytics`
  - `GET /api/admin/database/status`
- **User Management:**
  - `GET /api/users`, `GET /api/users/search`, `GET /api/users/{id}`, `POST /api/users`, `PUT /api/users/{id}`, `PATCH /api/users/{id}/status`, `DELETE /api/users/{id}`
- **Elderly Self-Service (`/api/elderly/me`):**
  - `GET /api/elderly/me`, `PUT /api/elderly/me`
  - `GET /api/elderly/me/health`, `PUT /api/elderly/me/health`
  - `GET /api/elderly/me/hospital`, `PUT /api/elderly/me/hospital`
  - `GET /api/elderly/me/doctor`
  - `GET /api/elderly/me/medications`, `POST /api/elderly/me/medications`, `PUT /api/elderly/me/medications/{id}`, `DELETE /api/elderly/me/medications/{id}`, `POST /api/elderly/me/medications/{id}/log-dose`
  - `GET /api/elderly/me/emergency-contacts`, `POST /api/elderly/me/emergency-contacts`, `PUT /api/elderly/me/emergency-contacts/{id}`, `DELETE /api/elderly/me/emergency-contacts/{id}`
  - `GET /api/elderly/me/caregiver`
  - `GET /api/elderly/me/checkins/today`, `POST /api/elderly/me/checkins`
  - `GET /api/elderly/me/wellness-history`
  - `GET /api/elderly/me/notifications`
  - `PUT /api/elderly/me/settings/notifications`, `POST /api/elderly/me/settings/change-password`, `POST /api/elderly/me/setup/complete`
  - `GET /api/elderly/me/daily-status`, `POST /api/elderly/me/vitals`, `GET /api/elderly/me/vitals/today`, `GET /api/elderly/me/daily-report`
  - `POST /api/elderly/me/help-request`, `GET /api/elderly/me/help-requests`
  - `POST /api/elderly/me/reminder-acknowledge`
- **Caregiver Self-Service (`/api/caregiver/me`):**
  - `GET /api/caregiver/me`, `PUT /api/caregiver/me/profile`
  - `GET /api/caregiver/me/dashboard`
  - `GET /api/caregiver/me/elderly`, `GET /api/caregiver/me/elderly/{elderly_id}`, `GET /api/caregiver/me/elderly/{elderly_id}/history`
  - `GET /api/caregiver/me/alerts`, `POST /api/caregiver/me/alerts/{id}/acknowledge`, `POST /api/caregiver/me/alerts/{id}/resolve`
  - `GET /api/caregiver/me/tasks`, `POST /api/caregiver/me/tasks`, `PUT /api/caregiver/me/tasks/{id}`, `DELETE /api/caregiver/me/tasks/{id}`
  - `GET /api/caregiver/me/reports/care-report`
  - `GET /api/caregiver/me/help-requests`, `POST /api/caregiver/me/help-requests/{id}/acknowledge`, `POST /api/caregiver/me/help-requests/{id}/resolve`
  - `POST /api/caregiver/me/elderly/{elderly_id}/remind-checkin`
  - `GET /api/caregiver/me/notifications`
  - `PUT /api/caregiver/me/settings`, `POST /api/caregiver/me/change-password`

---

## 6. Existing Authentication

- Standard OAuth2 password flow with JWT Bearer tokens issued on login or registration.
- Passwords hashed with bcrypt and truncated safely to 72 bytes.
- Tokens decoded using `jose.jwt.decode` with HS256 and configurable `SECRET_KEY`.
- User identity loaded from MongoDB via `users_collection.find_one({"email": email})`.
- Token expiration: 60 minutes default.
- Google OAuth token validation connects to Google TokenInfo API.

---

## 7. Existing Authorization

- Backend enforces role checks through FastAPI dependencies:
  - `get_current_admin_user`: requires `user.role == 'Admin'`.
  - `get_current_elderly_user`: requires `user.role == 'Elderly'`.
  - `get_current_caregiver_user`: requires `user.role == 'Caregiver'`.
- IDOR Protection:
  - Elderly routes operate strictly on `current_user["id"]` without client-supplied user ID parameters.
  - Caregiver portal validates that any accessed `elderly_id` is assigned to the requesting caregiver via `_verify_elderly_assigned`.
- **Identified Flaw:** Public registration endpoint allowed users to supply `role: "Admin"` or `role: "Caregiver"`, bypassing administrative provisioning.

---

## 8. Existing Wellness Workflow

- Elderly user logs in -> accesses Daily Wellness Check-In modal/page.
- Selects self-reported telemetry: Mood, Sleep Quality, Appetite, Mobility Challenge, Medication Taken, Symptoms, Notes.
- Date is pinned to current day (IST/UTC timezone aligned).
- Duplicate check-ins for the same calendar date are rejected with an informative 400 error.
- Check-in document saved to `wellness_checkins_collection`.
- Elderly profile's `risk_level` updated.
- Automated daily report generated or updated.

---

## 9. Existing Risk Prediction

- Implemented in `_mock_compute_wellness_risk(checkin_data: Dict[str, Any]) -> str`.
- Rule-based heuristic scoring:
  - Mood "Poor" (+3), "Not Great" (+1).
  - Appetite "Poor"/"No Appetite" (+3), "Fair" (+1).
  - Sleep "Poor"/"Very Poor" (+2), "Fair" (+1).
  - Mobility "Significant" (+3), "Moderate" (+2), "Slight" (+1).
  - Medication "No" (+2), "Partially" (+1).
  - Symptoms present (+1).
  - Score >= 7 -> "High", Score >= 3 -> "Moderate", else "Low".
- **Identified Status:** This is an explainable heuristic telemetry scoring prototype, not a black-box deep learning model. It lacks vitals (BP/SpO2) integration and does not return explainable factor breakdowns to the elderly client upon check-in.

---

## 10. Existing Notification Workflow

- Broadcast notifications dispatched by Admin to target roles (`all`, `Elderly`, `Caregiver`, `Family Member`).
- System alerts created in `alerts_collection` for High/Moderate risk check-ins and urgent Help Requests.
- Check-in reminders sent by caregivers to assigned elderly clients.
- Elderly in-app notification center reads user-targeted and role-targeted notifications.

---

## 11. Existing Caregiver Assignment

- Admin can assign a caregiver to an elderly resident in `ElderlyManagement.jsx` modal and `CaregiverManagement.jsx`.
- **Identified Bug:** When Admin assigned a caregiver through the Elderly module (`/api/elderly/{id}/assign-caregiver`), it updated `elderly_profiles.assigned_caregiver_id` but failed to update `caregiver_profiles.assigned_elderly_ids`. Furthermore, if the resident had a prior caregiver, that previous caregiver's profile was not cleared.

---

## 12. Existing Admin Workflow

- Provides complete CRUD operations over users, elderly, caregivers, doctors, and family.
- Search, filter by role/status, sorting, and pagination.
- Role management & permission catalog inspection.
- System health and MongoDB connection metrics display.

---

## 13. Missing Features

1. **System Health Endpoint:** `GET /health` was missing on the root backend.
2. **Dynamic Allowed Origins Configuration:** CORS allowed `*` with `allow_credentials=True`, which is forbidden in standard CORS specs and insecure for production.
3. **Caregiver Priority Queue:** Caregivers had a flat list or basic filter, lacking an automated priority queue sorting residents by urgent attention needs.
4. **Explainable Risk Indicators for Elderly:** The elderly user only saw a single badge without the explicit contributing indicators explaining their wellness score.
5. **Personalized Historical Baseline Comparison:** No comparison comparing today's telemetry (e.g. sleep, mood) against the patient's 7-day personal average.
6. **Missing-Data Awareness:** Telemetry preview cards in the care report defaulted to hardcoded simulated values ("120/80 mmHg") rather than explicitly stating "Not recorded".

---

## 14. Broken Features

1. **Caregiver Assignment Synchronization:** Unilateral updates in `elderly_service.py` caused out-of-sync state in `caregiver_profiles`.
2. **Missing Daily Report Method Call:** `DailyReportService` referenced `CaregiverPortalService._compute_explainable_ai_risk` but method signatures needed consistency and safe fallback.
3. **Hardcoded Frontend API Base URL:** `frontend/src/services/api.js` was hardcoded to `http://127.0.0.1:8000`, causing immediate failure in production environments.
4. **Duplicate React Hooks:** `ElderlyDashboard.jsx` contained duplicate `useEffect` hooks calling `loadHome()`.

---

## 15. Security Risks (P0/P1)

1. **Unprotected Admin Seeding Route:** `POST /api/admin/seed-admin` was exposed without authentication, allowing anyone to promote or create an admin account.
2. **Unrestricted Public Role Registration:** Public registration endpoint allowed users to pass `role: "Admin"` or `role: "Caregiver"`.
3. **Repository Credential Tracking:** `.env` was committed and tracked in git history; root `.gitignore` was absent.
4. **Insecure CORS with Wildcard Credentials:** `allow_origins=["*"]` with `allow_credentials=True`.
5. **Missing Database Indexes:** MongoDB Atlas collections had zero secondary indexes (no unique index on `email`, no index on `user_id`, `date`, or `role`).

---

## 16. Deployment Risks

1. **Frontend Environment Variable Binding:** Lack of `VITE_API_URL` configuration in production.
2. **Localhost Assumption:** API calls pointing exclusively to `127.0.0.1`.
3. **Database Network Connectivity:** Atlas network IP whitelisting requirement (`0.0.0.0/0` or deployment host IP).

---

## 17. UX Problems

1. **Fabricated Telemetry in Preview:** Family report previews showed simulated vitals (120/80 mmHg) even when residents had not recorded vitals.
2. **Reminder Action Precision:** 9 AM reminder modal had a generic "Complete Now" button rather than distinct CTAs for "Complete Check-in" and "Enter Health Readings".

---

## 18. Duplicate / Unused Code

- Duplicate `useEffect(() => { loadHome(); }, [loadHome]);` in `ElderlyDashboard.jsx`.
- Unused icons and variables in several React pages flagged by ESLint.
- Python byte code files (`.pyc`) accidentally committed in git history.

---

## 19. Recommended Improvements & Action Plan

1. **Security Hardening (P0):**
   - Secure or disable `seed-admin` endpoint.
   - Restrict self-registration to `Elderly` and `Family Member`; require Admin creation for `Caregiver`, `Doctor`, and `Admin`.
   - Create comprehensive root `.gitignore` and untrack sensitive files.
   - Configure production-ready CORS with `FRONTEND_URL` environment support.
   - Add safe `GET /health` endpoint reporting database status without credential leakage.
2. **Data Integrity & Bug Fixes (P1):**
   - Fix bidirectional caregiver assignment sync in `elderly_service.py`.
   - Fix missing method calls in `daily_report_service.py`.
   - Setup automatic MongoDB indexes for `users.email`, `users.role`, `elderly_profiles.user_id`, `wellness_checkins(user_id, date)`, `vitals(user_id, date)`.
   - Update `api.js` to dynamically use `import.meta.env.VITE_API_URL`.
3. **Workflow & Explainability Enhancements (P3/P5):**
   - Upgrade risk scoring engine to incorporate vitals (BP/SpO2) and return explainable contributing factors.
   - Implement **Personalized Behavioral Baseline** comparing today's check-in with the resident's historical average.
   - Implement **Caregiver Priority Queue** ordering residents by telemetry urgency (High -> Moderate -> Low -> Not Recorded).
   - Implement **Missing-Data Awareness** across care reports ("Not recorded" explicitly labeled).
   - Enhance the 9 AM reminder modal with clear dual CTAs.
