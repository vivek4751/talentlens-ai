"""Benchmarks three ranking strategies on a labeled synthetic pool:

  1. keyword   — naive ATS baseline: count of JD keywords present in the
                 candidate's skill list (what simple resume filters do).
  2. semantic  — embedding cosine similarity only (proxy embeddings: skill
                 presence weighted by months of real usage, normalized).
  3. hybrid    — the real TalentLens engine: all six scorers from scorers.py,
                 weighted per config.json, multiplied by anomaly penalties
                 from anomaly.py.

Reports precision@10 / precision@25, how many keyword-stuffers and fraudulent
profiles each method lets into its top 10, anomaly catch rate, and hybrid
scoring throughput.

All numbers are on synthetic labeled data with proxy embeddings — quote them
that way. Swap in real Gemini embeddings via precompute.py for a stronger claim.

Usage (from scripts/):
    python3 benchmark/generate_dataset.py --n 1000 --seed 42 --out benchmark/pool.jsonl
    python3 benchmark/run_benchmark.py --pool benchmark/pool.jsonl
"""
import argparse
import json
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import scorers
from anomaly import AnomalyDetector
from benchmark.generate_dataset import JD_REQUIRED, JD_PREFERRED, VOCAB

SKILL_INDEX = {s: i for i, s in enumerate(VOCAB)}


# --- Proxy embeddings --------------------------------------------------------

def candidate_embedding(cand):
    """Bag-of-skills vector weighted by real usage (months, capped at 24)."""
    v = np.zeros(len(VOCAB), dtype=np.float32)
    for s in cand.get("skills", []):
        idx = SKILL_INDEX.get(s.get("name", "").lower().strip())
        if idx is not None:
            v[idx] = min(1.0, int(s.get("duration_months", 0)) / 24.0)
    return v


def jd_embedding():
    v = np.zeros(len(VOCAB), dtype=np.float32)
    for s in JD_REQUIRED:
        v[SKILL_INDEX[s]] = 1.0
    for s in JD_PREFERRED:
        v[SKILL_INDEX[s]] = 0.5
    return v


# --- The three ranking strategies -------------------------------------------

def rank_keyword(pool):
    """Naive ATS: score = number of JD keywords present in skill names."""
    keywords = set(JD_REQUIRED + JD_PREFERRED)
    scored = []
    for cand in pool:
        names = {s.get("name", "").lower().strip() for s in cand.get("skills", [])}
        scored.append((len(names & keywords), cand))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [c for _, c in scored]


def rank_semantic(pool, jd_vec):
    sem = scorers.SemanticScorer()
    jd = {"embedding": jd_vec}
    scored = []
    for cand in pool:
        c = dict(cand)
        c["embedding"] = candidate_embedding(cand)
        scored.append((sem.score(c, jd, {}), cand))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [c for _, c in scored]


def rank_hybrid(pool, jd_vec, config):
    registry = {
        "semantic": scorers.SemanticScorer(),
        "skills": scorers.SkillScorer(),
        "experience": scorers.ExperienceScorer(),
        "education": scorers.EducationScorer(),
        "career_progression": scorers.CareerProgressionScorer(),
        "availability": scorers.AvailabilityScorer(),
    }
    weights = config["weights"]
    penalties = config["anomaly_penalties"]
    jd = {
        "embedding": jd_vec,
        "required_skills": JD_REQUIRED,
        "preferred_skills": JD_PREFERRED,
        "prefer_product_company": False,
    }
    scored = []
    anomaly_results = {}
    t0 = time.perf_counter()
    for cand in pool:
        c = dict(cand)
        c["embedding"] = candidate_embedding(cand)
        total = sum(
            registry[name].score(c, jd, config) * w
            for name, w in weights.items()
        )
        anomaly = AnomalyDetector.check_candidate(cand)
        anomaly_results[cand["candidate_id"]] = anomaly["status"]
        total *= penalties.get(anomaly["status"], 1.0)
        scored.append((total, cand))
    elapsed = time.perf_counter() - t0
    scored.sort(key=lambda t: t[0], reverse=True)
    return [c for _, c in scored], anomaly_results, elapsed


# --- Metrics -----------------------------------------------------------------

def precision_at_k(ranked, k):
    top = ranked[:k]
    return sum(c["relevant"] for c in top) / k


def archetypes_in_top_k(ranked, k, archetype):
    return sum(1 for c in ranked[:k] if c["archetype"] == archetype)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pool", default="benchmark/pool.jsonl")
    args = ap.parse_args()

    with open(args.pool, encoding="utf-8") as f:
        pool = [json.loads(line) for line in f]

    config_path = os.path.join(os.path.dirname(__file__), "..", "config.json")
    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)

    jd_vec = jd_embedding()

    ranked_kw = rank_keyword(pool)
    ranked_sem = rank_semantic(pool, jd_vec)
    ranked_hyb, anomaly_results, hybrid_secs = rank_hybrid(pool, jd_vec, config)

    n = len(pool)
    frauds = [c for c in pool if c["archetype"] == "fraudulent"]
    frauds_caught = sum(
        1 for c in frauds if anomaly_results[c["candidate_id"]] in ("HIGH", "MEDIUM")
    )
    stuffers = [c for c in pool if c["archetype"] == "keyword_stuffer"]
    stuffers_flagged = sum(
        1 for c in stuffers if anomaly_results[c["candidate_id"]] in ("HIGH", "MEDIUM")
    )

    print("=" * 68)
    print(f"TalentLens ranking benchmark — {n} synthetic labeled candidates")
    print("(proxy embeddings; see file docstring)")
    print("=" * 68)
    header = f"{'method':<12}{'P@10':>8}{'P@25':>8}{'stuffers in top10':>20}{'frauds in top10':>18}"
    print(header)
    print("-" * len(header))
    for name, ranked in (("keyword", ranked_kw), ("semantic", ranked_sem), ("hybrid", ranked_hyb)):
        print(
            f"{name:<12}"
            f"{precision_at_k(ranked, 10):>8.2f}"
            f"{precision_at_k(ranked, 25):>8.2f}"
            f"{archetypes_in_top_k(ranked, 10, 'keyword_stuffer'):>20}"
            f"{archetypes_in_top_k(ranked, 10, 'fraudulent'):>18}"
        )
    print("-" * len(header))
    print(f"Anomaly detector: {frauds_caught}/{len(frauds)} fraudulent profiles flagged HIGH/MEDIUM")
    print(f"Anomaly detector: {stuffers_flagged}/{len(stuffers)} keyword-stuffers flagged (skill inflation)")
    print(f"Hybrid scoring throughput: {n / hybrid_secs:,.0f} candidates/sec "
          f"({hybrid_secs:.2f}s for {n})")
    print("=" * 68)


if __name__ == "__main__":
    main()
