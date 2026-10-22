from pymongo import MongoClient
from app.config import MONGODB_URL, DATABASE_NAME

try:
    import certifi
    ca = certifi.where()
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000, tlsCAFile=ca)
except Exception:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)

try:
    client.admin.command("ping")
    print("[OK] Connected to MongoDB Atlas")
except Exception as e:
    print("[ERROR] MongoDB Connection Failed:", e)

db = client[DATABASE_NAME]
users_collection = db["users"]
roles_collection = db["roles"]
elderly_collection = db["elderly_profiles"]
caregivers_collection = db["caregiver_profiles"]
daily_reports_collection = db["daily_reports"]
doctors_collection = db["doctor_profiles"]
medical_notes_collection = db["medical_notes"]
family_collection = db["family_profiles"]  # Retained for legacy data migration only (see backend/scripts/migrate_family_to_guardian.py)

# --- Elderly Client Module Collections ---
medications_collection = db["medications"]
emergency_contacts_collection = db["emergency_contacts"]
wellness_checkins_collection = db["wellness_checkins"]
notifications_collection = db["notifications"]  # shared with admin send side

# --- Caregiver Module Collections ---
alerts_collection = db["alerts"]
caregiver_tasks_collection = db["caregiver_tasks"]

# --- Daily Vitals & Urgent Help Collections ---
vitals_collection = db["vitals"]
help_requests_collection = db["help_requests"]
report_email_logs_collection = db["report_email_logs"]


def init_db_indexes():
    """
    Ensures optimal, production-ready indexes on key collections for search and lookup speed.
    Safe and idempotent — handles existing keys gracefully.
    """
    try:
        # Users
        users_collection.create_index("email", unique=True, sparse=True)
        users_collection.create_index("role")
        users_collection.create_index("is_active")

        # Profiles
        elderly_collection.create_index("user_id")
        elderly_collection.create_index("assigned_caregiver_id")
        caregivers_collection.create_index("user_id")
        caregivers_collection.create_index("assigned_elderly_ids")

        # Telemetry & Check-ins
        wellness_checkins_collection.create_index([("user_id", 1), ("date", -1)])
        vitals_collection.create_index([("user_id", 1), ("date", -1)])
        daily_reports_collection.create_index([("user_id", 1), ("date", -1)])

        # Urgent care & notifications
        help_requests_collection.create_index("user_id")
        help_requests_collection.create_index("caregiver_id")
        help_requests_collection.create_index("status")
        alerts_collection.create_index("caregiver_id")
        notifications_collection.create_index("target_role")
        medications_collection.create_index("user_id")

        print("[OK] Production database indexes verified and created.")
    except Exception as e:
        print("[WARN] Non-critical index creation notice:", e)