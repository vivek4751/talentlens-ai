# TalentLens AI

TalentLens helps recruiters compare resumes with job descriptions. The Next.js web app extracts PDF text, uses Gemini to structure profiles and generate embeddings, stores them in PostgreSQL with Prisma and pgvector, then ranks candidates with an explainable weighted scoring engine. Recruiters can review score breakdowns, manage shortlists and export results. An Expo Android companion lives in `mobile/`.

## Recruiter workspace

Use the standard resume import, job creation, rankings and Analytics screens. Resume updates re-run Gemini parsing, embeddings and matching while preserving recruiter decisions. Job description edits refresh parsed requirements, embeddings and rankings. Analytics includes an account-scoped candidate leaderboard, search and decision/score filters, comparison radar charts, a decision funnel, skill-gap counts, role coverage, and CSV export. The funnel reflects pending, reviewed and shortlisted matches; interview and offer stages are not tracked.

## Evaluation fixtures

The repository includes 12 fictional resume PDFs and three job-description PDFs in `public/demo/`, with structured fixtures and relevance labels in `src/demo/fixtures.json`. Upload these through the normal workflows to exercise PDF extraction, Gemini parsing and semantic matching. There is no separate public showcase page or direct seed endpoint.

The offline structured-profile benchmark reports **88.9% precision@3 and 1.000 NDCG@3** over 36 synthetic candidate–job pairs. Semantic scoring is disabled for this offline test, with other weights redistributed. The small curated dataset is not held out or independently reviewed and does not establish production hiring accuracy. Reports and methodology are in `reports/demo-results.*`.

Suggested resume wording:

> Evaluated an explainable recruitment scorer on 36 manually labeled synthetic candidate–job pairs, measuring 88.9% precision@3 and 1.000 NDCG@3 across three roles.

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
- `GEMINI_PARSE_MODEL` / `GEMINI_FALLBACK_MODEL`: optional structured-generation routing; defaults to `gemini-3.6-flash` then `gemini-3.5-flash` for exhausted daily quota or repeated temporary failures. An empty fallback value disables fallback. Authentication, invalid-input and missing-key errors are not retried on another model.
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

The benchmark runs the application's TypeScript scorer after five warm-up batches and records 200 measured batches of 36 comparisons. Local timing includes scorer configuration reads and excludes AI, database, HTTP, PDF extraction and browser rendering. Regenerate the offline report if fixtures or scoring rules change.

Regression coverage includes recruiter uploads creating separate profiles, candidate self-profile updates, transactional failure behavior, ownership checks, scoring edge cases, registration errors and text extraction from all 15 demo PDFs.

## Reliability fixes

- Recruiter resume uploads create separate candidate records; candidate accounts update their own profile transactionally.
- PDF parsing receives an isolated byte array so pooled Node buffers cannot expose another document's bytes to the old PDF.js parser.
- Ranking and explanation endpoints require recruiter access and job ownership; editing, exporting and updating recruiter decisions enforce ownership too.
- Empty/malformed embeddings, jobs without experience requirements and one-sided skill requirements produce valid scores; invalid ranking weights are rejected.
- Re-ranking refreshes score explanations while preserving recruiter decisions. Explicit source date ranges are validated even if AI extraction drops a date; invalid chronology produces a quality warning and the existing HIGH anomaly penalty.
- Registration returns useful, sanitized errors for duplicate accounts and unavailable databases, with a support reference for server logs.

No Prisma schema change is required for these features. Existing dependency audit findings should be reviewed separately before claiming a security-complete release.
