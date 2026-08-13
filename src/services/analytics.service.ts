import { prisma } from "@/lib/prisma";
import { RecruiterAnalyticsFilters, RecruiterAnalyticsData } from "@/types/analytics";

export async function getRecruiterAnalytics(filters: RecruiterAnalyticsFilters = {}): Promise<RecruiterAnalyticsData> {
  const matchWhere: any = {};
  const jobWhere: any = {};
  const candidateWhere: any = {};

  if (filters.jobId) {
    matchWhere.jobId = filters.jobId;
    jobWhere.id = filters.jobId;
    candidateWhere.matches = {
      some: {
        jobId: filters.jobId
      }
    };
  }

  if (filters.startDate || filters.endDate) {
    const dateFilter: any = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.lte = new Date(filters.endDate);
    }
    
    matchWhere.createdAt = dateFilter;
    jobWhere.createdAt = dateFilter;
    candidateWhere.createdAt = dateFilter;
  }

  // Fetch counts, averages, and distributions
  const [
    totalJobs,
    totalCandidates,
    totalRankedCandidates,
    avgScoreRes,
    strongHireCount,
    hireCount,
    considerCount,
    rejectCount,
    range0to20,
    range21to40,
    range41to60,
    range61to80,
    range81to100,
  ] = await Promise.all([
    prisma.job.count({ where: jobWhere }),
    prisma.candidate.count({ where: candidateWhere }),
    prisma.match.count({ where: matchWhere }),
    prisma.match.aggregate({
      where: matchWhere,
      _avg: {
        overallScore: true,
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { gte: 0.8 },
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { gte: 0.6, lt: 0.8 },
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { gte: 0.4, lt: 0.6 },
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { lt: 0.4 },
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { gte: 0.0, lte: 0.20 },
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { gt: 0.20, lte: 0.40 },
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { gt: 0.40, lte: 0.60 },
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { gt: 0.60, lte: 0.80 },
      },
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        overallScore: { gt: 0.80, lte: 1.00 },
      },
    }),
  ]);

  const averageMatchScore = avgScoreRes._avg.overallScore 
    ? Number((avgScoreRes._avg.overallScore * 100).toFixed(1)) 
    : 0;

  // Top 10 Candidates
  const topMatches = await prisma.match.findMany({
    where: matchWhere,
    orderBy: {
      overallScore: "desc",
    },
    take: 10,
    include: {
      candidate: {
        select: {
          name: true,
        },
      },
    },
  });

  const topCandidates = topMatches.map((m) => ({
    name: m.candidate.name,
    score: Number((m.overallScore * 100).toFixed(1)),
  }));

  // Jobs Overview
  const jobsWithCounts = await prisma.job.findMany({
    where: jobWhere,
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          matches: true,
        },
      },
    },
  });

  const jobsOverview = jobsWithCounts.map((j) => ({
    title: j.title,
    candidates: j._count.matches,
  }));

  // Average Score Per Job
  const averageScores = await prisma.match.groupBy({
    by: ["jobId"],
    where: matchWhere,
    _avg: {
      overallScore: true,
    },
  });

  const jobIds = averageScores.map((as) => as.jobId);
  const jobs = await prisma.job.findMany({
    where: {
      id: { in: jobIds },
    },
    select: {
      id: true,
      title: true,
    },
  });

  const jobTitleMap = new Map(jobs.map((j) => [j.id, j.title]));

  const averageScorePerJob = averageScores.map((as) => ({
    title: jobTitleMap.get(as.jobId) || "Unknown Job",
    averageScore: as._avg.overallScore ? Number((as._avg.overallScore * 100).toFixed(1)) : 0,
  }));

  // Recent Activity
  const [recentJobs, recentCandidates, recentMatches, recentStatusUpdates] = await Promise.all([
    prisma.job.findMany({
      where: jobWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        title: true,
        createdAt: true,
      },
    }),
    prisma.candidate.findMany({
      where: candidateWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        name: true,
        createdAt: true,
      },
    }),
    prisma.match.findMany({
      where: matchWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        createdAt: true,
        job: { select: { title: true } },
        candidate: { select: { name: true } },
      },
    }),
    prisma.match.findMany({
      where: {
        ...matchWhere,
        recruiterStatus: { not: "PENDING" },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        updatedAt: true,
        recruiterStatus: true,
        job: { select: { title: true } },
        candidate: { select: { name: true } },
      },
    }),
  ]);

  const jobActivities = recentJobs.map((j) => ({
    type: "JOB_CREATED",
    description: `Job posting "${j.title}" was created`,
    timestamp: j.createdAt.toISOString(),
  }));

  const resumeActivities = recentCandidates.map((c) => ({
    type: "RESUME_UPLOADED",
    description: `Resume uploaded for candidate "${c.name}"`,
    timestamp: c.createdAt.toISOString(),
  }));

  const rankingActivities = recentMatches.map((m) => ({
    type: "AI_RANKING_COMPLETED",
    description: `AI ranking completed for candidate "${m.candidate.name}" on job "${m.job.title}"`,
    timestamp: m.createdAt.toISOString(),
  }));

  const statusActivities = recentStatusUpdates.map((m) => ({
    type: "STATUS_UPDATED",
    description: `Candidate "${m.candidate.name}" status updated to "${m.recruiterStatus.toLowerCase()}" for "${m.job.title}"`,
    timestamp: m.updatedAt.toISOString(),
  }));

  const recentActivity = [
    ...jobActivities,
    ...resumeActivities,
    ...rankingActivities,
    ...statusActivities,
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  // Additional Stats
  const allScores = await prisma.match.findMany({
    where: matchWhere,
    select: { overallScore: true },
  });

  const scores = allScores.map((m) => m.overallScore * 100).sort((a, b) => a - b);
  
  let medianScore = 0;
  if (scores.length > 0) {
    const mid = Math.floor(scores.length / 2);
    medianScore = scores.length % 2 !== 0 
      ? scores[mid] 
      : (scores[mid - 1] + scores[mid]) / 2;
  }

  const highestScore = scores.length > 0 ? scores[scores.length - 1] : 0;
  const lowestScore = scores.length > 0 ? scores[0] : 0;

  const shortlistedCount = await prisma.match.count({
    where: {
      ...matchWhere,
      recruiterStatus: "SHORTLISTED",
    },
  });

  const selectionRate = totalRankedCandidates > 0 
    ? Number(((shortlistedCount / totalRankedCandidates) * 100).toFixed(1)) 
    : 0;

  return {
    kpis: {
      totalJobs,
      totalCandidates,
      totalRankedCandidates,
      averageMatchScore,
      strongHireCount,
      hireCount,
      considerCount,
      rejectCount,
    },
    recommendationDistribution: [
      { name: "Strong Hire", value: strongHireCount, color: "#10B981" },
      { name: "Hire", value: hireCount, color: "#3B82F6" },
      { name: "Consider", value: considerCount, color: "#F59E0B" },
      { name: "Reject", value: rejectCount, color: "#EF4444" },
    ],
    scoreDistribution: [
      { range: "0–20", count: range0to20 },
      { range: "21–40", count: range21to40 },
      { range: "41–60", count: range41to60 },
      { range: "61–80", count: range61to80 },
      { range: "81–100", count: range81to100 },
    ],
    topCandidates,
    jobsOverview,
    averageScorePerJob,
    recentActivity,
    statistics: {
      highestScore: Number(highestScore.toFixed(1)),
      lowestScore: Number(lowestScore.toFixed(1)),
      medianScore: Number(medianScore.toFixed(1)),
      averageScore: Number(averageMatchScore.toFixed(1)),
      totalRecommendations: totalRankedCandidates,
      selectionRate,
    },
  };
}
