"""
Unit and Integration Tests for Caregiver Allocation System and Admin Operations.
Tests:
- Suggestion ranking order (hard rule active/capacity -> same district -> least clients -> name A-Z)
- Capacity limit enforcement (atomic 409 conflict when at capacity)
- Assignment & Unassignment authoritative updates
- History audit trail and notifications
- Single-aggregation dashboard stats query
- Pending assignment queue overdue detection
- Bulk user status update
"""
import unittest
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException

from app.database import (
    users_collection,
    elderly_collection,
    caregivers_collection,
    assignment_history_collection,
    notifications_collection,
    help_requests_collection
)
from app.services.assignment_service import AssignmentService
from app.routers.admin import get_caregiver_suggestions, get_unassigned_elderly, get_dashboard_stats, bulk_update_user_status
from app.schemas import BulkUserStatusUpdate


class TestCaregiverAllocation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.test_tag = "test_alloc_"
        # Clean up any leftover test data
        users_collection.delete_many({"email": {"$regex": f"^{cls.test_tag}"}})
        caregivers_collection.delete_many({"email": {"$regex": f"^{cls.test_tag}"}})
        elderly_collection.delete_many({"email": {"$regex": f"^{cls.test_tag}"}})

        now_iso = datetime.now(timezone.utc).isoformat()
        cls.admin_user = {"id": "test_admin_id", "full_name": "Test Admin", "role": "Admin"}

        # 1. Create Caregivers with different districts, capacities, workloads:
        # CG 1: Ernakulam, max 3, currently 2 assigned, Active, name "Zoe"
        u1 = users_collection.insert_one({"email": f"{cls.test_tag}zoe@example.com", "full_name": "Zoe CG", "role": "Caregiver", "is_active": True})
        cg1 = caregivers_collection.insert_one({
            "user_id": str(u1.inserted_id), "name": "Zoe CG", "email": f"{cls.test_tag}zoe@example.com",
            "district": "Ernakulam", "max_patients": 3, "status": "Active",
            "assigned_elderly_ids": ["dummy1", "dummy2"], "assigned_elderly_names": ["Dummy 1", "Dummy 2"]
        })
        cls.cg1_id = str(cg1.inserted_id)

        # CG 2: Ernakulam, max 3, currently 0 assigned, Active, name "Adam"
        u2 = users_collection.insert_one({"email": f"{cls.test_tag}adam@example.com", "full_name": "Adam CG", "role": "Caregiver", "is_active": True})
        cg2 = caregivers_collection.insert_one({
            "user_id": str(u2.inserted_id), "name": "Adam CG", "email": f"{cls.test_tag}adam@example.com",
            "district": "Ernakulam", "max_patients": 3, "status": "Active",
            "assigned_elderly_ids": [], "assigned_elderly_names": []
        })
        cls.cg2_id = str(cg2.inserted_id)

        # CG 3: Thrissur (different district), max 3, currently 0 assigned, Active, name "Bob"
        u3 = users_collection.insert_one({"email": f"{cls.test_tag}bob@example.com", "full_name": "Bob CG", "role": "Caregiver", "is_active": True})
        cg3 = caregivers_collection.insert_one({
            "user_id": str(u3.inserted_id), "name": "Bob CG", "email": f"{cls.test_tag}bob@example.com",
            "district": "Thrissur", "max_patients": 3, "status": "Active",
            "assigned_elderly_ids": [], "assigned_elderly_names": []
        })
        cls.cg3_id = str(cg3.inserted_id)

        # CG 4: Ernakulam, max 2, currently 2 assigned (At Capacity), Active, name "Full CG"
        u4 = users_collection.insert_one({"email": f"{cls.test_tag}full@example.com", "full_name": "Full CG", "role": "Caregiver", "is_active": True})
        cg4 = caregivers_collection.insert_one({
            "user_id": str(u4.inserted_id), "name": "Full CG", "email": f"{cls.test_tag}full@example.com",
            "district": "Ernakulam", "max_patients": 2, "status": "Active",
            "assigned_elderly_ids": ["dummy3", "dummy4"], "assigned_elderly_names": ["Dummy 3", "Dummy 4"]
        })
        cls.cg4_id = str(cg4.inserted_id)

        # CG 5: Ernakulam, Inactive / On Leave
        u5 = users_collection.insert_one({"email": f"{cls.test_tag}leave@example.com", "full_name": "Leave CG", "role": "Caregiver", "is_active": False})
        cg5 = caregivers_collection.insert_one({
            "user_id": str(u5.inserted_id), "name": "Leave CG", "email": f"{cls.test_tag}leave@example.com",
            "district": "Ernakulam", "max_patients": 3, "status": "On Leave",
            "assigned_elderly_ids": [], "assigned_elderly_names": []
        })
        cls.cg5_id = str(cg5.inserted_id)

        # Create Elderly Resident in Ernakulam, currently unassigned
        ue = users_collection.insert_one({"email": f"{cls.test_tag}resident@example.com", "full_name": "Resident E", "role": "Elderly", "is_active": True})
        eld = elderly_collection.insert_one({
            "user_id": str(ue.inserted_id), "name": "Resident E", "full_name": "Resident E", "email": f"{cls.test_tag}resident@example.com",
            "district": "Ernakulam", "assigned_caregiver_id": None, "assigned_caregiver_name": "Not Assigned",
            "risk_level": "High", "createdAt": (datetime.now(timezone.utc) - timedelta(hours=30)).isoformat(),
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=30)).isoformat()
        })
        cls.eld_id = str(eld.inserted_id)

    @classmethod
    def tearDownClass(cls):
        users_collection.delete_many({"email": {"$regex": f"^{cls.test_tag}"}})
        caregivers_collection.delete_many({"email": {"$regex": f"^{cls.test_tag}"}})
        elderly_collection.delete_many({"email": {"$regex": f"^{cls.test_tag}"}})
        assignment_history_collection.delete_many({"assigned_by": "test_admin_id"})

    def test_01_suggestion_ranking_order(self):
        """
        Verify rule-based ranking:
        1. Hard rule: At-capacity CG and On Leave CG are NOT in top suggestions.
        2. Adam CG (Ernakulam, 0 assigned) must rank ABOVE Zoe CG (Ernakulam, 2 assigned).
        3. Adam CG (Ernakulam, 0 assigned) must rank ABOVE Bob CG (Thrissur, 0 assigned) due to district match.
        """
        result = get_caregiver_suggestions(elderly_id=self.eld_id, top=3, admin_user=self.admin_user)
        suggestions = result["suggestions"]
        self.assertGreaterEqual(len(suggestions), 1)

        # Top suggestion must be Adam CG: same district (Ernakulam), 0 clients
        top1 = suggestions[0]
        self.assertEqual(top1["id"], self.cg2_id)
        self.assertTrue(top1["same_district"])
        self.assertEqual(top1["assigned_count"], 0)
        self.assertTrue(top1["recommended"])

        # Check that at-capacity CG is NOT in top suggestions, but in others marked at_capacity
        top_ids = [s["id"] for s in suggestions]
        self.assertNotIn(self.cg4_id, top_ids)
        self.assertNotIn(self.cg5_id, top_ids)

        others = result["others"]
        other_ids = [o["id"] for o in others]
        self.assertIn(self.cg4_id, other_ids)
        full_cg = next(o for o in others if o["id"] == self.cg4_id)
        self.assertTrue(full_cg["at_capacity"])

    def test_02_assign_capacity_limit_enforcement(self):
        """
        Attempting to assign a resident to an at-capacity caregiver must raise 409 Conflict.
        """
        with self.assertRaises(HTTPException) as cm:
            AssignmentService.assign(
                elderly_id=self.eld_id,
                caregiver_id=self.cg4_id,
                admin_user=self.admin_user
            )
        self.assertEqual(cm.exception.status_code, 409)

    def test_03_successful_assignment_and_audit(self):
        """
        Assigning resident to eligible caregiver updates authoritative field,
        mirrors to caregiver profile, and creates history record.
        """
        res = AssignmentService.assign(
            elderly_id=self.eld_id,
            caregiver_id=self.cg2_id,
            admin_user=self.admin_user,
            note="Initial allocation"
        )
        self.assertIsNotNone(res)

        # Verify elderly authoritative pointer
        eld = elderly_collection.find_one({"_id": ObjectId(self.eld_id)})
        self.assertIsNotNone(eld.get("assigned_caregiver_id"))

        # Verify caregiver mirror array
        cg = caregivers_collection.find_one({"_id": ObjectId(self.cg2_id)})
        self.assertIn(self.eld_id, cg.get("assigned_elderly_ids", []))

        # Verify audit history
        history = assignment_history_collection.find_one({"elderly_id": self.eld_id, "action": "assign"})
        self.assertIsNotNone(history)
        self.assertEqual(history["to_caregiver_id"], self.cg2_id)
        self.assertEqual(history["assigned_by"], "test_admin_id")

    def test_04_unassign_workflow(self):
        """
        Unassigning resident sets authoritative pointer to None and removes from caregiver mirror.
        """
        unres = AssignmentService.unassign(
            elderly_id=self.eld_id,
            admin_user=self.admin_user,
            note="Discharged from care"
        )
        self.assertIn("successfully unassigned", unres["message"])

        eld = elderly_collection.find_one({"_id": ObjectId(self.eld_id)})
        self.assertIsNone(eld.get("assigned_caregiver_id"))

        cg = caregivers_collection.find_one({"_id": ObjectId(self.cg2_id)})
        self.assertNotIn(self.eld_id, cg.get("assigned_elderly_ids", []))

        # Verify unassign history
        un_history = assignment_history_collection.find_one({"elderly_id": self.eld_id, "action": "unassign"})
        self.assertIsNotNone(un_history)

    def test_05_pending_assignment_queue_overdue(self):
        """
        Resident created >24h ago with no caregiver must be flagged overdue in pending queue.
        """
        unassigned_list = get_unassigned_elderly(admin_user=self.admin_user)
        found = [e for e in unassigned_list if e["id"] == self.eld_id]
        self.assertEqual(len(found), 1)
        self.assertTrue(found[0]["overdue"])
        self.assertGreater(found[0]["hours_waiting"], 24.0)

    def test_06_dashboard_stats_single_aggregation(self):
        """
        Verify get_dashboard_stats returns the expected structure with work-to-do metrics.
        """
        stats = get_dashboard_stats(admin_user=self.admin_user)
        self.assertGreaterEqual(stats.total_users, 5)
        self.assertGreaterEqual(stats.unassigned_clients_count, 1)
        self.assertGreaterEqual(stats.caregivers_at_capacity_count, 1)
        self.assertGreaterEqual(stats.high_risk_today_count, 1)

    def test_07_bulk_user_status_update(self):
        """
        Bulk update deactivates multiple users and cascades to caregiver status.
        """
        cg_user = users_collection.find_one({"email": f"{self.test_tag}adam@example.com"})
        payload = BulkUserStatusUpdate(user_ids=[str(cg_user["_id"])], is_active=False)
        bulk_res = bulk_update_user_status(payload, admin_user=self.admin_user)
        self.assertIn("Successfully updated", bulk_res["message"])

        # Check user is inactive
        u = users_collection.find_one({"_id": cg_user["_id"]})
        self.assertFalse(u.get("is_active"))

        # Check caregiver status cascaded to Inactive
        cg = caregivers_collection.find_one({"user_id": str(cg_user["_id"])})
        self.assertEqual(cg.get("status"), "Inactive")


if __name__ == "__main__":
    unittest.main()
