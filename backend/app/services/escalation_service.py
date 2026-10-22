"""
Missed-Check-in Scheduler & 3-Tier Escalation Chain Engine
Escalation Chain:
- Tier 1 (Overdue >= 2h): Caregiver Alert & Priority Task
- Tier 2 (Overdue >= 4h): Facility Administration Emergency Triage Alert
- Tier 3 (Overdue >= 6h): Designated Primary Emergency Contact / Guardian Notification
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from bson import ObjectId

from app.database import (
    db, elderly_collection, wellness_checkins_collection,
    caregivers_collection, alerts_collection, notifications_collection,
    emergency_contacts_collection
)

escalations_collection = db["checkin_escalations"]

class EscalationService:

    @staticmethod
    def run_missed_checkin_scan() -> Dict[str, Any]:
        """
        Scans all active elderly residents, identifies missed check-ins,
        and applies the progressive 3-tier escalation chain.
        """
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")

        # Assume 10:00 AM local check-in target time
        # Any resident without a check-in by 10 AM is overdue
        elderly_residents = list(elderly_collection.find({"$or": [{"is_active": True}, {"status": "Active"}, {"status": {"$exists": False}}]}))

        escalated_count = 0
        tier_counts = {"tier_1": 0, "tier_2": 0, "tier_3": 0}
        logs = []

        for res in elderly_residents:
            res_user_id = res.get("user_id") or str(res["_id"])
            resident_name = res.get("name") or res.get("full_name") or "Resident"
            cg_id = res.get("assigned_caregiver_id")

            # Check if check-in logged today
            has_checkin = wellness_checkins_collection.find_one({
                "user_id": res_user_id,
                "date": today_str
            })

            if has_checkin:
                # If was previously escalated today, resolve it
                escalations_collection.update_many(
                    {"resident_id": res_user_id, "date": today_str, "status": "active"},
                    {"$set": {"status": "resolved", "resolved_at": now.isoformat(), "resolution_reason": "Check-in completed"}}
                )
                continue

            # Calculate overdue level based on current hour or last check-in date
            latest_checkin = wellness_checkins_collection.find_one({"user_id": res_user_id}, sort=[("created_at", -1)])
            
            # Determine tier
            tier = 1
            if latest_checkin:
                try:
                    last_dt = datetime.fromisoformat(latest_checkin.get("created_at", now.isoformat()).replace("Z", "+00:00"))
                    diff_hours = (now - last_dt).total_seconds() / 3600.0
                    if diff_hours >= 30: # more than 30 hours since last checkin
                        tier = 3
                    elif diff_hours >= 24: # overdue by 4+ hours
                        tier = 2
                    else:
                        tier = 1
                except Exception:
                    tier = 1
            else:
                tier = 1

            # Check if an escalation record already exists for today
            existing_esc = escalations_collection.find_one({
                "resident_id": res_user_id,
                "date": today_str
            })

            current_tier = existing_esc.get("tier", 0) if existing_esc else 0

            if tier > current_tier:
                escalated_count += 1
                tier_key = f"tier_{tier}"
                tier_counts[tier_key] = tier_counts.get(tier_key, 0) + 1

                # 1. Tier 1: Alert & Task to Caregiver
                if tier >= 1:
                    alert_doc = {
                        "user_id": res_user_id,
                        "resident_name": resident_name,
                        "caregiver_id": cg_id,
                        "alert_type": "missed_checkin",
                        "severity": "High",
                        "title": f"⚠️ Missed Check-in: {resident_name}",
                        "message": f"{resident_name} has not submitted their morning check-in. In-person room visit recommended.",
                        "status": "active",
                        "created_at": now.isoformat()
                    }
                    alerts_collection.insert_one(alert_doc)

                # 2. Tier 2: Escalate to Facility Admin
                if tier >= 2:
                    admin_notif = {
                        "title": f"🚨 ESCALATION LEVEL 2: Overdue Check-in for {resident_name}",
                        "message": f"Resident {resident_name} has missed check-in for >24 hours. Assigned caregiver alert is unacknowledged.",
                        "type": "emergency",
                        "target_role": "Admin",
                        "created_at": now.isoformat(),
                        "created_by": "Automated Escalation System"
                    }
                    notifications_collection.insert_one(admin_notif)

                # 3. Tier 3: Escalate to Designated Emergency Contact / Guardian
                if tier >= 3:
                    contact = emergency_contacts_collection.find_one({"user_id": res_user_id, "contact_type": "primary"})
                    contact_name = contact.get("name") if contact else "Designated Contact"
                    contact_phone = contact.get("phone") if contact else "Facility Records"

                    guardian_notif = {
                        "title": f"📢 TIER 3 ESCALATION: Safety Check for {resident_name}",
                        "message": f"Daily check-in for {resident_name} is overdue. Care station has initiated primary contact outreach to {contact_name} ({contact_phone}).",
                        "type": "emergency",
                        "target_role": "all",
                        "created_at": now.isoformat(),
                        "created_by": "Safety Escalation Engine"
                    }
                    notifications_collection.insert_one(guardian_notif)

                # Record or update escalation status
                esc_record = {
                    "resident_id": res_user_id,
                    "resident_name": resident_name,
                    "date": today_str,
                    "tier": tier,
                    "status": "active",
                    "escalation_chain": [
                        "Caregiver Alert Dispatched",
                        "Facility Admin Emergency Triage" if tier >= 2 else "Admin Standby",
                        "Primary Emergency Contact Notification" if tier >= 3 else "Emergency Contact Standby"
                    ],
                    "updated_at": now.isoformat()
                }

                if existing_esc:
                    escalations_collection.update_one({"_id": existing_esc["_id"]}, {"$set": esc_record})
                else:
                    esc_record["created_at"] = now.isoformat()
                    escalations_collection.insert_one(esc_record)

                logs.append(f"{resident_name}: Escalated to Tier {tier}")

        return {
            "scanned_residents": len(elderly_residents),
            "new_escalations": escalated_count,
            "tier_breakdown": tier_counts,
            "date": today_str,
            "logs": logs
        }

    @staticmethod
    def get_active_escalations() -> List[Dict[str, Any]]:
        """Returns all currently unresolved check-in escalations."""
        docs = list(escalations_collection.find({"status": "active"}).sort("tier", -1))
        return [
            {
                "id": str(d["_id"]),
                "resident_id": d.get("resident_id"),
                "resident_name": d.get("resident_name", "Resident"),
                "date": d.get("date"),
                "tier": d.get("tier", 1),
                "status": d.get("status"),
                "chain": d.get("escalation_chain", []),
                "created_at": d.get("created_at"),
                "updated_at": d.get("updated_at")
            }
            for d in docs
        ]

    @staticmethod
    def resolve_escalation(escalation_id: str, caregiver_name: str, resolution_note: str) -> Dict[str, Any]:
        """Resolves an escalation with caregiver documentation."""
        now = datetime.now(timezone.utc).isoformat()
        try:
            obj_id = ObjectId(escalation_id)
            escalations_collection.update_one(
                {"_id": obj_id},
                {"$set": {
                    "status": "resolved",
                    "resolved_by": caregiver_name,
                    "resolution_note": resolution_note,
                    "resolved_at": now
                }}
            )
            return {"message": "Escalation resolved and documented successfully."}
        except Exception as e:
            return {"error": str(e)}
