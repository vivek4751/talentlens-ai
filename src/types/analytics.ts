export interface RecruiterAnalyticsFilters {
  jobId?: string;
  startDate?: string;
  endDate?: string;
}

export interface RecruiterAnalyticsKPIs {
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
  title: string;
  candidates: number;
}

export interface AverageScorePerJobItem {
  title: string;
  averageScore: number;
}

export interface RecentActivityItem {
  type: string;
  description: string;
  timestamp: string; // Date ISO string
}

export interface AdditionalStats {
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  averageScore: number;
  totalRecommendations: number;
  selectionRate: number;
}

export interface RecruiterAnalyticsData {
  kpis: RecruiterAnalyticsKPIs;
  recommendationDistribution: RecommendationDistributionItem[];
  scoreDistribution: ScoreDistributionItem[];
  topCandidates: TopCandidateItem[];
  jobsOverview: JobOverviewItem[];
  averageScorePerJob: AverageScorePerJobItem[];
  recentActivity: RecentActivityItem[];
  statistics: AdditionalStats;
}
