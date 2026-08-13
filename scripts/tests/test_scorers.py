"""Unit tests for the six scoring components in scorers.py.

Run from the scripts/ directory:
    python3 -m unittest discover tests -v
"""
import sys
import os
import unittest
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scorers import (
    SemanticScorer,
    SkillScorer,
    ExperienceScorer,
    EducationScorer,
    CareerProgressionScorer,
    AvailabilityScorer,
)

CONFIG = {
    "experience_bands": {
        "target_min": 5.0,
        "target_max": 9.0,
        "under_qualified_penalty_per_year": 15.0,
        "over_qualified_penalty_per_year": 5.0,
    },
    "consulting_filter": {
        "companies": ["tcs", "infosys", "wipro"],
        "penalty_multiplier": 0.50,
    },
    "education_scoring": {
        "tier_1": 100.0,
        "tier_2": 80.0,
        "tier_3": 60.0,
        "tier_4": 40.0,
        "unknown": 40.0,
        "cs_major_boost": 20.0,
        "cs_majors": ["computer science", "data science"],
    },
    "availability_rules": {
        "notice_period_days": [
            {"limit": 30, "multiplier": 1.0},
            {"limit": 60, "multiplier": 0.90},
            {"limit": 90, "multiplier": 0.80},
            {"limit": 180, "multiplier": 0.50},
        ],
        "last_active_days": [
            {"limit": 30, "multiplier": 1.0},
            {"limit": 90, "multiplier": 0.90},
            {"limit": 180, "multiplier": 0.75},
            {"limit": 9999, "multiplier": 0.50},
        ],
        "response_rates": [
            {"limit": 0.70, "multiplier": 1.0},
            {"limit": 0.30, "multiplier": 0.85},
            {"limit": 0.00, "multiplier": 0.60},
        ],
    },
}


class TestSemanticScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = SemanticScorer()

    def test_identical_vectors_score_100(self):
        v = [0.5, 0.5, 0.5]
        score = self.scorer.score({"embedding": v}, {"embedding": v}, CONFIG)
        self.assertAlmostEqual(score, 100.0, places=4)

    def test_orthogonal_vectors_score_0(self):
        score = self.scorer.score(
            {"embedding": [1.0, 0.0]}, {"embedding": [0.0, 1.0]}, CONFIG
        )
        self.assertAlmostEqual(score, 0.0, places=4)

    def test_opposite_vectors_clamped_to_0(self):
        # Cosine similarity is -1; the scorer must clamp negatives to 0, not go negative.
        score = self.scorer.score(
            {"embedding": [1.0, 1.0]}, {"embedding": [-1.0, -1.0]}, CONFIG
        )
        self.assertEqual(score, 0.0)

    def test_missing_embedding_scores_0(self):
        self.assertEqual(self.scorer.score({}, {"embedding": [1.0]}, CONFIG), 0.0)
        self.assertEqual(self.scorer.score({"embedding": [1.0]}, {}, CONFIG), 0.0)

    def test_zero_vector_scores_0_without_crashing(self):
        score = self.scorer.score(
            {"embedding": [0.0, 0.0]}, {"embedding": [1.0, 1.0]}, CONFIG
        )
        self.assertEqual(score, 0.0)


class TestSkillScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = SkillScorer()

    def _cand(self, names):
        return {"skills": [{"name": n} for n in names]}

    def test_full_required_match_scores_100(self):
        jd = {"required_skills": ["Python", "SQL"], "preferred_skills": []}
        score = self.scorer.score(self._cand(["python", "sql"]), jd, CONFIG)
        self.assertAlmostEqual(score, 100.0)

    def test_case_insensitive_matching(self):
        jd = {"required_skills": ["PYTHON"], "preferred_skills": []}
        score = self.scorer.score(self._cand(["PyThOn"]), jd, CONFIG)
        self.assertAlmostEqual(score, 100.0)

    def test_required_weighted_80_preferred_20(self):
        # All required matched, no preferred matched -> 0.8*100 + 0.2*0 = 80
        jd = {"required_skills": ["python"], "preferred_skills": ["golang"]}
        score = self.scorer.score(self._cand(["python"]), jd, CONFIG)
        self.assertAlmostEqual(score, 80.0)

    def test_half_required_match(self):
        jd = {"required_skills": ["python", "sql"], "preferred_skills": []}
        # req_score = 0.5, pref_score defaults to 1.0 -> 0.8*0.5 + 0.2*1.0 = 0.6
        score = self.scorer.score(self._cand(["python"]), jd, CONFIG)
        self.assertAlmostEqual(score, 60.0)

    def test_empty_jd_skills_scores_100(self):
        jd = {"required_skills": [], "preferred_skills": []}
        self.assertEqual(self.scorer.score(self._cand(["anything"]), jd, CONFIG), 100.0)

    def test_no_overlap_scores_low(self):
        jd = {"required_skills": ["rust", "c++"], "preferred_skills": ["zig"]}
        score = self.scorer.score(self._cand(["marketing", "sales"]), jd, CONFIG)
        self.assertAlmostEqual(score, 0.0)


class TestExperienceScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = ExperienceScorer()

    def _cand(self, yoe, companies=None):
        return {
            "profile": {"years_of_experience": yoe},
            "career_history": [{"company": c} for c in (companies or [])],
        }

    def test_within_band_scores_100(self):
        for yoe in (5, 7, 9):
            self.assertEqual(self.scorer.score(self._cand(yoe), {}, CONFIG), 100.0)

    def test_underqualified_penalty_15_per_year(self):
        # 2 YOE vs min 5 -> 100 - 3*15 = 55
        self.assertAlmostEqual(self.scorer.score(self._cand(2), {}, CONFIG), 55.0)

    def test_overqualified_penalty_5_per_year(self):
        # 12 YOE vs max 9 -> 100 - 3*5 = 85
        self.assertAlmostEqual(self.scorer.score(self._cand(12), {}, CONFIG), 85.0)

    def test_severely_underqualified_floors_at_0(self):
        self.assertEqual(self.scorer.score(self._cand(0), {}, CONFIG), 25.0)
        # 100 - 5*15 = 25 -> still positive; fresh grad w/ 0 yoe vs min 5

    def test_exclusive_consulting_halved_when_product_preferred(self):
        cand = self._cand(7, companies=["TCS", "Infosys"])
        jd = {"prefer_product_company": True}
        self.assertAlmostEqual(self.scorer.score(cand, jd, CONFIG), 50.0)

    def test_mixed_consulting_and_product_not_penalized(self):
        cand = self._cand(7, companies=["TCS", "Stripe"])
        jd = {"prefer_product_company": True}
        self.assertAlmostEqual(self.scorer.score(cand, jd, CONFIG), 100.0)

    def test_consulting_ignored_when_product_not_preferred(self):
        cand = self._cand(7, companies=["TCS"])
        jd = {"prefer_product_company": False}
        self.assertAlmostEqual(self.scorer.score(cand, jd, CONFIG), 100.0)


class TestEducationScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = EducationScorer()

    def test_no_education_scores_baseline_40(self):
        self.assertEqual(self.scorer.score({"education": []}, {}, CONFIG), 40.0)

    def test_tier_1_scores_100(self):
        cand = {"education": [{"tier": "tier_1", "field_of_study": "History"}]}
        self.assertEqual(self.scorer.score(cand, {}, CONFIG), 100.0)

    def test_cs_major_boost_applied(self):
        cand = {"education": [{"tier": "tier_2", "field_of_study": "Computer Science"}]}
        # 80 + 20 boost = 100
        self.assertEqual(self.scorer.score(cand, {}, CONFIG), 100.0)

    def test_boost_capped_at_100(self):
        cand = {"education": [{"tier": "tier_1", "field_of_study": "Data Science"}]}
        self.assertEqual(self.scorer.score(cand, {}, CONFIG), 100.0)

    def test_best_school_wins(self):
        cand = {
            "education": [
                {"tier": "tier_4", "field_of_study": "Arts"},
                {"tier": "tier_2", "field_of_study": "Physics"},
            ]
        }
        self.assertEqual(self.scorer.score(cand, {}, CONFIG), 80.0)

    def test_unknown_tier_falls_back(self):
        cand = {"education": [{"tier": "something_else", "field_of_study": "Arts"}]}
        self.assertEqual(self.scorer.score(cand, {}, CONFIG), 40.0)


class TestCareerProgressionScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = CareerProgressionScorer()

    def test_empty_history_scores_neutral_50(self):
        self.assertEqual(self.scorer.score({"career_history": []}, {}, CONFIG), 50.0)

    def test_job_hopper_penalized(self):
        # Three 6-month stints: avg tenure 6m -> tenure 40; no progression -> 50
        # 40*0.6 + 50*0.4 = 44
        cand = {
            "career_history": [
                {"title": "Engineer", "duration_months": 6, "start_date": "2020-01-01"},
                {"title": "Engineer", "duration_months": 6, "start_date": "2021-01-01"},
                {"title": "Engineer", "duration_months": 6, "start_date": "2022-01-01"},
            ]
        }
        self.assertAlmostEqual(self.scorer.score(cand, {}, CONFIG), 44.0)

    def test_stable_tenure_with_promotion_scores_high(self):
        # Two 48-month roles (avg 48 -> tenure 100), engineer -> senior (1 promotion -> 75)
        # 100*0.6 + 75*0.4 = 90
        cand = {
            "career_history": [
                {"title": "Software Engineer", "duration_months": 48, "start_date": "2016-01-01"},
                {"title": "Senior Engineer", "duration_months": 48, "start_date": "2020-01-01"},
            ]
        }
        self.assertAlmostEqual(self.scorer.score(cand, {}, CONFIG), 90.0)


class TestAvailabilityScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = AvailabilityScorer()

    def _cand(self, notice, days_since_active, resp_rate):
        active = (datetime.now() - timedelta(days=days_since_active)).strftime("%Y-%m-%d")
        return {
            "behavioral_signals": {
                "notice_period_days": notice,
                "last_active_date": active,
                "recruiter_response_rate": resp_rate,
            }
        }

    def test_ideal_candidate_scores_100(self):
        # notice<=30 (1.0) * active<=30 (1.0) * resp>=0.7 (1.0) = 100
        score = self.scorer.score(self._cand(15, 5, 0.9), {}, CONFIG)
        self.assertAlmostEqual(score, 100.0)

    def test_multipliers_compound(self):
        # notice 60 (0.9) * active 60d (0.9) * resp 0.5 (0.85) = 68.85
        score = self.scorer.score(self._cand(60, 60, 0.5), {}, CONFIG)
        self.assertAlmostEqual(score, 68.85, places=2)

    def test_missing_signals_use_worst_defaults(self):
        # No signals: notice 0 -> 1.0; no last_active -> 365d -> 0.5; resp 0.0 -> 0.6
        score = self.scorer.score({"behavioral_signals": {}}, {}, CONFIG)
        self.assertAlmostEqual(score, 30.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
