"""
HomeJoy Migration Script: Migrate Legacy Family Members to Patient Guardian Profiles

Usage:
    python backend/scripts/migrate_family_to_guardian.py           # Dry-run mode (default, no DB changes)
    python backend/scripts/migrate_family_to_guardian.py --apply   # Apply changes to MongoDB
"""
import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import db, users_collection, elderly_collection, family_collection


def parse_args():
    parser = argparse.ArgumentParser(
        description="Migrate legacy linked Family Members into Elderly Guardian Contact fields."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        default=False,
        help="Apply updates directly to MongoDB. Defaults to dry-run if omitted."
    )
    return parser.parse_args()


def migrate():
    args = parse_args()
    is_apply = args.apply

    mode_label = "LIVE RUN (--apply)" if is_apply else "DRY-RUN (simulation only, pass --apply to commit)"
    print("=" * 70)
    print(f"HomeJoy: Family -> Guardian Migration Engine")
    print(f"Execution Mode: {mode_label}")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 70)

    try:
        total_family_docs = family_collection.count_documents({})
        total_elderly_docs = elderly_collection.count_documents({})
        print(f"Found {total_family_docs} family profile(s) and {total_elderly_docs} elderly profile(s).")
    except Exception as e:
        print(f"[ERROR] Could not connect to database: {e}")
        sys.exit(1)

    if total_family_docs == 0:
        print("[INFO] No records found in 'family_profiles' collection. Nothing to migrate.")
        return

    family_cursor = family_collection.find({})
    inspected_count = 0
    updated_count = 0
    skipped_count = 0

    for fam_doc in family_cursor:
        inspected_count += 1
        fam_id = str(fam_doc.get("_id", ""))
        user_id = str(fam_doc.get("user_id", ""))

        # Resolve family user info if needed
        user_doc = None
        if user_id:
            try:
                user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
            except (InvalidId, Exception):
                user_doc = users_collection.find_one({"user_id": user_id})

        fam_name = (
            fam_doc.get("name")
            or fam_doc.get("full_name")
            or (user_doc.get("full_name") if user_doc else None)
            or (user_doc.get("name") if user_doc else None)
            or "Designated Guardian"
        ).strip()

        fam_email = (
            fam_doc.get("email")
            or (user_doc.get("email") if user_doc else "")
            or ""
        ).strip().lower()

        fam_phone = (
            fam_doc.get("phone")
            or (user_doc.get("phone") if user_doc else "")
            or ""
        ).strip()

        fam_rel = (
            fam_doc.get("relationship")
            or "Family Contact"
        ).strip()

        linked_ids = fam_doc.get("linked_elderly_ids", [])
        if not linked_ids:
            print(f"  [-] Family Member '{fam_name}' (ID: {fam_id}) has no linked elderly patients. Skipped.")
            continue

        for eid in linked_ids:
            eid_str = str(eid).strip()
            elderly_doc = None

            # Attempt lookup by ObjectId or user_id
            try:
                elderly_doc = elderly_collection.find_one({"_id": ObjectId(eid_str)})
            except (InvalidId, Exception):
                pass

            if not elderly_doc:
                elderly_doc = elderly_collection.find_one({"user_id": eid_str})

            if not elderly_doc:
                elderly_doc = elderly_collection.find_one({"id": eid_str})

            if not elderly_doc:
                print(f"  [!] Linked elderly ID '{eid_str}' for Family Member '{fam_name}' not found in DB.")
                skipped_count += 1
                continue

            elderly_name = elderly_doc.get("name") or elderly_doc.get("full_name") or "Elderly Patient"
            elderly_db_id = elderly_doc["_id"]

            has_existing_email = bool(elderly_doc.get("guardian_email"))
            has_existing_name = bool(elderly_doc.get("guardian_name"))

            # Build the guardian payload
            guardian_updates = {
                "guardian_name": fam_name,
                "guardian_relationship": fam_rel,
                "guardian_phone": fam_phone,
                "guardian_email": fam_email if fam_email else None,
                "guardian_report_consent": bool(fam_email),
                "guardian_report_enabled": bool(fam_email),
                "updatedAt": datetime.now(timezone.utc).isoformat()
            }

            status_note = "overwriting existing" if (has_existing_email or has_existing_name) else "new assignment"

            if is_apply:
                elderly_collection.update_one(
                    {"_id": elderly_db_id},
                    {"$set": guardian_updates}
                )
                print(
                    f"  [APPLIED] Migrated -> Resident: '{elderly_name}' (ID: {elderly_db_id}) | "
                    f"Guardian: '{fam_name}' <{fam_email or 'No Email'}> ({fam_rel}) [{status_note}]"
                )
            else:
                print(
                    f"  [DRY-RUN] Would Migrate -> Resident: '{elderly_name}' (ID: {elderly_db_id}) | "
                    f"Guardian: '{fam_name}' <{fam_email or 'No Email'}> ({fam_rel}) [{status_note}]"
                )

            updated_count += 1

    print("\n" + "=" * 70)
    print("Migration Summary:")
    print(f"  - Family Records Processed: {inspected_count}")
    print(f"  - Elderly Records Updated / Planned: {updated_count}")
    print(f"  - Unmatched / Skipped Records: {skipped_count}")
    if is_apply:
        print("  - Status: Successfully committed all updates to MongoDB.")
    else:
        print("  - Status: Completed dry-run. No database records were altered.")
        print("            To apply changes, run: python backend/scripts/migrate_family_to_guardian.py --apply")
    print("=" * 70)


if __name__ == "__main__":
    migrate()
