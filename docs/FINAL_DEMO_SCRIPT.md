# HomeJoy Live Demonstration & Viva Script

**Audience:** Academic Project Evaluators / Viva Board  
**Demonstration Time:** ~10-12 Minutes  
**Prerequisites:** Backend running (`localhost:8000` or deployed URL), Frontend running (`localhost:5173` or deployed URL), MongoDB Atlas connected.

---

## Act 1: Administrative Control & Care Coordination (3 Mins)

### 1.1 Secure Admin Access
1. Open the application landing page. Click **Login**.
2. Sign in with administrative credentials:
   - **Email:** `admin@homejoy.com`
   - **Password:** `<Your_Admin_Password>`
3. Point out the **Admin Dashboard** metrics: Total Residents, Active Caregivers, Doctors, System Status.

### 1.2 Resident & Caregiver Management
1. Navigate to **Elderly Management**.
2. Click **Add Elderly Resident**:
   - Name: `Alice Senior`
   - Room: `104-B`
   - Emergency Contact: `+1-555-0123`
3. Navigate to **Caregiver Management**.
4. Demonstrate bidirectional caregiver assignment:
   - Click **Assign Caregiver / Doctor** for Alice Senior.
   - Select **Mary Caregiver**.
   - Save. Show that Mary's profile immediately reflects Alice as an assigned resident, ensuring synchronized access control.

---

## Act 2: The Senior Experience (4 Mins)

### 2.1 Elderly Login & Accessibility
1. Log out of Admin.
2. Sign in as the Elderly resident:
   - **Email:** `alice@homejoy.com`
   - **Password:** `<Alice_Password>`
3. Highlight elderly-centric UX:
   - High contrast, large legible typography, simplified iconography.
   - The **9:00 AM Daily Reminder** modal appears if today's check-in or vitals are unrecorded.
   - Click **"Complete Check-in"**.

### 2.2 Wellness Telemetry & Explainable Risk
1. Answer the daily questions:
   - Sleep: `4.5 Hours` (low)
   - Mood: `Somewhat Down`
   - Appetite: `Fair / Poor`
   - Medication: `Missed Evening Dose`
2. Click **Submit Wellness Check-in**.
3. **Showcase the Innovation:**
   - The result displays **Wellness Risk: Moderate/High**.
   - Highlight the **Contributing Factors**:
     - *Low sleep duration (4.5 hrs)*
     - *Missed medication dose*
     - *Reduced appetite*
   - Highlight the **Personal Baseline Comparison**:
     - *"Sleep is 2.2 hours below your 7-day average (6.7 hrs)"*.
   - Point out the academic rigor disclaimer: *"Explainable Wellness Telemetry Scoring Engine (Prototype for ML Integration - Not a medical diagnosis)"*.

### 2.3 Vital Signs & Telemetry
1. Click **Health Readings** on the dashboard.
2. Enter Blood Pressure (`132/85 mmHg`) and Oxygen Saturation (`96%`).
3. Click **Save Readings**.

### 2.4 Urgent Help Request
1. Click the prominent red **"Request Help"** button.
2. Select reason: *"Dizziness / Feeling Unsteady"*.
3. Note: *"Felt dizzy after standing up, need caregiver assistance"*.
4. Click **Submit Request**. The status displays **Pending**.

---

## Act 3: Caregiver Triage & Clinical Resolution (4 Mins)

### 3.1 Caregiver Portal & Priority Triage Queue
1. Log out of Elderly.
2. Sign in as **Mary Caregiver**:
   - **Email:** `mary@homejoy.com`
   - **Password:** `<Mary_Password>`
3. Point out the **Assigned Residents Roster**.
4. Click **Toggle Priority Queue**:
   - Notice how Alice Senior automatically jumps to the top of the queue due to her **Urgent Help Request** and **High/Moderate Wellness Risk**.
   - Residents who haven't completed their check-in are flagged with **Pending Today's Check-in**.

### 3.2 Daily Report & Missing-Data Awareness
1. Click **View Daily Report** for Alice:
   - Show the recorded vitals: `132/85 mmHg`, `96% SpO2`.
2. Click **View Daily Report** for Bob (who has not recorded today):
   - **Highlight Key Finding:** The report does NOT hallucinate or assume normal values.
   - It explicitly displays: `Blood Pressure: Not recorded` and `Oxygen: Not recorded today`.

### 3.3 Urgent Help Request Resolution
1. Navigate to **Help Requests / Alerts** tab.
2. Alice Senior's urgent request is visible with a **Pending** status badge.
3. Click **Acknowledge**:
   - Status transitions to **Acknowledged** with timestamp.
4. Click **Resolve**:
   - Enter caregiver note: *"Checked resident in room 104-B. Vital signs stable, provided hydration, resting comfortably."*
   - Submit. Status updates to **Resolved**.
5. Switch back to Elderly view to show real-time status update to the senior.

---

## Act 4: Evaluator Q&A Cheat Sheet

| Potential Examiner Question | Recommended Technical Response |
| :--- | :--- |
| **Q: Is this an actual Machine Learning model?** | *"We designed the system with an Explainable Telemetry Scoring Engine as a production prototype. Rather than training a black-box model on fabricated or unverified synthetic data, we implemented transparent, weighted telemetry scoring with personal baseline deviation. The backend architecture is fully decoupled to plug in trained supervised classifiers (such as XGBoost with SHAP explainability) as real institutional clinical datasets become available."* |
| **Q: How do you prevent caregivers from snooping on other residents' data?** | *"We enforce server-side Horizontal Privilege Boundaries (IDOR guards) using a centralized security dependency (`_verify_elderly_assigned`). Every query to `/api/caregiver/me/elderly/{id}/*` validates the relationship in the database; unauthorized queries immediately return HTTP 403 Forbidden."* |
| **Q: Why are Admin and Caregiver registrations disabled on the public signup page?** | *"Allowing open self-registration for staff roles is a severe security vulnerability. Only residents and family members can register publicly. Administrative staff, caregivers, and doctors must be explicitly provisioned by the facility administrator."* |
| **Q: How does the application scale in production?** | *"The backend is stateless and runs on asynchronous FastAPI with UVloop. MongoDB queries utilize targeted compound indexes on `user_id`, `date`, and foreign keys. The frontend compiles into an optimized static Vite bundle that can be globally edge-cached via CDN (Vercel/Cloudflare)."* |
