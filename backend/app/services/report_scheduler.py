"""
Optional Daily Report Auto-Sender via APScheduler (Free)
========================================================
If AUTO_SEND_DAILY_REPORTS is True, schedules an automated daily report delivery
to guardians who have registered email, report_enabled=True, and report_consent=True.
Runs at AUTO_SEND_TIME (Asia/Kolkata timezone, default 20:00).
Reuses send_daily_report_to_guardian_sync and enforces the exact same rules and logging.
"""

from app.config import AUTO_SEND_DAILY_REPORTS, AUTO_SEND_TIME


def init_daily_report_scheduler():
    """
    Initializes APScheduler background job if AUTO_SEND_DAILY_REPORTS is True.
    Gracefully degrades if apscheduler is not installed.
    """
    if not AUTO_SEND_DAILY_REPORTS:
        return None

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger

        hour = 20
        minute = 0
        if AUTO_SEND_TIME and ":" in str(AUTO_SEND_TIME):
            parts = str(AUTO_SEND_TIME).split(":")
            hour = int(parts[0])
            minute = int(parts[1])

        scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

        def run_auto_send_job():
            from app.database import elderly_collection, db
            from app.services.email_service import send_daily_report_to_guardian_sync
            from app.services.daily_report_service import get_today_ist_str

            today_ist = get_today_ist_str()
            logs_collection = db["report_email_logs"]

            cursor = list(elderly_collection.find({
                "guardian_email": {"$exists": True, "$ne": None, "$ne": ""},
                "guardian_report_consent": True,
                "guardian_report_enabled": True
            }))

            for eld in cursor:
                eid = str(eld["_id"])
                # Avoid duplicates: only send if not already sent today
                already_sent = logs_collection.count_documents({
                    "elderly_id": eid,
                    "date": today_ist,
                    "status": "sent"
                }) > 0

                if not already_sent:
                    cg_id = str(eld.get("assigned_caregiver_id") or "auto-system")
                    try:
                        send_daily_report_to_guardian_sync(
                            elderly_id=eid,
                            caregiver_id=cg_id,
                            caregiver_name="HomeJoy Scheduled Care Service",
                            target_date=today_ist,
                            note="Automated daily wellness report dispatched per schedule."
                        )
                    except Exception as e:
                        print(f"[WARN] Scheduled report send failed for elderly {eid}:", e)

        scheduler.add_job(
            run_auto_send_job,
            CronTrigger(hour=hour, minute=minute, timezone="Asia/Kolkata"),
            id="daily_guardian_report_cron",
            replace_existing=True
        )
        scheduler.start()
        print(f"[OK] Daily Report APScheduler started — scheduled at {hour:02d}:{minute:02d} IST.")
        return scheduler

    except ImportError:
        print("[INFO] APScheduler library not installed; AUTO_SEND_DAILY_REPORTS scheduled job deferred.")
        return None
    except Exception as e:
        print("[WARN] Failed to start Daily Report APScheduler:", e)
        return None


def init_missed_dose_scheduler():
    """
    Initializes APScheduler background job running every 15 minutes to scan
    and alert for closed dose windows without records.
    """
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.interval import IntervalTrigger

        scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

        def run_missed_dose_job():
            try:
                from app.services.medication_dose_service import MedicationDoseService
                MedicationDoseService.scan_and_alert_missed_doses()
            except Exception as e:
                print("[WARN] Missed dose scanner error:", e)

        scheduler.add_job(
            run_missed_dose_job,
            IntervalTrigger(minutes=15),
            id="missed_dose_scanner_job",
            replace_existing=True
        )
        scheduler.start()
        print("[OK] Missed Dose Scanner APScheduler started — running every 15 minutes.")
        return scheduler
    except ImportError:
        print("[INFO] APScheduler library not installed; missed dose background scanner deferred.")
        return None
    except Exception as e:
        print("[WARN] Failed to start Missed Dose Scanner APScheduler:", e)
        return None
