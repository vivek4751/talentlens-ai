# TalentLens AI — AI-Powered Candidate Ranking System

TalentLens AI is a candidate semantic-matching and ranking platform for recruiters. Instead of simple keyword matching, it combines LLM-based parsing, vector-embedding similarity, and a rule-based hybrid scoring engine to produce accurate, explainable candidate rankings with skill-gap analysis.

---

## 🚀 Key Features
- **Semantic Job Description Analysis** — extracts required skills, soft skills, seniority, responsibilities, education, and domain context from raw text.
- **Deep Candidate Profiling** — parses PDF/CSV resumes into structured work history, projects, certifications, and skills using the Google Gemini API.
- **Hybrid Ranking Engine** — blends cosine similarity of `text-embedding-004` vectors with rule-based signals (experience bands, seniority tiers, skill overlap, education tiers, availability) into a weighted score.
- **Explainable AI (XAI)** — generates reports explaining *why* each candidate ranks where they do: strengths, weaknesses, missing skills, hiring recommendation, and improvement suggestions.
- **Anomaly Detection** — flags suspicious profiles (impossible timelines, inflated experience, overlapping jobs) and penalizes them in scoring.
- **Recruiter Dashboard & Analytics** — candidate leaderboard, radar-chart comparisons, hiring-funnel analytics, Excel export, and interactive search/filtering.
- **Role-Based Auth** — recruiter and candidate roles via NextAuth v5 (credentials + JWT).

---

## 🛠️ Technology Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts |
| Backend | Next.js API Routes, Prisma ORM, PostgreSQL + `pgvector` |
| AI Engine | Google Gemini API, `text-embedding-004` embeddings, custom hybrid ranker |
| Auth | NextAuth v5 (credentials, JWT sessions, role-based access) |
| Utilities | Zod validation, ExcelJS export, pdf-parse |

---

## 📁 Repository Structure
```
talentlens-ai/
├── docs/                    # Architecture docs and project guide
├── prisma/                  # Prisma schema (PostgreSQL + pgvector)
├── scripts/                 # Offline batch ranking pipeline (Python)
└── src/
    ├── app/                 # Next.js App Router pages and API endpoints
    ├── components/          # Reusable UI (dashboard, charts, tables)
    ├── core/                # Constants, config, error handling
    ├── lib/                 # Singleton clients (Prisma)
    ├── schemas/             # Zod validation schemas
    ├── services/            # Business logic (ranking, matching, parsing, analytics)
    └── types/               # Shared type declarations
```

---

## ⚙️ Installation & Development

### 1. Prerequisites
- Node.js v18+
- PostgreSQL with the `pgvector` extension installed
- Google Gemini API key

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/talentlens_db?schema=public"
GEMINI_API_KEY="your_google_gemini_api_key"
NEXTAUTH_SECRET="your_nextauth_jwt_secret"
```

### 3. Install & Run
```bash
npm install
npx prisma db push
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the recruiter console.

---

## 📊 How Ranking Works (High Level)
1. A job description is parsed by Gemini into structured requirements and embedded into a 768-dim vector.
2. Each candidate resume is parsed into structured data and embedded the same way.
3. The hybrid ranker computes a weighted score: semantic cosine similarity + skill overlap + experience-band fit + education tier + availability signals − anomaly penalties.
4. An explainability layer produces a human-readable justification for every ranking.

---

## 🧪 Testing & Benchmarks
```bash
cd scripts
python3 -m unittest discover tests -v          # 45 unit tests (scorers + anomaly detector)
python3 benchmark/generate_dataset.py --n 1000 --seed 42 --out benchmark/pool.jsonl
python3 benchmark/run_benchmark.py --pool benchmark/pool.jsonl
```
The benchmark compares naive keyword matching, embeddings-only, and the full hybrid engine on a labeled synthetic pool containing adversarial profiles (keyword-stuffers, fabricated timelines). See `docs/PROJECT_GUIDE.md` for measured results.
