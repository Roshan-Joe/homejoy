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
family_collection = db["family_profiles"]

# --- Elderly Client Module Collections ---
medications_collection = db["medications"]
emergency_contacts_collection = db["emergency_contacts"]
wellness_checkins_collection = db["wellness_checkins"]
notifications_collection = db["notifications"]  # shared with admin send side

# --- Caregiver Module Collections ---
alerts_collection = db["alerts"]
caregiver_tasks_collection = db["caregiver_tasks"]