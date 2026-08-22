"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, Download, Filter, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { RecruiterAnalyticsData } from "@/types/analytics";

type Job = { id: string; title: string };
const maxValue = (values: number[]) => Math.max(1, ...values);

export default function AnalyticsPage() {
  const [data, setData] = useState<RecruiterAnalyticsData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetch("/api/jobs").then((response) => response.ok ? response.json() as Promise<Job[]> : []).then(setJobs).catch(() => setJobs([])); }, []);
  useEffect(() => { const params = new URLSearchParams(); if (jobId) params.set("jobId", jobId); if (startDate) params.set("startDate", startDate); if (endDate) params.set("endDate", endDate); setLoading(true); fetch(`/api/analytics?${params.toString()}`).then(async (response) => { if (!response.ok) throw new Error("Unable to load analytics."); return response.json() as Promise<RecruiterAnalyticsData>; }).then(setData).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load analytics.")).finally(() => setLoading(false)); }, [jobId, startDate, endDate]);
  const scoreMax = maxValue(data?.scoreDistribution.map((item) => item.count) || []);
  const jobMax = maxValue(data?.jobsOverview.map((item) => item.candidates) || []);
  return <DashboardLayout><section className="tl-page-intro"><div><p className="tl-eyebrow">05 / ANALYTICS</p><h1 className="tl-heading">Patterns worth acting on.</h1><p className="tl-subheading">See where the pipeline is moving, how score quality distributes, and which roles are attracting the right signal.</p></div><button className="tl-black-button" onClick={() => window.print()}>Download snapshot <Download size={16} /></button></section>
    <section className="tl-filter-strip"><Filter size={16} /><select value={jobId} onChange={(event) => setJobId(event.target.value)}><option value="">All jobs</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select><label><CalendarDays size={15} /><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label><CalendarDays size={15} /><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><button className="tl-link" onClick={() => { setJobId(""); setStartDate(""); setEndDate(""); }}>Clear</button></section>
    {error ? <div className="mt-5 border border-[var(--line)] bg-[#fff0ec] p-5 text-sm">{error}</div> : loading || !data ? <div className="p-10 text-center text-sm text-[var(--muted)]">Loading recruiter analytics…</div> : <><section className="tl-metric-grid"><AnalyticsMetric label="ACTIVE JOBS" value={data.kpis.totalJobs} note="Current filter" /><AnalyticsMetric label="CANDIDATES" value={data.kpis.totalCandidates} note={`${data.kpis.totalRankedCandidates} ranked`} /><AnalyticsMetric label="AVERAGE MATCH" value={data.kpis.averageMatchScore.toFixed(1)} note="Live score evidence" /><AnalyticsMetric label="STRONG HIRE" value={data.kpis.strongHireCount} note={`${data.statistics.selectionRate.toFixed(1)}% selection rate`} /></section>
      <section className="tl-data-grid"><article className="tl-panel"><div className="tl-panel-header"><div><p className="tl-micro">SCORE DISTRIBUTION</p><h2 className="tl-panel-title">Candidate quality</h2></div><BarChart3 size={19} /></div><div className="tl-bar-chart mt-6">{data.scoreDistribution.map((item, index) => <div key={item.range} className={`tl-bar ${index === data.scoreDistribution.length - 1 ? "is-last" : ""}`} style={{ height: `${Math.max(10, (item.count / scoreMax) * 100)}%` }} title={`${item.range}: ${item.count}`} />)}</div><p className="tl-chart-caption">{data.scoreDistribution.map((item) => `${item.range}: ${item.count}`).join(" · ")}</p></article><article className="tl-panel"><div className="tl-panel-header"><div><p className="tl-micro">CANDIDATE PIPELINE</p><h2 className="tl-panel-title">Recommendation mix</h2></div><Users size={19} /></div><div className="mt-6 space-y-3">{data.recommendationDistribution.map((item) => <div key={item.name} className="tl-progress-row"><span>{item.name}</span><div><i style={{ width: `${Math.max(4, (item.value / Math.max(1, data.statistics.totalRecommendations)) * 100)}%` }} /></div><b>{item.value}</b></div>)}</div><p className="tl-chart-caption">Recommendation labels are tracked from the existing recruiter analytics endpoint.</p></article></section>
      <section className="tl-data-grid"><article className="tl-panel"><div className="tl-panel-header"><div><p className="tl-micro">TOP-PERFORMING JOBS</p><h2 className="tl-panel-title">Strongest candidate pools</h2></div><BriefcaseBusiness size={19} /></div><div className="mt-5 space-y-0">{data.jobsOverview.map((job, index) => <div className="tl-analytics-row" key={job.title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{job.title}</strong><div><i style={{ width: `${Math.max(8, (job.candidates / jobMax) * 100)}%` }} /></div><b>{job.candidates}</b></div>)}</div></article><article className="tl-panel"><div className="tl-panel-header"><div><p className="tl-micro">RECENT ACTIVITY</p><h2 className="tl-panel-title">Live operating log</h2></div><ArrowRight size={18} /></div><div className="tl-activity">{data.recentActivity.slice(0, 5).map((item) => <div className="tl-activity-row" key={`${item.timestamp}-${item.description}`}><span className="tl-activity-dot" /><div><p className="tl-activity-name">{item.description}</p><p className="tl-activity-detail">{new Date(item.timestamp).toLocaleString()}</p></div></div>)}</div></article></section>
    </>}
  </DashboardLayout>;
}

function AnalyticsMetric({ label, value, note }: { label: string; value: string | number; note: string }) { return <article className="tl-metric"><p className="tl-micro">{label}</p><p className="tl-metric-value">{typeof value === "number" ? value.toLocaleString() : value}</p><p className="tl-metric-note">{note}</p><i className="tl-metric-rule" /></article>; }
