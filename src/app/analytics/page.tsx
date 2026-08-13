"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  BriefcaseBusiness,
  Users,
  Trophy,
  TrendingUp,
  Award,
  AlertTriangle,
  Eye,
  XCircle,
  Calendar,
  Activity,
  UserCheck,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Target
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { RecruiterAnalyticsData } from "@/types/analytics";

interface Job {
  id: string;
  title: string;
}

export default function RecruiterAnalyticsPage() {
  const [data, setData] = useState<RecruiterAnalyticsData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs list
  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const jobsData = await res.json();
        setJobs(jobsData);
      } catch (err: any) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    }
    fetchJobs();
  }, []);

  // Fetch analytics data on filter changes
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedJobId) params.append("jobId", selectedJobId);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/analytics?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to fetch recruiter analytics");
        }
        const analyticsData = await res.json();
        setData(analyticsData);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while loading analytics");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedJobId, startDate, endDate]);

  const handleClearFilters = () => {
    setSelectedJobId("");
    setStartDate("");
    setEndDate("");
  };

  const getRecentActivityIcon = (type: string) => {
    switch (type) {
      case "JOB_CREATED":
        return <BriefcaseBusiness className="text-blue-500 h-5 w-5" />;
      case "RESUME_UPLOADED":
        return <FileText className="text-purple-500 h-5 w-5" />;
      case "AI_RANKING_COMPLETED":
        return <Trophy className="text-yellow-500 h-5 w-5" />;
      case "STATUS_UPDATED":
        return <Activity className="text-green-500 h-5 w-5" />;
      default:
        return <RefreshCw className="text-slate-500 h-5 w-5" />;
    }
  };

  const getRecentActivityColor = (type: string) => {
    switch (type) {
      case "JOB_CREATED":
        return "bg-blue-50 border-blue-100";
      case "RESUME_UPLOADED":
        return "bg-purple-50 border-purple-100";
      case "AI_RANKING_COMPLETED":
        return "bg-yellow-50 border-yellow-100";
      case "STATUS_UPDATED":
        return "bg-green-50 border-green-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Recruiter Analytics</h1>
          <p className="text-slate-500 mt-2">
            Real-time platform insights, match distributions, and pipeline performance metrics.
          </p>
        </div>
        
        {/* Sliders or filter indicator */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2.5 rounded-2xl text-sm font-semibold">
          <Activity size={18} className="animate-pulse" />
          <span>Live Analytics Data</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8 flex flex-col md:flex-row items-end gap-5">
        <div className="w-full md:w-1/3">
          <label htmlFor="job-filter" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Filter by Job Posting
          </label>
          <select
            id="job-filter"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            disabled={loadingJobs}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-blue-500 transition duration-150 cursor-pointer"
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/4">
          <label htmlFor="start-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-blue-500 transition duration-150 cursor-pointer"
            />
          </div>
        </div>

        <div className="w-full md:w-1/4">
          <label htmlFor="end-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-blue-500 transition duration-150 cursor-pointer"
            />
          </div>
        </div>

        {(selectedJobId || startDate || endDate) && (
          <button
            onClick={handleClearFilters}
            className="w-full md:w-auto px-5 py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition duration-150 text-sm cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-8">
          {/* Skeleton KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    <div className="h-8 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 h-[360px] animate-pulse">
              <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
              <div className="h-64 bg-slate-100 rounded-xl"></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 h-[360px] animate-pulse">
              <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
              <div className="h-64 bg-slate-100 rounded-xl"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 shadow-sm max-w-2xl mx-auto my-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Error Loading Analytics</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => setSelectedJobId(selectedJobId)}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition duration-150 shadow-sm"
              >
                Retry Request
              </button>
            </div>
          </div>
        </div>
      ) : !data || data.kpis.totalJobs === 0 && data.kpis.totalCandidates === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <BriefcaseBusiness className="mx-auto text-slate-300 h-16 w-16 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            We couldn't find any job postings or candidates in the selected date range. Try clearing or modifying your filters.
          </p>
          {(selectedJobId || startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-150 shadow-sm text-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Jobs"
              value={data.kpis.totalJobs.toLocaleString()}
              change="Total active postings"
              icon={BriefcaseBusiness}
              color="bg-blue-600 shadow-blue-500/20"
            />
            
            <StatCard
              title="Total Candidates"
              value={data.kpis.totalCandidates.toLocaleString()}
              change="Imported into pipeline"
              icon={Users}
              color="bg-purple-600 shadow-purple-500/20"
            />

            <StatCard
              title="Ranked Candidates"
              value={data.kpis.totalRankedCandidates.toLocaleString()}
              change="Scored by Gemini AI"
              icon={Trophy}
              color="bg-amber-500 shadow-amber-500/20"
            />

            <StatCard
              title="Average Match Score"
              value={`${data.kpis.averageMatchScore.toFixed(1)}%`}
              change="Average fit index"
              icon={TrendingUp}
              color="bg-emerald-500 shadow-emerald-500/20"
            />

            <StatCard
              title="Strong Hire (≥80%)"
              value={data.kpis.strongHireCount.toString()}
              change="Highly recommended fit"
              icon={UserCheck}
              color="bg-teal-600 shadow-teal-500/20"
            />

            <StatCard
              title="Hire (60-79%)"
              value={data.kpis.hireCount.toString()}
              change="Good matching candidates"
              icon={Award}
              color="bg-cyan-600 shadow-cyan-500/20"
            />

            <StatCard
              title="Consider (40-59%)"
              value={data.kpis.considerCount.toString()}
              change="Requires further review"
              icon={Eye}
              color="bg-orange-500 shadow-orange-500/20"
            />

            <StatCard
              title="Reject (<40%)"
              value={data.kpis.rejectCount.toString()}
              change="Below benchmark match"
              icon={XCircle}
              color="bg-red-500 shadow-red-500/20"
            />
          </div>

          {/* Charts Row 1: Recommendation Distribution & Match Score Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Recommendation Distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-[380px]">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Recommendation Distribution</h2>
                <p className="text-xs text-slate-400 mt-1">Breakdown of candidates by hiring recommendation tier.</p>
              </div>

              {data.kpis.totalRankedCandidates === 0 ? (
                <div className="flex-grow flex items-center justify-center text-slate-400 text-sm font-semibold">
                  No ranked candidate data to display
                </div>
              ) : (
                <div className="flex-1 flex flex-col md:flex-row items-center justify-between mt-4">
                  <div className="h-[220px] w-full md:w-3/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.recommendationDistribution.filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.recommendationDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} Candidates`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full md:w-2/5 md:pl-4">
                    {data.recommendationDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-slate-600 font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-800">
                          {item.value} ({data.kpis.totalRankedCandidates > 0 ? ((item.value / data.kpis.totalRankedCandidates) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Match Score Distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-[380px]">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Match Score Distribution</h2>
                <p className="text-xs text-slate-400 mt-1">Histogram demonstrating candidates grouped by AI score ranges.</p>
              </div>

              <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" />
                    <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} Candidates`, "Count"]} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Top 10 Candidates & Jobs Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Candidates */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-[420px]">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Top 10 Candidates</h2>
                <p className="text-xs text-slate-400 mt-1">Leading candidate matches ranked by highest overall matching score.</p>
              </div>

              {data.topCandidates.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-slate-400 text-sm font-semibold">
                  No ranked candidates found
                </div>
              ) : (
                <div className="flex-1 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.topCandidates}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F8FAFC" />
                      <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                      <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} width={100} tickLine={false} />
                      <Tooltip formatter={(value) => [`${value}%`, "Overall Score"]} />
                      <Bar dataKey="score" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Jobs Overview */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-[420px]">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Jobs Overview</h2>
                <p className="text-xs text-slate-400 mt-1">Number of analyzed candidate profiles assigned to each job role.</p>
              </div>

              {data.jobsOverview.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-slate-400 text-sm font-semibold">
                  No jobs available to summarize
                </div>
              ) : (
                <div className="flex-1 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.jobsOverview}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" />
                      <XAxis dataKey="title" stroke="#64748B" fontSize={10} tickLine={false} interval={0} tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 12)}...` : value} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip formatter={(value) => [`${value} Candidates`, "Candidates"]} />
                      <Bar dataKey="candidates" fill="#EC4899" radius={[6, 6, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 3: Average Score Per Job & Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Average Score Per Job */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-[380px] lg:col-span-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Average Score Per Job</h2>
                <p className="text-xs text-slate-400 mt-1">Comparative view of average candidate alignment score across job openings.</p>
              </div>

              {data.averageScorePerJob.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-slate-400 text-sm font-semibold">
                  No scores available
                </div>
              ) : (
                <div className="flex-1 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.averageScorePerJob}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" />
                      <XAxis dataKey="title" stroke="#64748B" fontSize={10} tickLine={false} interval={0} tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 17)}...` : value} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, "Avg Score"]} />
                      <Bar dataKey="averageScore" fill="#06B6D4" radius={[6, 6, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Statistics details */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-[380px]">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Hiring Health Index</h2>
                <p className="text-xs text-slate-400 mt-1">Platform aggregated intelligence index.</p>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-4 mt-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="text-amber-500 h-4.5 w-4.5" />
                    <span className="text-slate-600 text-sm font-medium">Highest AI Score</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{data.statistics.highestScore}%</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <TrendingDown className="text-rose-500 h-4.5 w-4.5" />
                    <span className="text-slate-600 text-sm font-medium">Lowest AI Score</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{data.statistics.lowestScore}%</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <Target className="text-blue-500 h-4.5 w-4.5" />
                    <span className="text-slate-600 text-sm font-medium">Median AI Score</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{data.statistics.medianScore}%</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="text-emerald-500 h-4.5 w-4.5" />
                    <span className="text-slate-600 text-sm font-medium">Average AI Score</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{data.statistics.averageScore}%</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <BriefcaseBusiness className="text-purple-500 h-4.5 w-4.5" />
                    <span className="text-slate-600 text-sm font-medium">Total Recommendations</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{data.statistics.totalRecommendations}</span>
                </div>

                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="text-teal-500 h-4.5 w-4.5" />
                    <span className="text-slate-600 text-sm font-medium">Shortlist Selection Rate</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{data.statistics.selectionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Recruiter Activity Stream</h2>
                <p className="text-xs text-slate-400 mt-1">Audit log of latest actions in job creations, resume parses, and matching events.</p>
              </div>
              <Activity className="text-slate-300 animate-pulse h-6 w-6" />
            </div>

            {data.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">
                No recent actions recorded.
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {data.recentActivity.map((activity, idx) => (
                    <li key={idx}>
                      <div className="relative pb-8">
                        {idx !== data.recentActivity.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full border flex items-center justify-center ${getRecentActivityColor(activity.type)}`}>
                              {getRecentActivityIcon(activity.type)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-slate-700 font-medium">
                                {activity.description}
                              </p>
                            </div>
                            <div className="text-right text-xs whitespace-nowrap text-slate-400 font-semibold">
                              {formatDate(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
