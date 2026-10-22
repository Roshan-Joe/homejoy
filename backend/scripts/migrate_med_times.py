"""
One-off migration script for Smart Pill Companion:
Migrates legacy `intake_time` strings in `medications` collection into structured
`times` (list of 24h 'HH:MM' strings) and defaults `days_of_week` to [0, 1, 2, 3, 4, 5, 6].

Usage:
  python backend/scripts/migrate_med_times.py          # Dry-run (read-only, displays planned migrations)
  python backend/scripts/migrate_med_times.py --apply  # Executes update operations on MongoDB
"""

import sys
import os
import argparse

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import medications_collection
from app.schemas.elderly_client_schema import parse_legacy_intake_time


def migrate_medication_times(apply: bool = False):
    print("=" * 70)
    print("HOMEJOY MEDICATION SCHEDULE MIGRATION: INTAKE_TIME -> TIMES")
    print(f"MODE: {'*** LIVE DATABASE UPDATE (--apply) ***' if apply else '*** DRY-RUN (no changes written) ***'}")
    print("=" * 70)

    cursor = medications_collection.find({})
    total_scanned = 0
    total_migrated = 0
    total_skipped = 0

    for med in cursor:
        total_scanned += 1
        med_id = str(med["_id"])
        med_name = med.get("medicine_name", "Unknown Medicine")
        legacy_intake = med.get("intake_time", "")
        existing_times = med.get("times")
        existing_days = med.get("days_of_week")

        needs_update = False
        updates = {}

        # 1. Times list
        if existing_times is None or (isinstance(existing_times, list) and len(existing_times) == 0):
            parsed_times = parse_legacy_intake_time(legacy_intake)
            updates["times"] = parsed_times
            needs_update = True
        else:
            updates["times"] = existing_times

        # 2. Days of week list (default all 7 days)
        if existing_days is None:
            updates["days_of_week"] = [0, 1, 2, 3, 4, 5, 6]
            needs_update = True
        else:
            updates["days_of_week"] = existing_days

        if needs_update:
            total_migrated += 1
            print(f"[{'APPLY' if apply else 'PLAN'}] Med: {med_name} (ID: {med_id})")
            print(f"       Legacy intake_time : '{legacy_intake}'")
            print(f"       New times          : {updates['times']}")
            print(f"       New days_of_week   : {updates['days_of_week']}")

            if apply:
                medications_collection.update_one(
                    {"_id": med["_id"]},
                    {"$set": {
                        "times": updates["times"],
                        "days_of_week": updates["days_of_week"]
                    }}
                )
        else:
            total_skipped += 1

    print("-" * 70)
    print(f"Migration completed. Total scanned: {total_scanned}, Modified: {total_migrated}, Skipped (already up-to-date): {total_skipped}")
    if not apply and total_migrated > 0:
        print("\nTo apply these updates to MongoDB, re-run with: python backend/scripts/migrate_med_times.py --apply\n")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate legacy intake_time to structured times array.")
    parser.add_argument("--apply", action="store_true", help="Execute database updates instead of dry-run.")
    args = parser.parse_args()

    migrate_medication_times(apply=args.apply)
