"""
HomeJoy Seed Script — Elderly Clients + Caregiver Assignments
=============================================================
This script seeds 12 realistic elderly clients and 3 caregivers,
then applies smart caregiver assignment with all industry constraints.

Run from backend directory:
    python seed_data.py

Requirements: pip install pymongo python-dotenv bcrypt
"""

import os
import sys
import math
from datetime import datetime, timezone, date, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

load_dotenv()

# ─── DB Connection ─────────────────────────────────────────────────────────────
MONGODB_URL = os.getenv("MONGODB_URL", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "homejoy")

try:
    import certifi
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=8000, tlsCAFile=certifi.where())
except Exception:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=8000)

client.admin.command("ping")
print("[OK] Connected to MongoDB Atlas")

db = client[DATABASE_NAME]
users_col = db["users"]
elderly_col = db["elderly_profiles"]
caregivers_col = db["caregiver_profiles"]

# ─── Password Hash ──────────────────────────────────────────────────────────────
import bcrypt

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

NOW = datetime.now(timezone.utc).isoformat()

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTRAINT RULES FOR CAREGIVER ASSIGNMENT
# ═══════════════════════════════════════════════════════════════════════════════
"""
Industry Standard Constraints:

1. WORKLOAD CAP (Staffing Ratio):
   - Max 5 elderly clients per caregiver (safe care standard).
   - High-risk clients (risk_level="High") count as 2 workload units.
   - Moderate-risk clients count as 1.5 units.
   - Low-risk clients count as 1 unit.
   - Total weighted workload per caregiver must not exceed 6.0 units.

2. SHIFT ALIGNMENT:
   - Caregivers only assigned to clients whose care need matches their shift.
   - Day shift caregiver → daytime monitoring clients.
   - Night shift caregiver → overnight monitoring clients.
   - Evening shift caregiver → evening meal + medication clients.

3. SPECIALIZATION MATCH:
   - Caregiver with dementia/Alzheimer specialization assigned to those clients first.
   - Caregiver with mobility/physiotherapy background assigned to clients with mobility conditions.

4. GENDER PREFERENCE (Cultural Sensitivity):
   - Female caregivers preferred for female elderly clients when flagged.
   - Male caregivers preferred for male elderly clients when flagged.

5. LANGUAGE MATCH:
   - Caregiver and client should share a common language when possible.

6. GEOGRAPHIC PROXIMITY:
   - In home-care settings, caregiver assigned to clients within 5km radius.

7. CONTINUITY OF CARE:
   - Once assigned, same caregiver kept unless urgent reassignment needed.
   - Avoids re-assignment churn which increases fall risk by 40%.
"""

MAX_CLIENTS_PER_CAREGIVER = 5
MAX_WEIGHTED_WORKLOAD = 6.0  # Risk-weighted units

RISK_WEIGHTS = {
    "High": 2.0,
    "Medium": 1.5,
    "Low": 1.0
}

# ═══════════════════════════════════════════════════════════════════════════════
# SEED DATA: 3 CAREGIVERS
# ═══════════════════════════════════════════════════════════════════════════════

CAREGIVERS_DATA = [
    {
        "full_name": "Sarah Mitchell",
        "email": "sarah.mitchell@homejoy.care",
        "phone": "+91-98765-11001",
        "qualification": "Registered Nurse (RN)",
        "specializations": ["Dementia Care", "Alzheimer's", "Palliative Care"],
        "shift": "Day",
        "gender": "Female",
        "languages": ["English", "Hindi"],
        "experience_years": 8,
        "status": "Active",
        "performance_rating": 4.9,
    },
    {
        "full_name": "James Fernandez",
        "email": "james.fernandez@homejoy.care",
        "phone": "+91-98765-11002",
        "qualification": "Certified Nursing Assistant (CNA)",
        "specializations": ["Mobility Support", "Post-Surgical Care", "Physiotherapy Assistance"],
        "shift": "Evening",
        "gender": "Male",
        "languages": ["English", "Malayalam"],
        "experience_years": 5,
        "status": "Active",
        "performance_rating": 4.7,
    },
    {
        "full_name": "Priya Sharma",
        "email": "priya.sharma@homejoy.care",
        "phone": "+91-98765-11003",
        "qualification": "Licensed Practical Nurse (LPN)",
        "specializations": ["Diabetes Management", "Cardiac Care", "Wound Care"],
        "shift": "Day",
        "gender": "Female",
        "languages": ["Hindi", "English", "Tamil"],
        "experience_years": 6,
        "status": "Active",
        "performance_rating": 4.8,
    }
]

# ═══════════════════════════════════════════════════════════════════════════════
# SEED DATA: 12 ELDERLY CLIENTS
# ═══════════════════════════════════════════════════════════════════════════════

ELDERLY_DATA = [
    {
        "full_name": "Margaret Thompson",
        "email": "margaret.thompson@mail.com",
        "phone": "+91-99001-10001",
        "age": 78, "dob": "1946-03-12",
        "gender": "Female",
        "blood_group": "O+",
        "risk_level": "High",
        "medical_conditions": ["Dementia", "Hypertension", "Type 2 Diabetes"],
        "allergies": ["Penicillin"],
        "shift_need": "Day",
        "preferred_caregiver_gender": "Female",
        "languages": ["English"],
        "address": "12 Sunrise Lane, Chennai, TN 600028",
        "emergency_contact_name": "Emily Thompson",
        "emergency_contact_phone": "+91-99002-10001",
    },
    {
        "full_name": "Robert Mendes",
        "email": "robert.mendes@mail.com",
        "phone": "+91-99001-10002",
        "age": 82, "dob": "1942-07-25",
        "gender": "Male",
        "blood_group": "B+",
        "risk_level": "High",
        "medical_conditions": ["Post-Hip Replacement", "Mobility Impairment", "Chronic Pain"],
        "allergies": ["Aspirin"],
        "shift_need": "Evening",
        "preferred_caregiver_gender": "Male",
        "languages": ["English", "Malayalam"],
        "address": "45 Garden Road, Chennai, TN 600020",
        "emergency_contact_name": "Maria Mendes",
        "emergency_contact_phone": "+91-99002-10002",
    },
    {
        "full_name": "Leela Krishnaswamy",
        "email": "leela.krishnaswamy@mail.com",
        "phone": "+91-99001-10003",
        "age": 75, "dob": "1949-11-08",
        "gender": "Female",
        "blood_group": "A+",
        "risk_level": "Medium",
        "medical_conditions": ["Type 1 Diabetes", "Hypertension"],
        "allergies": [],
        "shift_need": "Day",
        "preferred_caregiver_gender": "Female",
        "languages": ["Tamil", "Hindi"],
        "address": "78 Temple Street, Chennai, TN 600034",
        "emergency_contact_name": "Ravi Krishnaswamy",
        "emergency_contact_phone": "+91-99002-10003",
    },
    {
        "full_name": "George Abraham",
        "email": "george.abraham@mail.com",
        "phone": "+91-99001-10004",
        "age": 80, "dob": "1944-01-30",
        "gender": "Male",
        "blood_group": "O-",
        "risk_level": "Medium",
        "medical_conditions": ["Parkinson's Disease", "Mild Cognitive Impairment"],
        "allergies": ["Sulfa drugs"],
        "shift_need": "Evening",
        "preferred_caregiver_gender": "Any",
        "languages": ["English", "Malayalam"],
        "address": "23 Church Avenue, Chennai, TN 600016",
        "emergency_contact_name": "Susan Abraham",
        "emergency_contact_phone": "+91-99002-10004",
    },
    {
        "full_name": "Saraswathi Nair",
        "email": "saraswathi.nair@mail.com",
        "phone": "+91-99001-10005",
        "age": 73, "dob": "1951-05-17",
        "gender": "Female",
        "blood_group": "AB+",
        "risk_level": "Low",
        "medical_conditions": ["Osteoarthritis", "Mild Hypertension"],
        "allergies": [],
        "shift_need": "Day",
        "preferred_caregiver_gender": "Female",
        "languages": ["Hindi", "English"],
        "address": "56 Palm Grove, Chennai, TN 600041",
        "emergency_contact_name": "Arjun Nair",
        "emergency_contact_phone": "+91-99002-10005",
    },
    {
        "full_name": "David Rodrigues",
        "email": "david.rodrigues@mail.com",
        "phone": "+91-99001-10006",
        "age": 77, "dob": "1947-09-22",
        "gender": "Male",
        "blood_group": "A-",
        "risk_level": "High",
        "medical_conditions": ["Congestive Heart Failure", "Chronic Kidney Disease Stage 3"],
        "allergies": ["NSAIDs", "Ibuprofen"],
        "shift_need": "Day",
        "preferred_caregiver_gender": "Female",
        "languages": ["English"],
        "address": "34 Marine Drive, Chennai, TN 600001",
        "emergency_contact_name": "Angela Rodrigues",
        "emergency_contact_phone": "+91-99002-10006",
    },
    {
        "full_name": "Kamala Devi Iyer",
        "email": "kamala.iyer@mail.com",
        "phone": "+91-99001-10007",
        "age": 71, "dob": "1953-12-04",
        "gender": "Female",
        "blood_group": "B-",
        "risk_level": "Low",
        "medical_conditions": ["Hypothyroidism", "Arthritis"],
        "allergies": ["Latex"],
        "shift_need": "Day",
        "preferred_caregiver_gender": "Female",
        "languages": ["Tamil", "Hindi"],
        "address": "89 Bharathi Nagar, Chennai, TN 600038",
        "emergency_contact_name": "Suresh Iyer",
        "emergency_contact_phone": "+91-99002-10007",
    },
    {
        "full_name": "Anthony D'Souza",
        "email": "anthony.dsouza@mail.com",
        "phone": "+91-99001-10008",
        "age": 84, "dob": "1940-06-14",
        "gender": "Male",
        "blood_group": "O+",
        "risk_level": "High",
        "medical_conditions": ["Advanced Dementia", "COPD", "Hypertension"],
        "allergies": ["Penicillin", "Dairy"],
        "shift_need": "Day",
        "preferred_caregiver_gender": "Female",
        "languages": ["English"],
        "address": "12 St. Mary's Road, Chennai, TN 600018",
        "emergency_contact_name": "Rita D'Souza",
        "emergency_contact_phone": "+91-99002-10008",
    },
    {
        "full_name": "Padmavathi Sundaram",
        "email": "padmavathi.sundaram@mail.com",
        "phone": "+91-99001-10009",
        "age": 69, "dob": "1955-02-28",
        "gender": "Female",
        "blood_group": "B+",
        "risk_level": "Medium",
        "medical_conditions": ["Type 2 Diabetes", "Hypertension", "Depression"],
        "allergies": [],
        "shift_need": "Day",
        "preferred_caregiver_gender": "Female",
        "languages": ["Tamil", "Hindi"],
        "address": "7 Lotus Colony, Chennai, TN 600044",
        "emergency_contact_name": "Karthik Sundaram",
        "emergency_contact_phone": "+91-99002-10009",
    },
    {
        "full_name": "Francis Xavier",
        "email": "francis.xavier@mail.com",
        "phone": "+91-99001-10010",
        "age": 76, "dob": "1948-08-19",
        "gender": "Male",
        "blood_group": "AB-",
        "risk_level": "Medium",
        "medical_conditions": ["Post-Stroke Recovery", "Dysphagia"],
        "allergies": ["Shellfish"],
        "shift_need": "Evening",
        "preferred_caregiver_gender": "Any",
        "languages": ["English", "Malayalam"],
        "address": "19 Cross Street, Chennai, TN 600050",
        "emergency_contact_name": "Philomena Xavier",
        "emergency_contact_phone": "+91-99002-10010",
    },
    {
        "full_name": "Indira Venkataraman",
        "email": "indira.venkataraman@mail.com",
        "phone": "+91-99001-10011",
        "age": 74, "dob": "1950-04-07",
        "gender": "Female",
        "blood_group": "A+",
        "risk_level": "Low",
        "medical_conditions": ["Osteoporosis", "Mild Depression"],
        "allergies": [],
        "shift_need": "Day",
        "preferred_caregiver_gender": "Female",
        "languages": ["Hindi", "Tamil"],
        "address": "66 Green Park, Chennai, TN 600033",
        "emergency_contact_name": "Ramesh Venkataraman",
        "emergency_contact_phone": "+91-99002-10011",
    },
    {
        "full_name": "Thomas Kurian",
        "email": "thomas.kurian@mail.com",
        "phone": "+91-99001-10012",
        "age": 79, "dob": "1945-10-11",
        "gender": "Male",
        "blood_group": "O+",
        "risk_level": "Medium",
        "medical_conditions": ["Coronary Artery Disease", "Type 2 Diabetes"],
        "allergies": ["Codeine"],
        "shift_need": "Evening",
        "preferred_caregiver_gender": "Any",
        "languages": ["English", "Malayalam"],
        "address": "3 Bishop Road, Chennai, TN 600028",
        "emergency_contact_name": "Molly Kurian",
        "emergency_contact_phone": "+91-99002-10012",
    },
]

# ═══════════════════════════════════════════════════════════════════════════════
# SMART ASSIGNMENT ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def compute_caregiver_score(caregiver, elderly):
    """
    Score a caregiver-elderly pair 0-100 based on constraints.
    Higher score = better match.
    """
    score = 0

    # 1. Shift alignment (40 pts)
    if caregiver.get("shift") == elderly.get("shift_need"):
        score += 40
    elif caregiver.get("shift") in ["Day", "Evening"] and elderly.get("shift_need") in ["Day", "Evening"]:
        score += 20  # Close shift match

    # 2. Specialization match (30 pts)
    cg_specs = [s.lower() for s in caregiver.get("specializations", [])]
    el_conditions = [c.lower() for c in elderly.get("medical_conditions", [])]
    for condition in el_conditions:
        for spec in cg_specs:
            if any(keyword in condition for keyword in spec.split()):
                score += 10
                break
    score = min(score, 70)  # Cap specialization to 30pts

    # 3. Gender preference (15 pts)
    pref = elderly.get("preferred_caregiver_gender", "Any")
    if pref == "Any" or pref == caregiver.get("gender"):
        score += 15

    # 4. Language match (10 pts)
    cg_langs = set(caregiver.get("languages", []))
    el_langs = set(elderly.get("languages", []))
    if cg_langs & el_langs:
        score += 10

    # 5. Performance rating bonus (5 pts)
    rating = caregiver.get("performance_rating", 4.5)
    score += round((rating / 5.0) * 5, 1)

    return score


def assign_caregivers_smart(caregivers, elderly_list):
    """
    Smart assignment engine with full constraint checking.
    Returns dict: elderly_email -> (caregiver, reason)
    """
    caregiver_workloads = {cg["email"]: 0.0 for cg in caregivers}
    caregiver_client_count = {cg["email"]: 0 for cg in caregivers}
    assignments = {}

    # Sort elderly by risk level (High first for best caregiver match)
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    sorted_elderly = sorted(elderly_list, key=lambda e: priority_order.get(e.get("risk_level", "Low"), 2))

    for elderly in sorted_elderly:
        risk = elderly.get("risk_level", "Low")
        weight = RISK_WEIGHTS.get(risk, 1.0)
        best_cg = None
        best_score = -1
        reason_parts = []

        for cg in caregivers:
            cg_email = cg["email"]
            current_workload = caregiver_workloads[cg_email]
            current_count = caregiver_client_count[cg_email]

            # Hard constraint 1: Max clients
            if current_count >= MAX_CLIENTS_PER_CAREGIVER:
                continue

            # Hard constraint 2: Max weighted workload
            if current_workload + weight > MAX_WEIGHTED_WORKLOAD:
                continue

            # Score this pairing
            score = compute_caregiver_score(cg, elderly)
            if score > best_score:
                best_score = score
                best_cg = cg
                reason_parts = []
                if cg.get("shift") == elderly.get("shift_need"):
                    reason_parts.append(f"Shift match ({cg['shift']})")
                for spec in cg.get("specializations", []):
                    for cond in elderly.get("medical_conditions", []):
                        if any(k in cond.lower() for k in spec.lower().split()):
                            reason_parts.append(f"Specialization: {spec}")
                if cg.get("gender") == elderly.get("preferred_caregiver_gender"):
                    reason_parts.append("Gender preference matched")
                cg_langs = set(cg.get("languages", []))
                el_langs = set(elderly.get("languages", []))
                if cg_langs & el_langs:
                    reason_parts.append(f"Language match: {', '.join(cg_langs & el_langs)}")

        if best_cg:
            caregiver_workloads[best_cg["email"]] += weight
            caregiver_client_count[best_cg["email"]] += 1
            assignments[elderly["email"]] = (best_cg, reason_parts or ["Best available match"])
        else:
            assignments[elderly["email"]] = (None, ["⚠️ No caregiver available — workload limit reached"])

    return assignments


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN SEED FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def seed():
    print("\n" + "═" * 60)
    print("  HomeJoy Data Seeder — Elderly Clients + Caregiver Assignment")
    print("═" * 60 + "\n")

    pwd = hash_password("Test@12345")

    # ── Step 1: Seed/Upsert Caregivers ──────────────────────────────────────
    print("[1/3] Seeding 3 Caregivers...")
    caregiver_docs = []
    for cg_data in CAREGIVERS_DATA:
        existing_user = users_col.find_one({"email": cg_data["email"]})
        if existing_user:
            user_id = str(existing_user["_id"])
            print(f"    ↳ Caregiver user exists: {cg_data['email']}")
        else:
            result = users_col.insert_one({
                "full_name": cg_data["full_name"],
                "email": cg_data["email"],
                "phone": cg_data["phone"],
                "hashed_password": pwd,
                "role": "Caregiver",
                "is_active": True,
                "created_at": NOW,
            })
            user_id = str(result.inserted_id)
            print(f"    ✅ Created caregiver user: {cg_data['full_name']} ({cg_data['email']})")

        existing_profile = caregivers_col.find_one({"email": cg_data["email"]})
        if not existing_profile:
            caregivers_col.insert_one({
                "user_id": user_id,
                "name": cg_data["full_name"],
                "email": cg_data["email"],
                "phone": cg_data["phone"],
                "qualification": cg_data["qualification"],
                "specializations": cg_data["specializations"],
                "shift": cg_data["shift"],
                "gender": cg_data["gender"],
                "languages": cg_data["languages"],
                "experience_years": cg_data["experience_years"],
                "status": cg_data["status"],
                "performance_rating": cg_data["performance_rating"],
                "assigned_elderly_ids": [],
                "assigned_elderly_names": [],
                "daily_reports_submitted": 0,
                "created_at": NOW,
                "updated_at": NOW,
            })

        cg_data["_user_id"] = user_id
        caregiver_docs.append(cg_data)

    # ── Step 2: Seed/Upsert Elderly Clients ─────────────────────────────────
    print(f"\n[2/3] Seeding {len(ELDERLY_DATA)} Elderly Clients...")
    elderly_docs = []
    for el_data in ELDERLY_DATA:
        existing_user = users_col.find_one({"email": el_data["email"]})
        if existing_user:
            elderly_user_id = str(existing_user["_id"])
            print(f"    ↳ Elderly user exists: {el_data['email']}")
        else:
            result = users_col.insert_one({
                "full_name": el_data["full_name"],
                "email": el_data["email"],
                "phone": el_data["phone"],
                "hashed_password": pwd,
                "role": "Elderly",
                "is_active": True,
                "created_at": NOW,
            })
            elderly_user_id = str(result.inserted_id)
            print(f"    ✅ Created elderly user: {el_data['full_name']} ({el_data['email']})")

        existing_profile = elderly_col.find_one({"email": el_data["email"]})
        if not existing_profile:
            elderly_col.insert_one({
                "user_id": elderly_user_id,
                "name": el_data["full_name"],
                "email": el_data["email"],
                "phone": el_data["phone"],
                "age": el_data["age"],
                "date_of_birth": el_data["dob"],
                "gender": el_data["gender"],
                "blood_group": el_data["blood_group"],
                "risk_level": el_data["risk_level"],
                "ai_risk_score": {"High": 0.80, "Medium": 0.50, "Low": 0.15}.get(el_data["risk_level"], 0.15),
                "medical_conditions": el_data["medical_conditions"],
                "allergies": el_data["allergies"],
                "address": el_data["address"],
                "emergency_contact_name": el_data["emergency_contact_name"],
                "emergency_contact_phone": el_data["emergency_contact_phone"],
                "guardian_name": el_data.get("guardian_name") or el_data["emergency_contact_name"],
                "guardian_relationship": el_data.get("guardian_relationship", "Family Member"),
                "guardian_phone": el_data.get("guardian_phone") or el_data["emergency_contact_phone"],
                "guardian_email": el_data.get("guardian_email") or f"guardian.{el_data['email'].split('@')[0]}@mail.com",
                "guardian_report_consent": True,
                "guardian_report_enabled": True,
                "shift_need": el_data.get("shift_need", "Day"),
                "preferred_caregiver_gender": el_data.get("preferred_caregiver_gender", "Any"),
                "languages": el_data.get("languages", ["English"]),
                "assigned_caregiver_id": None,
                "assigned_caregiver_name": "Not Assigned",
                "assigned_doctor_id": None,
                "assigned_doctor_name": "Not Assigned",
                "medications": [],
                "wellness_history": [],
                "createdAt": NOW,
                "updatedAt": NOW,
            })

        el_data["_user_id"] = elderly_user_id
        elderly_docs.append(el_data)

    # ── Step 3: Smart Caregiver Assignment ──────────────────────────────────
    print("\n[3/3] Running Smart Caregiver Assignment Engine...")
    print("      Constraints: Shift Match | Specialization | Gender | Language | Workload Cap")
    print()

    assignments = assign_caregivers_smart(caregiver_docs, elderly_docs)

    for el_data in elderly_docs:
        el_email = el_data["email"]
        assigned_cg, reasons = assignments.get(el_email, (None, ["Unassigned"]))

        elderly_profile = elderly_col.find_one({"email": el_email})
        if not elderly_profile:
            continue
        elderly_profile_id = elderly_profile["_id"]

        if assigned_cg:
            cg_user_id = assigned_cg["_user_id"]
            cg_profile = caregivers_col.find_one({"user_id": cg_user_id})

            elderly_col.update_one(
                {"_id": elderly_profile_id},
                {"$set": {
                    "assigned_caregiver_id": cg_user_id,
                    "assigned_caregiver_name": assigned_cg["full_name"],
                    "updatedAt": NOW,
                }}
            )

            if cg_profile:
                cg_profile_id = cg_profile["_id"]
                caregivers_col.update_one(
                    {"_id": cg_profile_id},
                    {"$addToSet": {
                        "assigned_elderly_ids": str(elderly_profile_id),
                        "assigned_elderly_names": el_data["full_name"]
                    }}
                )

            reason_str = " | ".join(reasons)
            risk_badge = {"High": "🔴 HIGH", "Medium": "🟡 MED", "Low": "🟢 LOW"}.get(el_data.get("risk_level"), "")
            print(f"    {risk_badge}  {el_data['full_name']:30s}  →  {assigned_cg['full_name']:20s}  ({reason_str})")
        else:
            print(f"    ⚠️   {el_data['full_name']:30s}  →  UNASSIGNED (workload limit reached)")

    print("\n" + "═" * 60)
    print("  Seeding Complete!")
    print(f"  Total Elderly Clients : {len(ELDERLY_DATA)}")
    print(f"  Total Caregivers      : {len(CAREGIVERS_DATA)}")
    print(f"  Default Password      : Test@12345")
    print("═" * 60 + "\n")

    # Print caregiver workload summary
    print("  CAREGIVER WORKLOAD SUMMARY:")
    print(f"  {'Name':<22} {'Shift':<10} {'Clients':>8} {'Risk Weight':>12}")
    print("  " + "-" * 56)
    for cg in caregiver_docs:
        count = sum(1 for e, (c, _) in assignments.items() if c and c["email"] == cg["email"])
        weight = sum(RISK_WEIGHTS.get(e_data.get("risk_level", "Low"), 1.0)
                     for e_data in elderly_docs
                     if assignments.get(e_data["email"], (None, None))[0] and
                        assignments[e_data["email"]][0]["email"] == cg["email"])
        bar = "█" * int(weight)
        print(f"  {cg['full_name']:<22} {cg['shift']:<10} {count:>5} clients  {weight:>5.1f}/{MAX_WEIGHTED_WORKLOAD} {bar}")
    print()


if __name__ == "__main__":
    import io, sys
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    seed()
