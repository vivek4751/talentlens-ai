# TalentLens AI — Project Guide & Interview Prep

This guide explains how the system works end-to-end and prepares you to answer interview questions about it confidently.

---

## 1. One-Paragraph Pitch (memorize this)

> "TalentLens AI is a full-stack recruiter platform that ranks job candidates against a job description using a hybrid approach: I combine semantic similarity from vector embeddings with rule-based signals like experience fit, skill overlap, education tier, and availability. Resumes and job descriptions are parsed into structured data with the Gemini API, embedded with text-embedding-004, and stored in PostgreSQL with pgvector so similarity search happens directly in SQL. Every ranking comes with an AI-generated explanation of strengths, weaknesses, and missing skills, plus anomaly detection that flags suspicious profiles."

---

## 2. Architecture Walkthrough

### Layers
- **Presentation (`src/app`, `src/components`)** — Next.js App Router pages, dashboard, charts. No business logic here.
- **API layer (`src/app/api/*`)** — REST-style route handlers. They validate input (Zod), check auth (NextAuth), then delegate to services.
- **Services (`src/services`)** — all business logic:
  - `gemini.service.ts` — wraps the Gemini API: parses resumes/JDs into structured JSON (using Gemini's JSON-schema mode), generates embeddings, generates match explanations. Includes exponential-backoff retry on 429/503 errors.
  - `matching.service.ts` — orchestrates the flow: parse → embed → store → score. Also converts between pgvector string format and number arrays.
  - `ranking.service.ts` — the hybrid scoring engine (weights loaded from `scripts/config.json`).
  - `anomaly.service.ts` — detects impossible timelines, overlapping jobs, inflated experience.
  - `analytics.service.ts`, `dashboard.service.ts` — aggregate stats for charts.
  - `pdf-parser.service.ts` — extracts raw text from uploaded PDFs.
- **Data (`src/lib/prisma.ts`, `prisma/schema.prisma`)** — Prisma ORM over PostgreSQL with the `vector` extension. Embeddings are stored as `Unsupported("vector(768)")` and read/written via raw SQL.

### Data flow: uploading a resume
1. Recruiter/candidate uploads PDF → `/api/candidates/upload`.
2. `pdf-parse` extracts raw text.
3. `GeminiService.parseCandidate()` sends the text with a strict JSON schema → structured profile (work history, skills with durations, education with tiers, projects).
4. `GeminiService` generates a 768-dim embedding of the profile.
5. Prisma saves the profile; a raw SQL query stores the vector.

### Data flow: ranking candidates for a job
1. Job description parsed + embedded the same way.
2. For each candidate, the ranking service computes:
   - **Semantic score** — cosine similarity between job and candidate embeddings (computed in SQL via pgvector, or in JS as fallback).
   - **Skills score** — overlap between candidate skills and required/preferred skills (Jaccard-style).
   - **Experience score** — penalizes under- and over-qualification per year outside the target band.
   - **Education score** — university tier (1–4) plus a CS-major boost.
   - **Availability score** — notice period, last-active date, recruiter response rate.
   - **Anomaly penalty** — HIGH/MEDIUM/LOW multipliers for suspicious profiles.
3. Weighted sum (weights in `scripts/config.json`) → final score → leaderboard.
4. On demand, Gemini generates an explanation report per match.

### The Python scripts (`scripts/`)
An offline batch version of the same pipeline for ranking very large candidate pools (100k+ profiles from JSONL) without the web app: `precompute.py` (embeddings), `scorers.py` (scoring functions), `anomaly.py` (fraud detection), `rank.py` (produces a ranked CSV). Shows the scoring logic is portable and testable outside the UI.

---

## 3. Key Design Decisions (and why — interviewers love these)

**Why pgvector instead of Pinecone/a vector DB?**
Keeping vectors in PostgreSQL avoids syncing two databases, gives transactional consistency (profile + embedding saved together), and cosine similarity can be done in the same SQL query that filters candidates. At this scale (thousands of candidates per recruiter), a dedicated vector DB is unnecessary complexity.

**Why hybrid scoring instead of pure embeddings?**
Embeddings capture semantic similarity but miss hard constraints — a candidate can "sound like" a senior engineer while having 1 year of experience. Rules encode recruiter requirements (experience bands, notice period, education) that embeddings can't guarantee. The blend is also explainable: you can show exactly which component moved the score.

**Why Gemini's structured-output (JSON schema) mode?**
Resume parsing must produce data matching the Prisma schema every time. Free-text LLM output would need fragile regex post-processing; schema-constrained output guarantees parseable JSON.

**Why anomaly detection?**
Real candidate pools contain fraudulent or broken profiles (20 years of experience at age 22, overlapping full-time jobs). Penalizing them prevents them from gaming a naive scorer.

**Why NextAuth v5 with JWT?**
Stateless sessions (no session table lookups per request), easy role-based gating (recruiter vs candidate routes), and credentials provider fits a self-hosted app.

**Why retry with exponential backoff in the Gemini client?**
LLM APIs return 429/503 under load; retrying at 2s/4s/8s makes uploads resilient without user-visible failures.

---

## 4. Likely Interview Questions & Strong Answers

**Q: What was the hardest part?**
A: Making the ranking trustworthy. Pure cosine similarity ranked "impressive-sounding" but unqualified profiles too high. I solved it by layering rule-based scores and anomaly penalties over the semantic score, and tuning the weights against known-good examples.

**Q: How do you store and query embeddings?**
A: PostgreSQL with the pgvector extension; a `vector(768)` column on both Job and Candidate. Prisma doesn't natively support the type, so it's declared `Unsupported("vector(768)")` and read/written with raw SQL (`$queryRaw`), converting between `[0.1,0.2,...]` strings and number arrays.

**Q: How would you scale this to 1M candidates?**
A: Add an IVFFlat or HNSW index on the vector column for approximate nearest-neighbor search, precompute candidate embeddings in a background queue instead of at request time, paginate the leaderboard, and cache analytics aggregates.

**Q: How do you handle LLM output being wrong?**
A: Schema-constrained generation for structure, Zod validation at the API boundary, retries on transient errors, and defaults for missing fields. Explanations are advisory — the numeric score comes from deterministic code, not the LLM.

**Q: What would you improve next?**
A: Add automated tests around the scorers (they're pure functions, easy to unit test), background job queue for parsing (currently synchronous in the request), semantic skill matching (embeddings per-skill instead of string overlap), and an ANN index for scale.

**Q: Walk me through what happens when a recruiter clicks "Rank candidates."**
A: POST to `/api/jobs/[id]/rank` → auth check → load job + candidates with embeddings via Prisma → `RankingService` computes component scores per candidate → weighted aggregate with anomaly penalties → matches upserted to the DB with score breakdowns → leaderboard page fetches `/api/matches` and renders sorted results with radar charts.

---

## 5. Things You Should Do Before Interviews

1. **Run it locally.** Set up Postgres + pgvector, get a free Gemini API key, upload a couple of real resumes and a JD, and watch the pipeline work. Nothing beats having actually used it.
2. **Read these five files line by line** (they contain 80% of the interesting logic):
   - `src/services/ranking.service.ts`
   - `src/services/matching.service.ts`
   - `src/services/gemini.service.ts`
   - `src/services/anomaly.service.ts`
   - `prisma/schema.prisma`
3. **Make at least one real contribution you can talk about** — e.g., add unit tests for the scorers, add a new scoring signal, improve a chart, or fix the synchronous parsing with a queue. "I extended it by X" is a much stronger interview story.
4. **Tweak the weights in `scripts/config.json`** and observe how rankings change — this gives you genuine intuition about the scoring engine.

---

## 6. Suggested Resume Bullets

Adjust to reflect what you actually did:

- Built a full-stack AI candidate-ranking platform (Next.js 15, TypeScript, PostgreSQL + pgvector, Prisma) that ranks applicants against job descriptions using hybrid semantic + rule-based scoring.
- Integrated Google Gemini for schema-constrained resume/JD parsing and 768-dim embeddings, with retry/backoff handling for API resilience.
- Designed an explainable scoring engine combining cosine similarity, skill overlap, experience-band fit, education tiers, and anomaly detection to flag fraudulent profiles.
- Implemented role-based authentication (NextAuth v5, JWT), recruiter analytics dashboards (Recharts), and Excel export of ranked shortlists.

---

## 7. Testing & Benchmarks (your contribution — own this section)

### Unit tests
`scripts/tests/` contains 45 unit tests covering all six scorers and the anomaly detector (severity precedence, edge cases like zero vectors, missing signals, boundary counts). Zero dependencies beyond numpy — uses Python's built-in unittest.

```bash
cd scripts
python3 -m unittest discover tests -v
```

### Ranking benchmark
`scripts/benchmark/` generates a labeled synthetic candidate pool with adversarial archetypes (keyword-stuffers, fabricated profiles that mirror strong candidates, impressive-but-off-role seniors) and compares three ranking strategies:

```bash
cd scripts
python3 benchmark/generate_dataset.py --n 1000 --seed 42 --out benchmark/pool.jsonl
python3 benchmark/run_benchmark.py --pool benchmark/pool.jsonl
```

Measured results (1,000 candidates, seed 42, proxy embeddings):

| Method | Precision@10 | Precision@25 | Stuffers in top 10 | Frauds in top 10 |
|---|---|---|---|---|
| Keyword matching (naive ATS) | 0.00 | 0.00 | 10 | 0 |
| Embeddings only | 0.50 | 0.60 | 0 | 5 |
| **Hybrid (full engine)** | **1.00** | **1.00** | **0** | **0** |

- Anomaly detector caught **100/100 fraudulent profiles** (impossible timelines) and **150/150 keyword-stuffers** (skill-inflation flag).
- Throughput: **~10,700 candidates/sec** for full hybrid scoring — a 100,000-candidate pool scores in ~9 seconds on a single machine (results identical in direction at 100k scale: keyword 0.00, semantic 0.60, hybrid 1.00 P@10).

### The story these numbers tell (use this in interviews)
Each method fails in a characteristic way and the next layer fixes it:
- **Keyword matching scores 0.00** because keyword-stuffers — junior profiles listing every JD term with zero months of usage — occupy the entire top 10. This is exactly how real ATS keyword filters get gamed.
- **Embeddings fix the stuffers** (usage-weighted similarity ignores empty claims) **but admit fabricated profiles**: a fake resume that copies a strong candidate's skills embeds identically to a genuine one. 5 of the top 10 were frauds.
- **The hybrid engine fixes both**: rule-based experience/skill scoring plus deterministic timeline validation (anomaly detection) zeroes out the fabricated profiles that embeddings can't see.

### Honest framing (important)
These numbers come from a **synthetic, labeled dataset with proxy embeddings** (bag-of-skills weighted by usage months — a stand-in for Gemini vectors so the benchmark runs offline and reproducibly). Say exactly that if asked. It measures the engine's ability to resist adversarial profiles, not real-world hiring outcomes. To strengthen the claim, rerun with real `text-embedding-004` vectors via `precompute.py`. Interviewers respect "here's my methodology and its limits" far more than a big unqualified number.

### Resume bullets from these results
- Built a 45-test unit suite and an adversarial benchmark harness for a hybrid candidate-ranking engine; hybrid scoring achieved 1.00 precision@10 vs 0.00 for keyword matching and 0.50 for embeddings-only on a labeled synthetic pool of 1,000 profiles
- Implemented deterministic anomaly detection that flagged 100% of fabricated profiles (impossible timelines, skill inflation) that embedding-only ranking admitted into the top 10
- Achieved ~10,700 candidates/sec scoring throughput — ranks a 100K-profile pool in under 10 seconds single-threaded

---

## 8. Pre-Deploy Checklist (fixed for you, verify before pushing)

The following deploy blockers were found and fixed via static review (no network access to run a live build, so double-check these once you deploy):

1. **Missing `prisma generate` on install** — Vercel runs `npm install` then `next build`; without `postinstall: "prisma generate"` in `package.json`, the Prisma client is stale and the build fails. **Fixed.**
2. **No `.env.example`** — added, listing every env var the app actually reads (`DATABASE_URL`, `GEMINI_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`). **Fixed.**
3. **`.gitignore` blocked `.env.example`** — the `.env*` pattern also matched the example file; added a `!.env.example` exception so teammates/graders can see what to configure. **Fixed.**
4. **No timeout override on slow routes** — `/api/candidates/upload` and `/api/jobs/[id]/evaluate` call Gemini synchronously (parsing + embeddings + explanation generation) and can run longer than Vercel's default 10s function timeout. Added `export const maxDuration = 60` to both. **Note: Vercel's free Hobby plan caps functions at 10s regardless of this setting — if uploads time out in production, either upgrade to Pro or move parsing to a background job/queue.**

### Still your responsibility before/during deploy
- **Enable the `vector` extension in your Postgres provider** before `prisma db push` (`CREATE EXTENSION IF NOT EXISTS vector;` in Neon/Supabase's SQL editor).
- **Set all four env vars in Vercel's dashboard** — `.env.example` is a template, not a source of real values, and it will not be picked up automatically.
- **Set `NEXTAUTH_URL` to your actual deployed URL** once you know it (e.g. `https://talentlens-ai.vercel.app`), or auth redirects can misbehave.
- **Run `npx prisma db push` once locally** against your production `DATABASE_URL` to create tables before the first request hits the app.
- **Test the resume upload flow live** immediately after deploying — it's the code path most likely to hit the timeout issue in point 4.
