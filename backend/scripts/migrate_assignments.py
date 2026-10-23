"""
Migration Script: Reconcile and Normalize Caregiver Assignments, Districts, and Capacities.

Dry-run by default. Pass --apply to write changes to MongoDB.

Usage:
    python backend/scripts/migrate_assignments.py
    python backend/scripts/migrate_assignments.py --apply
"""
import sys
import argparse
from datetime import datetime, timezone
from bson import ObjectId

# Ensure backend root is in sys.path
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import db, elderly_collection, caregivers_collection, users_collection
from app.constants import DEFAULT_DISTRICT, DEFAULT_MAX_PATIENTS, KERALA_DISTRICTS


def run_migration(apply_changes: bool = False):
    print("=" * 70)
    print(" HomeJoy Caregiver Assignment & Capacity Migration Tool")
    print(f" Mode: {'[APPLY CHANGES]' if apply_changes else '[DRY RUN - Read Only]'}")
    print("=" * 70)

    now_iso = datetime.now(timezone.utc).isoformat()
    all_caregivers = list(caregivers_collection.find({}))
    all_elderly = list(elderly_collection.find({}))

    caregiver_map = {} # user_id/str(_id) -> doc
    caregiver_id_map = {} # str(_id) -> doc
    for cg in all_caregivers:
        cg_id = str(cg["_id"])
        cg_user_id = str(cg.get("user_id") or cg_id)
        caregiver_map[cg_id] = cg
        caregiver_map[cg_user_id] = cg
        caregiver_id_map[cg_id] = cg

    stats = {
        "total_caregivers": len(all_caregivers),
        "total_elderly": len(all_elderly),
        "missing_cg_district_fixed": 0,
        "missing_cg_capacity_fixed": 0,
        "missing_eld_district_fixed": 0,
        "orphaned_assignments_cleared": 0,
        "mirror_lists_repaired": 0,
        "active_assignments": 0,
        "unassigned_elderly": 0
    }

    # 1. Check and backfill caregiver district & max_patients
    print("\n[1/4] Checking Caregiver Profiles for District & Capacity defaults...")
    for cg in all_caregivers:
        updates = {}
        if not cg.get("district") or cg.get("district") not in KERALA_DISTRICTS:
            updates["district"] = DEFAULT_DISTRICT
            stats["missing_cg_district_fixed"] += 1
        if not cg.get("max_patients") or not isinstance(cg.get("max_patients"), int) or cg.get("max_patients") < 1:
            updates["max_patients"] = DEFAULT_MAX_PATIENTS
            stats["missing_cg_capacity_fixed"] += 1

        if updates:
            print(f"  * Caregiver '{cg.get('name') or cg.get('full_name')}': setting {updates}")
            if apply_changes:
                caregivers_collection.update_one({"_id": cg["_id"]}, {"$set": updates})

    # 2. Check and backfill elderly district
    print("\n[2/4] Checking Elderly Profiles for District default...")
    for eld in all_elderly:
        if not eld.get("district") or eld.get("district") not in KERALA_DISTRICTS:
            stats["missing_eld_district_fixed"] += 1
            print(f"  * Elderly '{eld.get('full_name') or eld.get('name')}': setting district='{DEFAULT_DISTRICT}'")
            if apply_changes:
                elderly_collection.update_one({"_id": eld["_id"]}, {"$set": {"district": DEFAULT_DISTRICT}})

    # 3. Check for orphaned or invalid assignments
    print("\n[3/4] Validating Elderly Assignments...")
    actual_rosters = {str(cg["_id"]): [] for cg in all_caregivers} # cg_id -> list of eld_pk_str
    actual_roster_names = {str(cg["_id"]): [] for cg in all_caregivers}

    for eld in all_elderly:
        eld_pk_str = str(eld["_id"])
        eld_name = eld.get("full_name") or eld.get("name", "Elderly Patient")
        assigned_cg_id = eld.get("assigned_caregiver_id")

        if not assigned_cg_id or str(assigned_cg_id).strip() in ["", "None", "null", "Not Assigned"]:
            stats["unassigned_elderly"] += 1
            continue

        assigned_cg_str = str(assigned_cg_id).strip()
        cg_doc = caregiver_map.get(assigned_cg_str)

        if not cg_doc:
            # Caregiver does not exist! Orphaned assignment
            print(f"  ! WARNING: Elderly '{eld_name}' has non-existent caregiver ID '{assigned_cg_str}'. Unassigning.")
            stats["orphaned_assignments_cleared"] += 1
            stats["unassigned_elderly"] += 1
            if apply_changes:
                elderly_collection.update_one(
                    {"_id": eld["_id"]},
                    {"$set": {"assigned_caregiver_id": None, "assigned_caregiver_name": "Not Assigned", "updatedAt": now_iso}}
                )
        else:
            stats["active_assignments"] += 1
            target_cg_pk = str(cg_doc["_id"])
            actual_rosters[target_cg_pk].append(eld_pk_str)
            actual_roster_names[target_cg_pk].append(eld_name)

    # 4. Repair mirror lists on caregivers
    print("\n[4/4] Repairing Caregiver Mirror Lists (assigned_elderly_ids)...")
    for cg in all_caregivers:
        cg_pk = str(cg["_id"])
        current_ids = set(cg.get("assigned_elderly_ids", []))
        authoritative_ids = set(actual_rosters.get(cg_pk, []))

        if current_ids != authoritative_ids:
            stats["mirror_lists_repaired"] += 1
            print(f"  * Caregiver '{cg.get('name') or cg.get('full_name')}': "
                  f"current roster {list(current_ids)} -> reconciled to {list(authoritative_ids)}")
            if apply_changes:
                caregivers_collection.update_one(
                    {"_id": cg["_id"]},
                    {"$set": {
                        "assigned_elderly_ids": actual_rosters.get(cg_pk, []),
                        "assigned_elderly_names": actual_roster_names.get(cg_pk, []),
                        "updatedAt": now_iso
                    }}
                )

    print("\n" + "=" * 70)
    print(" Migration Summary:")
    print("-" * 70)
    for k, v in stats.items():
        print(f"  - {k.replace('_', ' ').capitalize()}: {v}")
    print("=" * 70)
    if not apply_changes:
        print(" [!] This was a DRY-RUN. No changes were committed.")
        print(" Run with '--apply' flag to persist changes into the database.")
    else:
        print(" [OK] All migration fixes have been successfully applied to the database.")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Caregiver Allocation Migration")
    parser.add_argument("--apply", action="store_true", help="Apply updates to database")
    args = parser.parse_args()
    run_migration(apply_changes=args.apply)
