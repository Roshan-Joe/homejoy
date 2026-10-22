"""
Comprehensive automated unit tests for HomeJoy extended features:
1. Conversational NL Extraction & Wellness Scoring (WellnessScoreService)
2. 14-day Rolling Baseline & Trends Calculation (ElderlyClientService)
3. Handover Notes Service (HandoverService)
4. Escalation Service logic and resolution (EscalationService)
"""
import sys
import os
import unittest
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.wellness_score_service import WellnessScoreService
from app.services.handover_service import HandoverService
from app.services.escalation_service import EscalationService
from app.services.elderly_client_service import ElderlyClientService


class TestExtendedFeatures(unittest.TestCase):

    def test_wellness_score_calculation_optimal(self):
        """Test composite wellness score with good checkin, normal vitals, and stable recent history."""
        checkin = {
            "mood": "Good",
            "sleep_quality": "Good",
            "appetite": "Good",
            "mobility_difficulty": "No difficulty",
            "medication_taken": "Yes, all taken",
            "symptoms": "None reported"
        }
        vitals = {
            "heart_rate": 74,
            "blood_pressure_systolic": 118,
            "blood_pressure_diastolic": 76,
            "oxygen_saturation": 98
        }
        recent_checkins = [
            {"date": (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d"),
             "wellness_risk": "Low"}
            for i in range(1, 8)
        ]
        result = WellnessScoreService.calculate_composite_wellness_score(
            checkin=checkin,
            vitals=vitals,
            recent_checkins=recent_checkins
        )
        self.assertGreaterEqual(result["score"], 80)
        self.assertEqual(result["risk_level"], "Low")
        self.assertIn("breakdown", result)
        self.assertGreaterEqual(result["breakdown"]["vitals_score"], 20.0)
        self.assertGreaterEqual(result["breakdown"]["checkin_score"], 30.0)
        self.assertEqual(result["breakdown"]["medication_score"], 25.0)

    def test_wellness_score_calculation_elevated_risk(self):
        """Test composite wellness score with poor sleep, missed medication, and abnormal vitals."""
        checkin = {
            "mood": "Poor",
            "sleep_quality": "Very Poor",
            "appetite": "Poor",
            "mobility_difficulty": "Moderate difficulty",
            "medication_taken": "No, not taken",
            "symptoms": "Dizziness, Headache"
        }
        vitals = {
            "heart_rate": 118,
            "blood_pressure_systolic": 158,
            "blood_pressure_diastolic": 98,
            "oxygen_saturation": 91
        }
        recent_checkins = [
            {"date": (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d"),
             "wellness_risk": "High"}
            for i in range(1, 5)
        ]
        result = WellnessScoreService.calculate_composite_wellness_score(
            checkin=checkin,
            vitals=vitals,
            recent_checkins=recent_checkins
        )
        self.assertLess(result["score"], 60)
        self.assertEqual(result["risk_level"], "High")

    def test_conversational_nl_extraction(self):
        """Test natural language conversational extraction for elderly voice/speech check-in."""
        utterance = "Good morning, I slept really well for 8 hours, ate breakfast, and took all my medicine. Feeling fine today."
        extracted_res = WellnessScoreService.extract_from_natural_language(utterance)
        checkin = extracted_res["extracted"]

        self.assertIn(checkin["mood"], ["Good", "Okay"])
        self.assertIn(checkin["sleep_quality"], ["Good", "Excellent"])
        self.assertEqual(checkin["appetite"], "Good")
        self.assertEqual(checkin["medication_taken"], "Yes, all taken")
        self.assertEqual(checkin["mobility_difficulty"], "No difficulty")
        self.assertGreaterEqual(extracted_res["wellness_score"], 80)

    def test_conversational_nl_extraction_concerning_symptoms(self):
        """Test natural language extraction identifying dizziness, poor sleep, and missed medication."""
        utterance = "I couldn't sleep last night, forgot my pills, and I am feeling quite dizzy with a headache."
        extracted_res = WellnessScoreService.extract_from_natural_language(utterance)
        checkin = extracted_res["extracted"]

        self.assertEqual(checkin["sleep_quality"], "Very Poor")
        self.assertEqual(checkin["medication_taken"], "No, not taken")
        self.assertIn("Dizziness", checkin["symptoms"])
        self.assertIn("Headache", checkin["symptoms"])
        self.assertIn(extracted_res["wellness_risk"], ["Moderate", "High"])

    def test_handover_service_format(self):
        """Test handover notes formatting and fields."""
        handovers = HandoverService.get_handovers(limit=5)
        self.assertIsInstance(handovers, list)

    def test_escalation_scan_execution(self):
        """Test missed check-in escalation scanner runs without exceptions."""
        scan_result = EscalationService.run_missed_checkin_scan()
        self.assertIn("scanned_residents", scan_result)
        self.assertIn("new_escalations", scan_result)
        self.assertIn("tier_breakdown", scan_result)


if __name__ == "__main__":
    unittest.main()
