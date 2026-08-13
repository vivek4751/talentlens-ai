"""Unit tests for AnomalyDetector in anomaly.py.

Run from the scripts/ directory:
    python3 -m unittest discover tests -v
"""
import sys
import os
import unittest
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from anomaly import AnomalyDetector


def recent(days_ago):
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")


def clean_candidate():
    """A fully consistent candidate that should produce CLEAN."""
    return {
        "candidate_id": "c-clean",
        "profile": {"years_of_experience": 6.0},
        "career_history": [
            {
                "company": "Stripe",
                "title": "Engineer",
                "start_date": "2019-01-01",
                "end_date": "2022-01-01",
                "duration_months": 36,
            },
            {
                "company": "Razorpay",
                "title": "Senior Engineer",
                "start_date": "2022-02-01",
                "end_date": None,
                "duration_months": 36,
            },
        ],
        "education": [
            {
                "institution": "IIT Bhubaneswar",
                "start_year": 2014,
                "end_year": 2018,
            }
        ],
        "skills": [
            {"name": "python", "proficiency": "expert", "duration_months": 60},
        ],
        "behavioral_signals": {
            "notice_period_days": 30,
            "open_to_work_flag": True,
            "profile_completeness_score": 95.0,
            "last_active_date": recent(10),
            "connection_count": 250,
        },
    }


class TestCleanProfile(unittest.TestCase):
    def test_consistent_profile_is_clean(self):
        result = AnomalyDetector.check_candidate(clean_candidate())
        self.assertEqual(result["status"], "CLEAN")
        self.assertEqual(result["reasons"], [])


class TestHighConfidenceAnomalies(unittest.TestCase):
    def test_job_longer_than_total_experience(self):
        cand = clean_candidate()
        cand["profile"]["years_of_experience"] = 2.0  # 24 months total...
        cand["career_history"][0]["duration_months"] = 120  # ...but one job is 10 years
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "HIGH")

    def test_job_starts_after_it_ends(self):
        cand = clean_candidate()
        cand["career_history"][0]["start_date"] = "2022-01-01"
        cand["career_history"][0]["end_date"] = "2019-01-01"
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "HIGH")

    def test_job_starting_in_the_future(self):
        cand = clean_candidate()
        future = (datetime.now() + timedelta(days=400)).strftime("%Y-%m-%d")
        cand["career_history"][1]["start_date"] = future
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "HIGH")

    def test_education_starts_after_it_ends(self):
        cand = clean_candidate()
        cand["education"][0]["start_year"] = 2020
        cand["education"][0]["end_year"] = 2016
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "HIGH")

    def test_work_predates_education_by_impossible_gap(self):
        cand = clean_candidate()
        cand["career_history"][0]["start_date"] = "2005-01-01"  # working 9y before uni
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "HIGH")


class TestMediumConfidenceAnomalies(unittest.TestCase):
    def test_skill_inflation_expert_with_zero_usage(self):
        cand = clean_candidate()
        cand["skills"] = [
            {"name": f"skill{i}", "proficiency": "expert", "duration_months": 0}
            for i in range(5)
        ]
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "MEDIUM")

    def test_four_inflated_skills_is_not_flagged(self):
        cand = clean_candidate()
        cand["skills"] = [
            {"name": f"skill{i}", "proficiency": "expert", "duration_months": 0}
            for i in range(4)
        ]
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "CLEAN")

    def test_open_to_work_with_long_notice_period(self):
        cand = clean_candidate()
        cand["behavioral_signals"]["notice_period_days"] = 150
        cand["behavioral_signals"]["open_to_work_flag"] = True
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "MEDIUM")

    def test_cumulative_overlapping_experience(self):
        cand = clean_candidate()
        # Stated 6 YOE = 72 months; jobs sum to 72+72=144 > 72+24
        cand["career_history"][0]["duration_months"] = 72
        cand["career_history"][1]["duration_months"] = 72
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "MEDIUM")


class TestLowConfidenceAnomalies(unittest.TestCase):
    def test_incomplete_profile(self):
        cand = clean_candidate()
        cand["behavioral_signals"]["profile_completeness_score"] = 30.0
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "LOW")

    def test_long_inactivity(self):
        cand = clean_candidate()
        cand["behavioral_signals"]["last_active_date"] = recent(300)
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "LOW")

    def test_missing_education(self):
        cand = clean_candidate()
        cand["education"] = []
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "LOW")

    def test_zero_connections(self):
        cand = clean_candidate()
        cand["behavioral_signals"]["connection_count"] = 0
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "LOW")


class TestSeverityPrecedence(unittest.TestCase):
    def test_high_short_circuits_over_medium_and_low(self):
        cand = clean_candidate()
        # HIGH condition
        cand["career_history"][0]["start_date"] = "2022-01-01"
        cand["career_history"][0]["end_date"] = "2019-01-01"
        # plus MEDIUM and LOW conditions
        cand["behavioral_signals"]["notice_period_days"] = 150
        cand["behavioral_signals"]["profile_completeness_score"] = 10.0
        result = AnomalyDetector.check_candidate(cand)
        self.assertEqual(result["status"], "HIGH")


if __name__ == "__main__":
    unittest.main(verbosity=2)
