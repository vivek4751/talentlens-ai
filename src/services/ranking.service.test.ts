import { describe, expect, it } from 'vitest';
import { RankingService } from './ranking.service';
import { demoFixtures, DEMO_WEIGHTS } from '../demo/scenarios';

const candidate = demoFixtures.candidates[0].profile;
const job = demoFixtures.jobs[0].profile;

describe('ranking regressions', () => {
  it('does not award preferred-skill credit when no preferred skills are specified', () => {
    const scores = RankingService.scoreCandidate({ ...candidate, skills: [] }, { ...job, preferredSkills: [] });
    expect(scores.skillMatchScore).toBe(0);
  });
  it('scores only preferred requirements when required skills are empty', () => {
    const scores = RankingService.scoreCandidate({ ...candidate, skills: [] }, { ...job, requiredSkills: [], preferredSkills: ['Python'] });
    expect(scores.skillMatchScore).toBe(0);
  });
  it('does not impose a five-year minimum on entry-level jobs', () => {
    expect(RankingService.scoreCandidate({ ...candidate, yearsOfExperience: 0 }, { ...job, experienceYears: 0 }).experienceScore).toBe(100);
  });
  it('rejects partial weights that inflate the final total above 1', () => {
    expect(() => RankingService.scoreCandidate(candidate, job, { skills: 1 })).toThrow('sum to 1');
  });
  it.each([{ vector: [1] }, { vector: [NaN, 1] }, { vector: [Infinity, 1] }])('does not return NaN for malformed embedding $vector', ({ vector }) => {
    const scores = RankingService.scoreCandidate({ ...candidate, embedding: vector }, { ...job, embedding: [1, 0] });
    expect(scores.semanticSimilarity).toBe(0);
    expect(Number.isFinite(scores.overallScore)).toBe(true);
  });
  it('recognizes valid semantic vectors', () => {
    expect(RankingService.scoreCandidate({ ...candidate, embedding: [1, 0] }, { ...job, embedding: [1, 0] }).semanticSimilarity).toBe(100);
  });
  it('applies the anomaly penalty to impossible dates', () => {
    const invalid = demoFixtures.candidates.find(person => person.id === 'vikram-jain')!.profile;
    expect(RankingService.scoreCandidate(invalid, job, DEMO_WEIGHTS).overallScore).toBe(0);
  });
});
