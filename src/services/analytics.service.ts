import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/core/errors';
import { RecruiterAnalyticsFilters, RecruiterAnalyticsData } from '@/types/analytics';

const include = { candidate: { select: { id: true, name: true, currentTitle: true, skills: { select: { name: true } } } }, job: { select: { title: true } } } satisfies Prisma.MatchInclude;
type AnalyticsMatch = Prisma.MatchGetPayload<{ include: typeof include }>;
const round = (value: number) => Number(value.toFixed(1));

export function summarizeMatches(matches: AnalyticsMatch[]) {
  const ordered = [...matches].sort((a, b) => b.overallScore - a.overallScore || a.id.localeCompare(b.id));
  const unique = new Map<string, AnalyticsMatch>();
  for (const match of ordered) if (!unique.has(match.candidateId)) unique.set(match.candidateId, match);
  const leaderboard = [...unique.values()].map(m => ({
    id: m.id, candidateId: m.candidateId, name: m.candidate.name, title: m.candidate.currentTitle,
    jobId: m.jobId, jobTitle: m.job.title, score: round(m.overallScore * 100), status: m.recruiterStatus,
    skills: m.candidate.skills.map(s => s.name), missingSkills: m.missingSkills,
    dimensions: { semantic: round(m.semanticSimilarity), skills: round(m.skillMatchScore), experience: round(m.experienceScore), education: round(m.educationScore), domain: round(m.domainScore), career: round(m.careerProgressionScore), availability: round(m.availabilityScore) },
  }));
  const scores = matches.map(m => m.overallScore * 100).sort((a, b) => a - b);
  const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const mid = Math.floor(scores.length / 2);
  const median = !scores.length ? 0 : scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
  const pending = matches.filter(m => m.recruiterStatus === 'PENDING').length;
  const shortlisted = matches.filter(m => m.recruiterStatus === 'SHORTLISTED').length;
  const rejected = matches.filter(m => m.recruiterStatus === 'REJECTED').length;
  const gaps = new Map<string, number>();
  for (const m of matches) for (const skill of new Set(m.missingSkills.map(s => s.trim().toLowerCase()).filter(Boolean))) gaps.set(skill, (gaps.get(skill) || 0) + 1);
  return {
    leaderboard,
    scoreDistribution: Array.from({ length: 5 }, (_, i) => ({ range: i === 4 ? '80–100' : `${i * 20}–<${(i + 1) * 20}`, count: scores.filter(s => s >= i * 20 && (i === 4 ? s <= 100 : s < (i + 1) * 20)).length })),
    hiringFunnel: [{ name: 'Scored matches', count: matches.length }, { name: 'Reviewed', count: matches.length - pending }, { name: 'Shortlisted', count: shortlisted }],
    decisions: { pending, shortlisted, rejected },
    skillGaps: [...gaps].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([skill, count]) => ({ skill, count })),
    statistics: { highestScore: round(scores.at(-1) || 0), lowestScore: round(scores[0] || 0), medianScore: round(median), averageScore: round(average), totalRecommendations: matches.length, selectionRate: matches.length ? round(shortlisted / matches.length * 100) : 0, reviewRate: matches.length ? round((matches.length - pending) / matches.length * 100) : 0 },
  };
}

export async function getRecruiterAnalytics(filters: RecruiterAnalyticsFilters): Promise<RecruiterAnalyticsData> {
  if (!filters.userId) throw new AppError('Unauthorized', 401);
  const scope: Prisma.JobWhereInput = filters.admin ? {} : { userId: filters.userId };
  if (filters.jobId) scope.id = filters.jobId;
  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.startDate) createdAt.gte = new Date(`${filters.startDate}T00:00:00.000Z`);
  if (filters.endDate) createdAt.lt = new Date(new Date(`${filters.endDate}T00:00:00.000Z`).getTime() + 86400000);
  const matchWhere: Prisma.MatchWhereInput = { job: scope, ...(filters.startDate || filters.endDate ? { createdAt } : {}) };
  const [jobs, matches, ownedCandidates] = await Promise.all([
    prisma.job.findMany({ where: scope, select: { id: true, title: true, createdAt: true } }),
    prisma.match.findMany({ where: matchWhere, include, orderBy: { overallScore: 'desc' } }),
    prisma.candidate.count({ where: filters.admin ? {} : { userId: filters.userId } }),
  ]);
  const summary = summarizeMatches(matches);
  const strongHireCount = matches.filter(m => m.overallScore >= .8).length;
  const hireCount = matches.filter(m => m.overallScore >= .6 && m.overallScore < .8).length;
  const considerCount = matches.filter(m => m.overallScore >= .4 && m.overallScore < .6).length;
  const rejectCount = matches.filter(m => m.overallScore < .4).length;
  const recentActivity = matches.map(m => ({ type: 'MATCH_UPDATED', description: `${m.candidate.name} matched to ${m.job.title} · ${round(m.overallScore * 100)}% fit`, timestamp: m.updatedAt.toISOString() })).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  const jobsOverview = jobs.map(j => ({ id: j.id, title: j.title, candidates: matches.filter(m => m.jobId === j.id).length })).sort((a, b) => b.candidates - a.candidates);
  return {
    ...summary,
    kpis: { totalJobs: jobs.length, totalCandidates: summary.leaderboard.length, totalRankedCandidates: summary.leaderboard.length, totalMatches: matches.length, ownedCandidates, averageMatchScore: summary.statistics.averageScore, strongHireCount, hireCount, considerCount, rejectCount },
    recommendationDistribution: [{ name: 'Strong fit ≥80', value: strongHireCount, color: '#10B981' }, { name: 'Fit 60–<80', value: hireCount, color: '#3B82F6' }, { name: 'Review 40–<60', value: considerCount, color: '#F59E0B' }, { name: 'Low fit <40', value: rejectCount, color: '#EF4444' }],
    topCandidates: summary.leaderboard.slice(0, 10).map(c => ({ name: c.name, score: c.score })),
    jobsOverview,
    averageScorePerJob: jobs.map(j => { const subset = matches.filter(m => m.jobId === j.id); return { id: j.id, title: j.title, averageScore: subset.length ? round(subset.reduce((a, m) => a + m.overallScore * 100, 0) / subset.length) : 0 }; }),
    recentActivity,
  };
}
