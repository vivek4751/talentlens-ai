# TalentLens demo evaluation

**Scope: synthetic structured-profile demonstration, not real-world hiring accuracy.**

Synthetic demonstration: 12 fictional resumes, 3 jobs and 36 manually labeled pairs. Uses structured profiles with semantic scoring disabled. Does not measure Gemini parsing, real embeddings, hiring accuracy, network or database latency. Labels are not independently reviewed or held out.

- Dataset: talentlens-demo-v1; 12 fictional candidates, 3 fictional jobs, 36 candidate-job pairs.
- Precision@3: 88.9%. A result is relevant when its fixed label is at least 2.
- NDCG@3: 1.000. Graded gains use (2^grade - 1) / log2(rank + 1).
- Mean reciprocal rank: 1.000.
- Median / P95 for a complete 36-pair scoring batch: 28.51 / 41.54 ms.
- Timing: 5 warm-up batches, 200 measured batches; includes scorer configuration reads; excludes AI, database, HTTP, PDF extraction and browser rendering.
- Environment: v22.19.0, win32, AMD Ryzen 5 5600H with Radeon Graphics         .
- Generated: 2026-10-02T05:17:21.265Z

## Method

Relevance is role-specific: direct implementation experience and required skills matter; juniors, adjacent roles and deliberate data inconsistencies are included. Relevant for precision/MRR means grade >= 2.

The relevance labels are stored with the fixtures and were authored from the scenarios before evaluating the scorer. No weights were tuned against the results. The semantic weight is zero because real embeddings were not measured; the other default weights are divided by 0.8. This dataset is small, curated, and not independently annotated or held out. Multiple pairs reuse each profile, so 36 pairs are not 36 independent observations. No statistical confidence or production-accuracy claim is supported.

## Per-role results

| Role | Precision@3 | NDCG@3 | Top three |
| --- | ---: | ---: | --- |
| Frontend Engineer | 100.0% | 1.000 | Asha Rao, Sana Ali, Dev Shah |
| Machine Learning Engineer | 66.7% | 1.000 | Kabir Das, Leela Nair, Omar Iqbal |
| Backend Engineer | 100.0% | 1.000 | Nisha Patel, Sana Ali, Rohan Mehta |

## Resume-ready wording

> Built a full-stack AI-assisted recruitment platform with PDF resume parsing, role-based workflows, explainable ranking and an Android companion; evaluated its structured scoring engine on 36 manually labeled synthetic candidate-job pairs, measuring 88.9% precision@3 and 1.000 NDCG@3 across three roles.

Keep the words "synthetic" and "structured scoring" when quoting these results. Do not call a fit percentage accuracy. For a stronger future claim, evaluate a frozen engine on a larger independent recruiter-labeled dataset using actual parser outputs and Gemini embeddings.

## Reproduce

Run `npm ci`, `npm test`, then `npm run demo:benchmark`. Inspect `src/demo/fixtures.json`, `src/services/demo-evaluation.ts` and the JSON/CSV report for the inputs, labels, scores and formula.
