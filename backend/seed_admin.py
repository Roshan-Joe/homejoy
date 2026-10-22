"""
HomeJoy One-Time Administrative Account Setup CLI Script
Use this script for initial deployment or emergency administrative recovery.
This replaces the insecure, publicly exposed HTTP /api/admin/seed-admin endpoint.

Usage:
    cd backend
    python seed_admin.py
    # or
    python -m seed_admin
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timezone

# Ensure backend root is on Python module search path
backend_root = Path(__file__).resolve().parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.database import users_collection
from app.security import get_password_hash

def seed_system_admin(
    admin_email: str = "admin@homejoy.com",
    admin_password: str = "admin123",
    full_name: str = "System Administrator"
):
    clean_email = admin_email.lower().strip()
    print("=" * 64)
    print(" HomeJoy System Administrator Provisioning Script")
    print("=" * 64)

    existing = users_collection.find_one({"email": clean_email})
    if existing:
        users_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": "Admin", "is_active": True}}
        )
        print(f"[OK] Existing account '{clean_email}' promoted to Admin role with is_active=True.")
        print("Done.")
        return

    hashed_pwd = get_password_hash(admin_password)
    now_iso = datetime.now(timezone.utc).isoformat()

    admin_doc = {
        "full_name": full_name,
        "email": clean_email,
        "hashed_password": hashed_pwd,
        "role": "Admin",
        "is_active": True,
        "created_at": now_iso
    }
    result = users_collection.insert_one(admin_doc)
    print(f"[SUCCESS] Administrator user provisioned successfully!")
    print(f"  User ID  : {result.inserted_id}")
    print(f"  Email    : {clean_email}")
    print(f"  Password : {admin_password}")
    print("=" * 64)
    print("SECURITY NOTE: Please log in immediately and update your password.")
    print("=" * 64)

if __name__ == "__main__":
    email = os.getenv("ADMIN_SEED_EMAIL", "admin@homejoy.com")
    pwd = os.getenv("ADMIN_SEED_PASSWORD", "admin123")
    seed_system_admin(admin_email=email, admin_password=pwd)
