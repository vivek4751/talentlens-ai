import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ matches: vi.fn(), jobs: vi.fn(), count: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { match: { findMany: mocks.matches }, job: { findMany: mocks.jobs }, candidate: { count: mocks.count } } }));
import { getRecruiterAnalytics, summarizeMatches } from './analytics.service';

type Row = Parameters<typeof summarizeMatches>[0][number];
function row(id: string, candidateId: string, score: number, status = 'PENDING'): Row {
  return { id, candidateId, jobId: 'role', overallScore: score, semanticSimilarity: 72, skillMatchScore: 90, experienceScore: 80, educationScore: 70, domainScore: 60, careerProgressionScore: 50, availabilityScore: 40, recruiterStatus: status, missingSkills: ['Docker', 'docker'], updatedAt: new Date('2026-10-01'), candidate: { id: candidateId, name: candidateId, currentTitle: 'Engineer', skills: [{ name: 'React' }] }, job: { title: 'Engineer' } } as Row;
}
beforeEach(() => { vi.resetAllMocks(); mocks.jobs.mockResolvedValue([]); mocks.matches.mockResolvedValue([]); mocks.count.mockResolvedValue(0); });

describe('recruiter analytics', () => {
  it('counts unique candidates separately from matches and keeps their best fit', () => {
    const result = summarizeMatches([row('a', 'one', .6), row('b', 'one', .8, 'SHORTLISTED'), row('c', 'two', .4, 'REJECTED')]);
    expect(result.leaderboard).toHaveLength(2);
    expect(result.leaderboard[0]).toMatchObject({ candidateId: 'one', score: 80, dimensions: { semantic: 72 } });
    expect(result.statistics).toMatchObject({ medianScore: 60, totalRecommendations: 3, selectionRate: 33.3, reviewRate: 66.7 });
    expect(result.decisions).toEqual({ pending: 1, shortlisted: 1, rejected: 1 });
    expect(result.skillGaps).toEqual([{ skill: 'docker', count: 3 }]);
    expect(result.scoreDistribution.reduce((sum, bin) => sum + bin.count, 0)).toBe(3);
  });
  it('scopes every match to the signed-in recruiter even with a supplied foreign job ID', async () => {
    await getRecruiterAnalytics({ userId: 'owner', jobId: 'foreign', startDate: '2026-10-01', endDate: '2026-10-01' });
    expect(mocks.matches).toHaveBeenCalledWith(expect.objectContaining({ where: { job: { userId: 'owner', id: 'foreign' }, createdAt: { gte: new Date('2026-10-01T00:00:00Z'), lt: new Date('2026-10-02T00:00:00Z') } } }));
    expect(mocks.jobs).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner', id: 'foreign' } }));
    expect(mocks.count).toHaveBeenCalledWith({ where: { userId: 'owner' } });
  });
  it('handles an empty workspace without NaN scores or artificial funnel progress', () => {
    const result = summarizeMatches([]);
    expect(result.statistics).toMatchObject({ averageScore: 0, medianScore: 0, reviewRate: 0, selectionRate: 0 });
    expect(result.hiringFunnel.every(stage => stage.count === 0)).toBe(true);
  });
});
