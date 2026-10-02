import { performance } from 'node:perf_hooks';
import { RankingService } from './ranking.service';
import { demoFixtures, DEMO_WEIGHTS, DEMO_LIMITATION } from '../demo/scenarios';

export function rankingMetrics(grades: number[], idealGrades: number[], k = 3) {
  if (k <= 0 || grades.length === 0) return { precisionAtK: 0, ndcgAtK: 0, reciprocalRank: 0 };
  const dcg = (values: number[]) => values.slice(0, k)
    .reduce((sum, grade, index) => sum + (2 ** grade - 1) / Math.log2(index + 2), 0);
  const ideal = dcg([...idealGrades].sort((a, b) => b - a));
  const firstRelevant = grades.findIndex(grade => grade >= 2);
  return {
    precisionAtK: grades.slice(0, k).filter(grade => grade >= 2).length / Math.min(k, grades.length),
    ndcgAtK: ideal ? dcg(grades) / ideal : 0,
    reciprocalRank: firstRelevant < 0 ? 0 : 1 / (firstRelevant + 1),
  };
}

export function evaluateDemo(repetitions = 50) {
  const roles = demoFixtures.jobs.map((job, jobIndex) => {
    const ranked = demoFixtures.candidates.map(candidate => ({
      id: candidate.id, name: candidate.name, headline: candidate.headline,
      relevance: candidate.relevance[jobIndex],
      scores: RankingService.scoreCandidate(candidate.profile, job.profile, DEMO_WEIGHTS),
    })).sort((a, b) => b.scores.overallScore - a.scores.overallScore || a.id.localeCompare(b.id));
    const grades = ranked.map(candidate => candidate.relevance);
    return { id: job.id, title: job.title, ranked, ...rankingMetrics(grades, grades) };
  });
  // Warm the same production TypeScript scorer, then time complete 36-pair batches.
  const scoreBatch = () => {
    for (const job of demoFixtures.jobs) {
      for (const candidate of demoFixtures.candidates) {
        RankingService.scoreCandidate(candidate.profile, job.profile, DEMO_WEIGHTS);
      }
    }
  };
  for (let i = 0; i < 5; i++) scoreBatch();
  const samples: number[] = [];
  for (let i = 0; i < repetitions; i++) {
    const started = performance.now();
    scoreBatch();
    samples.push(performance.now() - started);
  }
  samples.sort((a, b) => a - b);
  const mean = (key: 'precisionAtK' | 'ndcgAtK' | 'reciprocalRank') =>
    roles.reduce((sum, role) => sum + role[key], 0) / roles.length;
  return {
    version: demoFixtures.version, generatedAt: new Date().toISOString(),
    limitation: DEMO_LIMITATION, labelPolicy: demoFixtures.labelPolicy,
    candidateCount: demoFixtures.candidates.length, jobCount: roles.length,
    pairCount: demoFixtures.candidates.length * roles.length,
    weights: DEMO_WEIGHTS, semanticEmbeddingsUsed: false,
    metrics: { precisionAt3: mean('precisionAtK'), ndcgAt3: mean('ndcgAtK'), meanReciprocalRank: mean('reciprocalRank') },
    timing: { repetitions, warmupBatches: 5, scope: 'TypeScript scorer only, 36 pairs per batch; includes config reads',
      medianBatchMs: samples[Math.floor(samples.length / 2)],
      p95BatchMs: samples[Math.max(0, Math.ceil(samples.length * 0.95) - 1)],
      runtime: process.version, platform: process.platform },
    roles,
  };
}

export type DemoReport = ReturnType<typeof evaluateDemo>;
