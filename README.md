# TalentLens AI

TalentLens helps recruiters compare resumes with job descriptions. The Next.js web app extracts PDF text, uses Gemini to structure profiles and generate embeddings, stores them in PostgreSQL with Prisma and pgvector, then ranks candidates with an explainable weighted scoring engine. Recruiters can review score breakdowns, manage shortlists and export results. An Expo Android companion lives in `mobile/`.

## Recruiter demo

Open `/demo` to explore **12 fictional resumes, 3 job descriptions and 36 scored comparisons**. Sign in as a recruiter and click **Add sample data to my workspace**, then open **My rankings**. The import uses account-specific IDs and a transaction; repeated clicks reuse records and preserve recruiter decisions. Demo matching is isolated from normal candidate/job matching.

The public page also works without a database connection or Gemini key. Importing requires a working database and authenticated recruiter account. It seeds structured fictional profiles directly and does not call Gemini. To demonstrate the actual PDF → Gemini → database workflow, upload a sample PDF through the normal resume workflow and create a job through the job form; that flow requires a valid Gemini API key and quota.

- Resume PDFs: `public/demo/resumes/` (12 files).
- Job-description PDFs: `public/demo/jobs/` (3 files).
- Fixed profiles and relevance labels: `src/demo/fixtures.json`.
- Measured results, full scores and methodology: `reports/demo-results.md`, `.json` and `.csv`.

The measured structured-profile demo achieves **88.9% precision@3 and 1.000 NDCG@3** across three roles. These are results on a small, curated synthetic dataset, with semantic scoring disabled and the remaining default weights redistributed proportionally. The labels were authored before scoring; they are not independently reviewed or held out. This does not measure Gemini parsing, semantic embeddings, production latency or real-world hiring accuracy. A candidate fit percentage is a score, not accuracy.

Suggested resume wording:

> Evaluated an explainable recruitment scoring engine on 36 manually labeled synthetic candidate–job pairs, measuring 88.9% precision@3 and 1.000 NDCG@3 across three job roles.

## Run locally

```sh
npm ci
npx prisma generate
npm run dev
```

Configure environment variables outside source control:

- `DATABASE_URL`: PostgreSQL connection string with pgvector available; copy the complete URI from your database provider.
- `AUTH_SECRET` (or the existing `NEXTAUTH_SECRET`): authentication secret.
- `GEMINI_API_KEY`: needed for normal AI uploads and explanations.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: optional Google sign-in.
- `MOBILE_AUTH_SECRET`: optional separate secret for mobile tokens.

Apply the existing Prisma schema/migrations to a development database before using database-backed flows. Never run schema-reset commands against a populated production database. For Supabase, copy the complete pooler URI from the project's Connect panel; a pooler host/project-user mismatch can cause `tenant/user ... not found` during registration.

## Verify and reproduce

```sh
npm test
npx tsc --noEmit
npm run demo:benchmark
npm run build
```

The benchmark runs the application's TypeScript scorer after five warm-up batches and records 200 measured batches of 36 comparisons. Local timing includes scorer configuration reads and excludes AI, database, HTTP, PDF extraction and browser rendering. The generated report is served by `/api/demo`; regenerate it before building if fixtures or scoring rules change.

Regression coverage includes recruiter uploads creating separate profiles, candidate self-profile updates, transactional failure behavior, ownership checks, scoring edge cases, registration errors and text extraction from all 15 demo PDFs.

## Fixes included with the demo

- Recruiter resume uploads create separate candidate records; candidate accounts update their own profile transactionally.
- PDF parsing receives an isolated byte array so pooled Node buffers cannot expose another document's bytes to the old PDF.js parser.
- Ranking and explanation endpoints require recruiter access and job ownership; editing, exporting and updating recruiter decisions enforce ownership too.
- Empty/malformed embeddings, jobs without experience requirements and one-sided skill requirements produce valid scores; invalid ranking weights are rejected.
- Re-ranking refreshes score explanations while preserving recruiter decisions.
- Registration returns useful, sanitized errors for duplicate accounts and unavailable databases, with a support reference for server logs.

No Prisma schema change is required for these fixes or the demo. Existing dependency audit findings should be reviewed separately before claiming a security-complete release.
