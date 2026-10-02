export interface RecruiterAnalyticsFilters {
  userId: string;
  admin?: boolean;
  jobId?: string;
  startDate?: string;
  endDate?: string;
}

export interface RecruiterAnalyticsKPIs {
  totalMatches: number;
  ownedCandidates: number;
  totalJobs: number;
  totalCandidates: number;
  totalRankedCandidates: number;
  averageMatchScore: number;
  strongHireCount: number;
  hireCount: number;
  considerCount: number;
  rejectCount: number;
}

export interface RecommendationDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface ScoreDistributionItem {
  range: string;
  count: number;
}

export interface TopCandidateItem {
  name: string;
  score: number;
}

export interface JobOverviewItem {
  id: string;
  title: string;
  candidates: number;
}

export interface AverageScorePerJobItem {
  id: string;
  title: string;
  averageScore: number;
}

export interface RecentActivityItem {
  type: string;
  description: string;
  timestamp: string; // Date ISO string
}

export interface AdditionalStats {
  reviewRate: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  averageScore: number;
  totalRecommendations: number;
  selectionRate: number;
}

export interface RecruiterAnalyticsData {
  leaderboard: AnalyticsCandidate[];
  hiringFunnel: { name: string; count: number }[];
  decisions: { pending: number; shortlisted: number; rejected: number };
  skillGaps: { skill: string; count: number }[];
  kpis: RecruiterAnalyticsKPIs;
  recommendationDistribution: RecommendationDistributionItem[];
  scoreDistribution: ScoreDistributionItem[];
  topCandidates: TopCandidateItem[];
  jobsOverview: JobOverviewItem[];
  averageScorePerJob: AverageScorePerJobItem[];
  recentActivity: RecentActivityItem[];
  statistics: AdditionalStats;
}

export interface AnalyticsCandidate {
  id: string;
  candidateId: string;
  name: string;
  title: string | null;
  jobId: string;
  jobTitle: string;
  score: number;
  status: string;
  skills: string[];
  missingSkills: string[];
  dimensions: { semantic: number; skills: number; experience: number; education: number; domain: number; career: number; availability: number };
}
