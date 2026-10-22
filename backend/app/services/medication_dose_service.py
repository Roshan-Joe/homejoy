"""
Medication Dose & Smart Pill Reliability Service.
Strictly bound to server clock in Asia/Kolkata timezone.
Handles time-window calculations, idempotency, dose logging, undo within 5 mins,
adherence streak calculation, and missed dose scanning with deduplicated alerts.
"""

from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional
import os
import re
from zoneinfo import ZoneInfo
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status

from app.database import (
    medications_collection,
    dose_logs_collection,
    elderly_collection,
    caregivers_collection,
    notifications_collection,
    alerts_collection,
)
from app.config import DOSE_WINDOW_BEFORE_MIN, DOSE_WINDOW_AFTER_MIN
from app.schemas.elderly_client_schema import parse_legacy_intake_time

try:
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = timezone(timedelta(hours=5, minutes=30))


def get_now_ist() -> datetime:
    """Returns current server time localized to Asia/Kolkata."""
    return datetime.now(IST)


def derive_slot_name(time_str: str) -> str:
    """Derives Morning, Afternoon, Evening, or Night from 24h 'HH:MM' string."""
    try:
        hour = int(time_str.split(":")[0])
    except Exception:
        return "Morning"

    if 5 <= hour < 12:
        return "Morning"
    elif 12 <= hour < 17:
        return "Afternoon"
    elif 17 <= hour < 21:
        return "Evening"
    else:
        return "Night"


def compute_dose_window(scheduled_date_str: str, scheduled_time_str: str):
    """
    Computes scheduled_dt, window_opens_dt, and window_closes_dt in Asia/Kolkata timezone.
    DOSE_WINDOW_BEFORE_MIN: window opens X minutes before scheduled time (default 60).
    DOSE_WINDOW_AFTER_MIN: window closes Y minutes after scheduled time (default 180).
    """
    d = date.fromisoformat(scheduled_date_str)
    h, m = [int(x) for x in scheduled_time_str.split(":")]
    scheduled_dt = datetime(d.year, d.month, d.day, h, m, tzinfo=IST)
    opens_dt = scheduled_dt - timedelta(minutes=DOSE_WINDOW_BEFORE_MIN)
    closes_dt = scheduled_dt + timedelta(minutes=DOSE_WINDOW_AFTER_MIN)
    return scheduled_dt, opens_dt, closes_dt


class MedicationDoseService:

    @staticmethod
    def get_today_slots(user_id: str, target_date_str: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Returns all scheduled dose slots for today in a single batched query (no N+1).
        State is computed server-side: upcoming | due | taken | taken_late | missed | skipped.
        """
        now_ist = get_now_ist()
        today_str = target_date_str.strip() if target_date_str and target_date_str.strip() else now_ist.date().isoformat()
        current_weekday = date.fromisoformat(today_str).weekday()  # 0=Monday, 6=Sunday

        # 1. Fetch all active medications for this user
        med_query = {
            "user_id": user_id,
            "start_date": {"$lte": today_str},
            "$or": [{"end_date": None}, {"end_date": {"$gte": today_str}}]
        }
        meds = list(medications_collection.find(med_query))
        if not meds:
            return []

        # Filter medications active on today's weekday
        active_meds = []
        for m in meds:
            days = m.get("days_of_week")
            if days is None:
                days = [0, 1, 2, 3, 4, 5, 6]
            if current_weekday in days:
                active_meds.append(m)

        if not active_meds:
            return []

        med_ids = [str(m["_id"]) for m in active_meds]

        # 2. Batched query for all dose_logs for these medications on today_str (single DB hit)
        logs_cursor = dose_logs_collection.find({
            "med_id": {"$in": med_ids},
            "scheduled_date": today_str
        })
        # Index logs by (med_id, scheduled_time)
        logs_map = {}
        for l in logs_cursor:
            key = (str(l["med_id"]), str(l["scheduled_time"]))
            logs_map[key] = l

        slots = []

        for med in active_meds:
            med_id = str(med["_id"])
            times = med.get("times")
            if not times:
                legacy_intake = med.get("intake_time", "")
                times = parse_legacy_intake_time(legacy_intake)

            for t_str in times:
                scheduled_dt, opens_dt, closes_dt = compute_dose_window(today_str, t_str)
                log = logs_map.get((med_id, t_str))

                if log:
                    status_val = log.get("status", "taken")
                    if status_val == "taken":
                        late_m = log.get("late_minutes", 0)
                        state = "taken_late" if late_m > 15 else "taken"
                    elif status_val == "missed":
                        state = "missed"
                    elif status_val == "skipped":
                        state = "skipped"
                    else:
                        state = status_val
                    taken_at = log.get("taken_at")
                    late_minutes = log.get("late_minutes", 0)
                    source = log.get("source", "patient")
                else:
                    taken_at = None
                    late_minutes = 0
                    source = None
                    if now_ist < opens_dt:
                        state = "upcoming"
                    elif opens_dt <= now_ist <= closes_dt:
                        state = "due"
                    else:
                        state = "missed"

                opens_display = opens_dt.strftime("%I:%M %p").lstrip("0")
                closes_display = closes_dt.strftime("%I:%M %p").lstrip("0")
                sched_display = scheduled_dt.strftime("%I:%M %p").lstrip("0")

                slots.append({
                    "med_id": med_id,
                    "name": med.get("medicine_name", "Medication"),
                    "dosage": med.get("dosage", ""),
                    "scheduled_time": t_str,
                    "scheduled_time_display": sched_display,
                    "slot": derive_slot_name(t_str),
                    "state": state,
                    "opens_at": opens_dt.strftime("%H:%M"),
                    "opens_at_display": opens_display,
                    "closes_at": closes_dt.strftime("%H:%M"),
                    "closes_at_display": closes_display,
                    "taken_at": taken_at,
                    "late_minutes": late_minutes,
                    "source": source,
                    "before_food": med.get("before_food", True),
                    "prescribed_by": med.get("prescribed_by", "")
                })

        # Sort slots by scheduled_time
        slots.sort(key=lambda s: s["scheduled_time"])
        return slots

    @staticmethod
    def take_dose(
        user_id: str,
        med_id: str,
        scheduled_time: str,
        source: str = "patient"
    ) -> Dict[str, Any]:
        """
        Records medication dose as taken.
        - Validates medication belongs to user and scheduled_time is configured for today.
        - Server time window: 409 if before window; 409 if after window unless source=caregiver.
        - Idempotent: duplicate calls return existing record, never duplicate.
        - Marks taken_late if > 15 minutes past scheduled time.
        """
        now_ist = get_now_ist()
        today_str = now_ist.date().isoformat()
        current_weekday = now_ist.weekday()

        try:
            obj_id = ObjectId(med_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid medication ID.")

        med = medications_collection.find_one({"_id": obj_id})
        if not med:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")

        # Ownership check
        if source == "patient" and str(med.get("user_id")) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: medication does not belong to you.")

        # Check times
        times = med.get("times")
        if not times:
            times = parse_legacy_intake_time(med.get("intake_time", ""))

        if scheduled_time not in times:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Scheduled time '{scheduled_time}' is not configured for {med.get('medicine_name')}."
            )

        # Check days of week
        days_of_week = med.get("days_of_week") or [0, 1, 2, 3, 4, 5, 6]
        if current_weekday not in days_of_week:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{med.get('medicine_name')} is not scheduled for today."
            )

        scheduled_dt, opens_dt, closes_dt = compute_dose_window(today_str, scheduled_time)

        # Time-window enforcement for patient
        if source == "patient":
            if now_ist < opens_dt:
                opens_formatted = opens_dt.strftime("%I:%M %p").lstrip("0")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Dose opens at {opens_formatted}."
                )
            if now_ist > closes_dt:
                closes_formatted = closes_dt.strftime("%I:%M %p").lstrip("0")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Dose window closed at {closes_formatted}. Please contact your caregiver if you took this dose."
                )

        # Compute late minutes
        diff_minutes = int((now_ist - scheduled_dt).total_seconds() / 60)
        late_minutes = max(0, diff_minutes)
        is_late = late_minutes > 15

        now_iso = datetime.now(timezone.utc).isoformat()

        # Idempotency check: see if log already exists
        existing = dose_logs_collection.find_one({
            "med_id": str(med["_id"]),
            "scheduled_date": today_str,
            "scheduled_time": scheduled_time
        })

        if existing:
            if existing.get("status") == "taken":
                # Return existing taken log idempotently
                return {
                    "success": True,
                    "idempotent": True,
                    "status": "taken_late" if existing.get("late_minutes", 0) > 15 else "taken",
                    "log_id": str(existing["_id"]),
                    "med_id": str(med["_id"]),
                    "medicine_name": med.get("medicine_name"),
                    "dosage": med.get("dosage"),
                    "scheduled_time": scheduled_time,
                    "taken_at": existing.get("taken_at"),
                    "late_minutes": existing.get("late_minutes", 0),
                    "source": existing.get("source", source),
                    "message": "Dose already recorded as taken."
                }
            else:
                # Update status from missed/skipped to taken
                dose_logs_collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {
                        "status": "taken",
                        "taken_at": now_iso,
                        "late_minutes": late_minutes,
                        "source": source
                    }}
                )
                return {
                    "success": True,
                    "idempotent": False,
                    "status": "taken_late" if is_late else "taken",
                    "log_id": str(existing["_id"]),
                    "med_id": str(med["_id"]),
                    "medicine_name": med.get("medicine_name"),
                    "dosage": med.get("dosage"),
                    "scheduled_time": scheduled_time,
                    "taken_at": now_iso,
                    "late_minutes": late_minutes,
                    "source": source,
                    "message": f"Dose updated to taken ({'late' if is_late else 'on time'})."
                }

        # Insert new dose log
        doc = {
            "user_id": str(med["user_id"]),
            "med_id": str(med["_id"]),
            "scheduled_date": today_str,
            "scheduled_time": scheduled_time,
            "status": "taken",
            "taken_at": now_iso,
            "late_minutes": late_minutes,
            "source": source,
            "created_at": now_iso
        }

        try:
            res = dose_logs_collection.insert_one(doc)
            doc["_id"] = res.inserted_id
        except DuplicateKeyError:
            # Race condition handling: return existing record
            existing = dose_logs_collection.find_one({
                "med_id": str(med["_id"]),
                "scheduled_date": today_str,
                "scheduled_time": scheduled_time
            })
            if existing:
                return {
                    "success": True,
                    "idempotent": True,
                    "status": "taken_late" if existing.get("late_minutes", 0) > 15 else "taken",
                    "log_id": str(existing["_id"]),
                    "med_id": str(med["_id"]),
                    "medicine_name": med.get("medicine_name"),
                    "dosage": med.get("dosage"),
                    "scheduled_time": scheduled_time,
                    "taken_at": existing.get("taken_at"),
                    "late_minutes": existing.get("late_minutes", 0),
                    "source": existing.get("source", source),
                    "message": "Dose already recorded as taken."
                }
            raise

        # Audit notification for elderly
        notifications_collection.insert_one({
            "user_id": str(med["user_id"]),
            "target_role": "elderly",
            "title": f"💊 Dose Recorded: {med.get('medicine_name')}",
            "message": f"{med.get('medicine_name')} ({med.get('dosage')}) scheduled for {scheduled_time} marked as taken ({'late' if is_late else 'on time'}) via {source}.",
            "type": "reminder",
            "created_at": now_iso
        })

        return {
            "success": True,
            "idempotent": False,
            "status": "taken_late" if is_late else "taken",
            "log_id": str(doc["_id"]),
            "med_id": str(med["_id"]),
            "medicine_name": med.get("medicine_name"),
            "dosage": med.get("dosage"),
            "scheduled_time": scheduled_time,
            "taken_at": now_iso,
            "late_minutes": late_minutes,
            "source": source,
            "message": f"Dose marked as taken ({'late' if is_late else 'on time'})."
        }

    @staticmethod
    def undo_dose(user_id: str, med_id: str, scheduled_time: str) -> Dict[str, Any]:
        """
        Reverts a taken dose within a strict 5-minute undo window.
        Logs audit entry in notifications.
        """
        now_ist = get_now_ist()
        today_str = now_ist.date().isoformat()

        try:
            obj_id = ObjectId(med_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid medication ID.")

        med = medications_collection.find_one({"_id": obj_id})
        if not med:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")

        if str(med.get("user_id")) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: medication does not belong to you.")

        log = dose_logs_collection.find_one({
            "med_id": str(med["_id"]),
            "scheduled_date": today_str,
            "scheduled_time": scheduled_time,
            "status": "taken"
        })

        if not log:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No taken dose record found for today's scheduled time."
            )

        taken_at_str = log.get("taken_at")
        if taken_at_str:
            taken_at_dt = datetime.fromisoformat(taken_at_str)
            if taken_at_dt.tzinfo is None:
                taken_at_dt = taken_at_dt.replace(tzinfo=timezone.utc)
            now_utc = datetime.now(timezone.utc)
            elapsed = (now_utc - taken_at_dt).total_seconds()
            if elapsed > 300:  # 5 minutes
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Dose action can only be undone within 5 minutes of taking."
                )

        # Delete the dose log
        dose_logs_collection.delete_one({"_id": log["_id"]})

        now_iso = datetime.now(timezone.utc).isoformat()
        # Audit notification
        notifications_collection.insert_one({
            "user_id": str(user_id),
            "target_role": "elderly",
            "title": f"↩️ Dose Action Undone: {med.get('medicine_name')}",
            "message": f"Taken status for {med.get('medicine_name')} ({scheduled_time}) was undone within the 5-minute grace window.",
            "type": "reminder",
            "created_at": now_iso
        })

        return {
            "success": True,
            "message": f"Dose for {med.get('medicine_name')} ({scheduled_time}) has been undone."
        }

    @staticmethod
    def get_adherence(user_id: str, days: int = 7) -> Dict[str, Any]:
        """
        Calculates today's taken/total, 7-day adherence percentage, and continuous streak.
        Streak: consecutive days (going backwards) where every scheduled dose was taken.
        """
        now_ist = get_now_ist()
        today_date = now_ist.date()
        today_str = today_date.isoformat()

        # 1. Fetch all active medications for user
        active_meds = list(medications_collection.find({"user_id": user_id}))
        if not active_meds:
            return {
                "today": {"taken": 0, "total": 0},
                "today_taken": 0,
                "today_total": 0,
                "seven_day_percentage": 100.0,
                "streak_days": 0
            }

        # 2. Today's stats
        today_weekday = today_date.weekday()
        today_scheduled_times = []
        for m in active_meds:
            days_allowed = m.get("days_of_week") or [0, 1, 2, 3, 4, 5, 6]
            if today_weekday in days_allowed:
                times = m.get("times") or parse_legacy_intake_time(m.get("intake_time", ""))
                for t in times:
                    today_scheduled_times.append((str(m["_id"]), t))

        today_total = len(today_scheduled_times)
        today_taken = dose_logs_collection.count_documents({
            "user_id": user_id,
            "scheduled_date": today_str,
            "status": "taken"
        })

        # 3. 7-day adherence percentage
        start_date = today_date - timedelta(days=days - 1)
        start_date_str = start_date.isoformat()

        # Compute total scheduled doses across past `days`
        total_scheduled_window = 0
        cur_d = start_date
        while cur_d <= today_date:
            w = cur_d.weekday()
            for m in active_meds:
                days_allowed = m.get("days_of_week") or [0, 1, 2, 3, 4, 5, 6]
                if w in days_allowed:
                    times = m.get("times") or parse_legacy_intake_time(m.get("intake_time", ""))
                    total_scheduled_window += len(times)
            cur_d += timedelta(days=1)

        total_taken_window = dose_logs_collection.count_documents({
            "user_id": user_id,
            "scheduled_date": {"$gte": start_date_str, "$lte": today_str},
            "status": "taken"
        })

        if total_scheduled_window > 0:
            seven_day_pct = round((total_taken_window / total_scheduled_window) * 100, 1)
        else:
            seven_day_pct = 100.0

        # 4. Consecutive streak calculation
        # Check going back day by day
        streak = 0
        check_date = today_date

        # If today has scheduled doses and all are already taken, count today in streak
        if today_total > 0 and today_taken >= today_total:
            streak += 1
            check_date = today_date - timedelta(days=1)
        else:
            # Check starts from yesterday
            check_date = today_date - timedelta(days=1)

        max_lookback = 60
        for _ in range(max_lookback):
            d_str = check_date.isoformat()
            d_weekday = check_date.weekday()

            # How many scheduled on this day?
            sched_count = 0
            for m in active_meds:
                # verify med was active on check_date
                s_date = m.get("start_date", "1900-01-01")
                e_date = m.get("end_date")
                if s_date <= d_str and (e_date is None or e_date >= d_str):
                    days_allowed = m.get("days_of_week") or [0, 1, 2, 3, 4, 5, 6]
                    if d_weekday in days_allowed:
                        times = m.get("times") or parse_legacy_intake_time(m.get("intake_time", ""))
                        sched_count += len(times)

            if sched_count == 0:
                # No meds scheduled on this day; continue back
                check_date -= timedelta(days=1)
                continue

            taken_count = dose_logs_collection.count_documents({
                "user_id": user_id,
                "scheduled_date": d_str,
                "status": "taken"
            })

            if taken_count >= sched_count:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                # Streak broken!
                break

        return {
            "today": {"taken": today_taken, "total": today_total},
            "today_taken": today_taken,
            "today_total": today_total,
            "seven_day_percentage": min(100.0, seven_day_pct),
            "streak_days": streak
        }

    @staticmethod
    def scan_and_alert_missed_doses():
        """
        Scheduled background task running every 15 minutes.
        For every dose slot whose window has closed with no log:
        - Inserts status='missed', source='auto'.
        - Creates ONE deduplicated alert for the assigned caregiver.
        """
        now_ist = get_now_ist()
        today_str = now_ist.date().isoformat()
        current_weekday = now_ist.weekday()
        now_iso = datetime.now(timezone.utc).isoformat()

        # Fetch all active medications
        meds = list(medications_collection.find({
            "start_date": {"$lte": today_str},
            "$or": [{"end_date": None}, {"end_date": {"$gte": today_str}}]
        }))

        # Group by user_id
        user_missed_doses: Dict[str, List[Dict[str, Any]]] = {}

        for med in meds:
            days = med.get("days_of_week") or [0, 1, 2, 3, 4, 5, 6]
            if current_weekday not in days:
                continue

            med_id = str(med["_id"])
            user_id = str(med.get("user_id"))
            times = med.get("times") or parse_legacy_intake_time(med.get("intake_time", ""))

            for t_str in times:
                scheduled_dt, opens_dt, closes_dt = compute_dose_window(today_str, t_str)
                # Has window closed?
                if now_ist > closes_dt:
                    # Check if log already exists
                    existing = dose_logs_collection.find_one({
                        "med_id": med_id,
                        "scheduled_date": today_str,
                        "scheduled_time": t_str
                    })
                    if not existing:
                        missed_doc = {
                            "user_id": user_id,
                            "med_id": med_id,
                            "scheduled_date": today_str,
                            "scheduled_time": t_str,
                            "status": "missed",
                            "taken_at": None,
                            "late_minutes": 0,
                            "source": "auto",
                            "created_at": now_iso
                        }
                        try:
                            dose_logs_collection.insert_one(missed_doc)
                            if user_id not in user_missed_doses:
                                user_missed_doses[user_id] = []
                            user_missed_doses[user_id].append({
                                "med_name": med.get("medicine_name", "Medication"),
                                "dosage": med.get("dosage", ""),
                                "time": t_str
                            })
                        except DuplicateKeyError:
                            pass

        # For each user with newly marked missed doses, alert their caregiver ONCE per date
        for u_id, missed_list in user_missed_doses.items():
            profile = elderly_collection.find_one({"user_id": u_id})
            if not profile:
                profile = elderly_collection.find_one({"_id": ObjectId(u_id)}) if ObjectId.is_valid(u_id) else None

            if not profile:
                continue

            eld_name = profile.get("full_name") or profile.get("name") or "Resident"
            caregiver_id = profile.get("assigned_caregiver_id")
            eld_pk = str(profile["_id"])

            # Check if alert already sent today for this elderly
            alert_tag = f"missed_med_{eld_pk}_{today_str}"
            existing_alert = alerts_collection.find_one({
                "alert_tag": alert_tag
            })

            meds_summary = ", ".join([f"{m['med_name']} ({m['time']})" for m in missed_list])

            if existing_alert:
                # Update existing alert with any newly added missed meds
                alerts_collection.update_one(
                    {"_id": existing_alert["_id"]},
                    {"$set": {
                        "message": f"{eld_name} missed scheduled doses today: {meds_summary}. Please verify their wellness status.",
                        "updated_at": now_iso
                    }}
                )
            else:
                alert_doc = {
                    "alert_tag": alert_tag,
                    "elderly_id": eld_pk,
                    "elderly_user_id": u_id,
                    "elderly_name": eld_name,
                    "caregiver_id": str(caregiver_id) if caregiver_id else None,
                    "target_role": "caregiver",
                    "title": f"🚨 Missed Medication Alert: {eld_name}",
                    "message": f"{eld_name} missed scheduled doses today: {meds_summary}. Please verify their wellness status.",
                    "type": "missed_medication",
                    "status": "unread",
                    "date": today_str,
                    "created_at": now_iso
                }
                alerts_collection.insert_one(alert_doc)
