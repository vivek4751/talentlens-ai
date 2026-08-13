"""Generates a synthetic, labeled candidate pool for benchmarking the ranking engine.

Each candidate gets a ground-truth `relevant` label (1 = a recruiter would want
this person in the shortlist for the target JD, 0 = they would not), so we can
compute precision@k for different ranking strategies.

Archetypes generated:
  strong             relevant=1  right skills w/ real usage, YOE in band, clean profile
  moderate           relevant=1  most skills, band-adjacent YOE, decent profile
  keyword_stuffer    relevant=0  lists every JD keyword but 0 months usage, junior YOE
  impressive_offrole relevant=0  senior title + high YOE in an unrelated domain
  fraudulent         relevant=0  impossible timelines / overlapping jobs
  junior_partial     relevant=0  genuinely junior, some overlapping skills

Embeddings note:
  This harness uses a deterministic bag-of-skills proxy embedding (skill
  presence weighted by months of real usage) so the full pipeline runs offline
  and reproducibly. To benchmark with real Gemini `text-embedding-004` vectors
  instead, run precompute.py over the generated pool and point run_benchmark.py
  at the resulting .npy/.npz files.

Usage:
    python3 benchmark/generate_dataset.py --n 1000 --seed 42 --out benchmark/pool.jsonl
"""
import argparse
import json
import random
from datetime import datetime, timedelta

# --- Target JD definition (mirrors the structure rank.py expects) -----------

JD_REQUIRED = [
    "python", "embeddings", "vector databases", "semantic search",
    "retrieval", "evaluation frameworks", "ndcg", "mrr",
]
JD_PREFERRED = ["fine-tuning", "lora", "learning-to-rank", "distributed systems"]

OFFROLE_SKILLS = [
    "seo", "content marketing", "salesforce", "recruitment", "graphic design",
    "photoshop", "social media", "copywriting", "hr operations", "excel",
]

VOCAB = sorted(set(JD_REQUIRED + JD_PREFERRED + OFFROLE_SKILLS))

TIER_POOL = ["tier_1", "tier_2", "tier_3", "tier_4"]


def _date(years_ago, jitter_days=0, rng=None):
    d = datetime.now() - timedelta(days=int(years_ago * 365) + (rng.randint(-jitter_days, jitter_days) if jitter_days and rng else 0))
    return d.strftime("%Y-%m-%d")


def _career(rng, yoe, titles, companies, n_jobs=2):
    """Consistent career history summing to ~yoe with no overlaps."""
    jobs = []
    months_left = int(yoe * 12)
    start_years_ago = yoe
    for i in range(n_jobs):
        dur = months_left // (n_jobs - i)
        end_years_ago = start_years_ago - dur / 12.0
        jobs.append({
            "company": rng.choice(companies),
            "title": titles[min(i, len(titles) - 1)],
            "start_date": _date(start_years_ago, rng=rng),
            "end_date": None if i == n_jobs - 1 else _date(max(end_years_ago, 0.1), rng=rng),
            "duration_months": dur,
        })
        months_left -= dur
        start_years_ago = end_years_ago - 0.1
    return jobs


def _signals(rng, good=True):
    if good:
        return {
            "notice_period_days": rng.choice([0, 15, 30, 30, 60]),
            "open_to_work_flag": True,
            "profile_completeness_score": rng.uniform(80, 100),
            "last_active_date": _date(rng.uniform(0.01, 0.08), rng=rng),
            "connection_count": rng.randint(100, 900),
            "recruiter_response_rate": rng.uniform(0.7, 1.0),
        }
    return {
        "notice_period_days": rng.choice([60, 90, 90, 180]),
        "open_to_work_flag": rng.random() < 0.5,
        "profile_completeness_score": rng.uniform(35, 75),
        "last_active_date": _date(rng.uniform(0.3, 1.0), rng=rng),
        "connection_count": rng.randint(0, 120),
        "recruiter_response_rate": rng.uniform(0.0, 0.5),
    }


def _skills(rng, names, min_months=12, max_months=60, proficiency=("advanced", "expert")):
    return [
        {
            "name": n,
            "proficiency": rng.choice(proficiency),
            "duration_months": rng.randint(min_months, max_months),
        }
        for n in names
    ]


def make_strong(rng, i):
    yoe = rng.uniform(5.0, 9.0)
    req = rng.sample(JD_REQUIRED, k=rng.randint(6, len(JD_REQUIRED)))
    pref = rng.sample(JD_PREFERRED, k=rng.randint(1, 3))
    return {
        "candidate_id": f"strong-{i}",
        "archetype": "strong",
        "relevant": 1,
        "profile": {
            "anonymized_name": f"Candidate S{i}",
            "current_title": "Senior ML Engineer",
            "years_of_experience": round(yoe, 1),
        },
        "skills": _skills(rng, req + pref, 18, 72),
        "career_history": _career(
            rng, yoe,
            ["ML Engineer", "Senior ML Engineer"],
            ["Stripe", "Razorpay", "Freshworks", "Zomato", "Meesho"],
        ),
        "education": [{
            "institution": "Top University",
            "tier": rng.choice(["tier_1", "tier_2"]),
            "field_of_study": "Computer Science",
            "start_year": 2010, "end_year": 2014,
        }],
        "behavioral_signals": _signals(rng, good=True),
    }


def make_moderate(rng, i):
    yoe = rng.choice([rng.uniform(4.0, 5.0), rng.uniform(9.0, 10.5)])
    req = rng.sample(JD_REQUIRED, k=rng.randint(4, 6))
    return {
        "candidate_id": f"moderate-{i}",
        "archetype": "moderate",
        "relevant": 1,
        "profile": {
            "anonymized_name": f"Candidate M{i}",
            "current_title": "Software Engineer",
            "years_of_experience": round(yoe, 1),
        },
        "skills": _skills(rng, req, 12, 48),
        "career_history": _career(
            rng, yoe,
            ["Software Engineer", "Software Engineer II"],
            ["Paytm", "Swiggy", "Ola", "Flipkart"],
        ),
        "education": [{
            "institution": "State University",
            "tier": rng.choice(["tier_2", "tier_3"]),
            "field_of_study": "Information Technology",
            "start_year": 2011, "end_year": 2015,
        }],
        "behavioral_signals": _signals(rng, good=rng.random() < 0.7),
    }


def make_keyword_stuffer(rng, i):
    """Junior candidate who pastes the whole JD into their skill list."""
    yoe = rng.uniform(0.5, 2.0)
    return {
        "candidate_id": f"stuffer-{i}",
        "archetype": "keyword_stuffer",
        "relevant": 0,
        "profile": {
            "anonymized_name": f"Candidate K{i}",
            "current_title": "AI Enthusiast",
            "years_of_experience": round(yoe, 1),
        },
        # Every JD keyword, expert level, zero months of actual usage
        "skills": [
            {"name": n, "proficiency": "expert", "duration_months": 0}
            for n in JD_REQUIRED + JD_PREFERRED
        ],
        "career_history": _career(
            rng, yoe, ["Intern"], ["Small Startup"], n_jobs=1
        ),
        "education": [{
            "institution": "Local College",
            "tier": "tier_4",
            "field_of_study": "Computer Science",
            "start_year": 2020, "end_year": 2024,
        }],
        "behavioral_signals": _signals(rng, good=False),
    }


def make_impressive_offrole(rng, i):
    """Looks senior on paper, but in an unrelated domain."""
    yoe = rng.uniform(6.0, 12.0)
    return {
        "candidate_id": f"offrole-{i}",
        "archetype": "impressive_offrole",
        "relevant": 0,
        "profile": {
            "anonymized_name": f"Candidate O{i}",
            "current_title": rng.choice(["Marketing Director", "Head of Talent", "Design Lead"]),
            "years_of_experience": round(yoe, 1),
        },
        # Mostly unrelated skills, plus 1-2 genuine JD-adjacent ones
        # (e.g. a data-savvy marketer who really does use Python) — adds
        # realistic semantic noise so embeddings alone can't cleanly separate.
        "skills": _skills(rng, rng.sample(OFFROLE_SKILLS, k=6), 24, 96)
        + _skills(rng, rng.sample(JD_REQUIRED, k=rng.randint(1, 2)), 12, 48),
        "career_history": _career(
            rng, yoe,
            ["Manager", "Senior Manager", "Director"],
            ["Ogilvy", "Publicis", "Randstad"],
            n_jobs=3,
        ),
        "education": [{
            "institution": "Business School",
            "tier": rng.choice(["tier_1", "tier_2"]),
            "field_of_study": "Marketing",
            "start_year": 2008, "end_year": 2012,
        }],
        "behavioral_signals": _signals(rng, good=True),
    }


def make_fraudulent(rng, i):
    """A fabricated profile that mirrors a strong candidate's skills and title
    exactly — the only tell is an impossible timeline. Skill-based and
    embedding-based rankers cannot distinguish these from genuine strong
    candidates; only timeline validation can."""
    cand = make_strong(rng, i)
    cand["candidate_id"] = f"fraud-{i}"
    cand["archetype"] = "fraudulent"
    cand["relevant"] = 0
    kind = rng.random()
    if kind < 0.4:
        # Claims low total YOE but one job alone exceeds it
        cand["profile"]["years_of_experience"] = round(rng.uniform(2.0, 4.0), 1)
        cand["career_history"][0]["duration_months"] = rng.randint(96, 160)
    elif kind < 0.7:
        # A job that ends before it starts
        cand["career_history"][0]["start_date"] = "2023-06-01"
        cand["career_history"][0]["end_date"] = "2020-01-01"
    else:
        # Employment predating university by an impossible gap
        cand["career_history"][0]["start_date"] = "2002-03-01"
        cand["education"][0]["start_year"] = 2010
    return cand


def make_junior_partial(rng, i):
    yoe = rng.uniform(1.0, 3.0)
    return {
        "candidate_id": f"junior-{i}",
        "archetype": "junior_partial",
        "relevant": 0,
        "profile": {
            "anonymized_name": f"Candidate J{i}",
            "current_title": "Junior Developer",
            "years_of_experience": round(yoe, 1),
        },
        "skills": _skills(rng, rng.sample(JD_REQUIRED, k=3), 6, 24, ("beginner", "intermediate")),
        "career_history": _career(rng, yoe, ["Junior Developer"], ["Agency Co"], n_jobs=1),
        "education": [{
            "institution": "State University",
            "tier": "tier_3",
            "field_of_study": "Computer Science",
            "start_year": 2018, "end_year": 2022,
        }],
        "behavioral_signals": _signals(rng, good=rng.random() < 0.5),
    }


MIX = [
    (make_strong, 0.12),
    (make_moderate, 0.18),
    (make_keyword_stuffer, 0.15),
    (make_impressive_offrole, 0.25),
    (make_fraudulent, 0.10),
    (make_junior_partial, 0.20),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=1000)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="benchmark/pool.jsonl")
    args = ap.parse_args()

    rng = random.Random(args.seed)
    pool = []
    for maker, frac in MIX:
        count = int(args.n * frac)
        for i in range(count):
            pool.append(maker(rng, i))
    rng.shuffle(pool)

    with open(args.out, "w", encoding="utf-8") as f:
        for cand in pool:
            f.write(json.dumps(cand) + "\n")

    from collections import Counter
    dist = Counter(c["archetype"] for c in pool)
    relevant = sum(c["relevant"] for c in pool)
    print(f"Wrote {len(pool)} candidates to {args.out}")
    print(f"Relevant (ground truth shortlist-worthy): {relevant}")
    for k, v in sorted(dist.items()):
        print(f"  {k:20s} {v}")


if __name__ == "__main__":
    main()
