import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cpus } from 'node:os';
import { evaluateDemo, rankingMetrics } from './demo-evaluation';

describe('ranking evaluation metrics', () => {
  it('gives ideal ordering NDCG 1 and finds the first relevant result', () => {
    expect(rankingMetrics([3, 2, 0], [0, 3, 2])).toEqual({ ndcgAtK: 1, precisionAtK: 2 / 3, reciprocalRank: 1 });
    const poor = rankingMetrics([0, 1, 3, 2], [3, 2, 1, 0]);
    expect(poor.ndcgAtK).toBeLessThan(1);
    expect(poor.precisionAtK).toBe(1 / 3);
    expect(poor.reciprocalRank).toBe(1 / 3);
  });
  it('handles empty and wholly irrelevant rankings', () => {
    expect(rankingMetrics([], []).ndcgAtK).toBe(0);
    expect(rankingMetrics([0, 0], [0, 0]).reciprocalRank).toBe(0);
  });
  it('evaluates all 36 pairs using the application scorer and records its limitations', () => {
    const report = evaluateDemo(process.env.DEMO_REPORT === '1' ? 200 : 5);
    expect(report.pairCount).toBe(36);
    expect(report.roles).toHaveLength(3);
    expect(report.semanticEmbeddingsUsed).toBe(false);
    expect(report.metrics.ndcgAt3).toBeGreaterThanOrEqual(0);
    expect(report.metrics.ndcgAt3).toBeLessThanOrEqual(1);
    expect(report.roles.flatMap(role => role.ranked).every(row => Number.isFinite(row.scores.overallScore))).toBe(true);
    if (process.env.DEMO_REPORT === '1') {
      const directory = join(process.cwd(), 'reports');
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, 'demo-results.json'), JSON.stringify({ ...report, hardware: cpus()[0]?.model ?? 'unavailable' }, null, 2) + '\n');
      const rows = ['job,candidate,relevance,overall_score,skills_score,experience_score'];
      for (const role of report.roles) for (const row of role.ranked) rows.push([role.id, row.id, row.relevance, row.scores.overallScore, row.scores.skillMatchScore, row.scores.experienceScore].join(','));
      writeFileSync(join(directory, 'demo-results.csv'), rows.join('\n') + '\n');
      const p3 = (report.metrics.precisionAt3 * 100).toFixed(1);
      const ndcg = report.metrics.ndcgAt3.toFixed(3);
      const text = [
        '# TalentLens demo evaluation', '',
        '**Scope: synthetic structured-profile demonstration, not real-world hiring accuracy.**', '',
        report.limitation, '',
        '- Dataset: ' + report.version + '; 12 fictional candidates, 3 fictional jobs, 36 candidate-job pairs.',
        '- Precision@3: ' + p3 + '%. A result is relevant when its fixed label is at least 2.',
        '- NDCG@3: ' + ndcg + '. Graded gains use (2^grade - 1) / log2(rank + 1).',
        '- Mean reciprocal rank: ' + report.metrics.meanReciprocalRank.toFixed(3) + '.',
        '- Median / P95 for a complete 36-pair scoring batch: ' + report.timing.medianBatchMs.toFixed(2) + ' / ' + report.timing.p95BatchMs.toFixed(2) + ' ms.',
        '- Timing: 5 warm-up batches, 200 measured batches; includes scorer configuration reads; excludes AI, database, HTTP, PDF extraction and browser rendering.',
        '- Environment: ' + report.timing.runtime + ', ' + report.timing.platform + ', ' + (cpus()[0]?.model ?? 'unknown CPU') + '.',
        '- Generated: ' + report.generatedAt, '',
        '## Method', '', report.labelPolicy, '',
        'The relevance labels are stored with the fixtures and were authored from the scenarios before evaluating the scorer. No weights were tuned against the results. The semantic weight is zero because real embeddings were not measured; the other default weights are divided by 0.8. This dataset is small, curated, and not independently annotated or held out. Multiple pairs reuse each profile, so 36 pairs are not 36 independent observations. No statistical confidence or production-accuracy claim is supported.', '',
        '## Per-role results', '', '| Role | Precision@3 | NDCG@3 | Top three |', '| --- | ---: | ---: | --- |',
        ...report.roles.map(role => '| ' + role.title + ' | ' + (role.precisionAtK * 100).toFixed(1) + '% | ' + role.ndcgAtK.toFixed(3) + ' | ' + role.ranked.slice(0, 3).map(row => row.name).join(', ') + ' |'), '',
        '## Resume-ready wording', '',
        '> Built a full-stack AI-assisted recruitment platform with PDF resume parsing, role-based workflows, explainable ranking and an Android companion; evaluated its structured scoring engine on 36 manually labeled synthetic candidate-job pairs, measuring ' + p3 + '% precision@3 and ' + ndcg + ' NDCG@3 across three roles.', '',
        'Keep the words "synthetic" and "structured scoring" when quoting these results. Do not call a fit percentage accuracy. For a stronger future claim, evaluate a frozen engine on a larger independent recruiter-labeled dataset using actual parser outputs and Gemini embeddings.', '',
        '## Reproduce', '', 'Run `npm ci`, `npm test`, then `npm run demo:benchmark`. Inspect `src/demo/fixtures.json`, `src/services/demo-evaluation.ts` and the JSON/CSV report for the inputs, labels, scores and formula.', '',
      ].join('\n');
      writeFileSync(join(directory, 'demo-results.md'), text);
      console.log(JSON.stringify({ metrics: report.metrics, timing: report.timing, reports: directory }));
    }
  }, 30000);
});
