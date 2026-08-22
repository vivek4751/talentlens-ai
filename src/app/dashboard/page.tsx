"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Plus, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardAnalytics, DashboardStats } from "@/types/dashboard";
import { DashboardCandidate } from "@/services/candidate-dashboard.service";

function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function statusClass(status: string) { const normalized = status.toLowerCase(); return normalized.includes("short") ? "tl-status-shortlisted" : normalized.includes("reject") ? "tl-status-rejected" : "tl-status-pending"; }

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getJson = async <T,>(url: string): Promise<T> => { const response = await fetch(url); if (!response.ok) throw new Error("Unable to load the recruiter workspace."); return response.json() as Promise<T>; };
    Promise.all([getJson<DashboardStats>("/api/dashboard/stats"), getJson<DashboardCandidate[]>("/api/dashboard/candidates"), getJson<DashboardAnalytics>("/api/dashboard/analytics")])
      .then(([nextStats, nextCandidates, nextAnalytics]) => { setStats(nextStats); setCandidates(nextCandidates); setAnalytics(nextAnalytics); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load the recruiter workspace."));
  }, []);

  const pipeline = analytics?.pipeline ?? [];
  const pipelineMax = Math.max(1, ...pipeline.map((item) => item.candidates));
  const activity = useMemo(() => candidates.slice(0, 4), [candidates]);
  const topScore = candidates[0]?.overallScore ?? 0;

  return <DashboardLayout>
    <section className="tl-page-intro"><div><p className="tl-eyebrow">01 / OVERVIEW</p><h1 className="tl-heading">Recruitment, with a clearer signal.</h1><p className="tl-subheading">A structured view of the work that matters: roles in motion, candidates in consideration, and decisions ready to make.</p></div><Link href="/jobs" className="tl-red-button">Create job <Plus size={16} /></Link></section>
    {error ? <section className="mt-8 border border-[var(--line)] bg-[#fff0ec] p-6"><p className="tl-eyebrow">DATA CONNECTION</p><p className="mt-2 font-semibold">{error}</p><button className="mt-4 tl-black-button" onClick={() => window.location.reload()}>Retry</button></section> : <>
      <section className="tl-metric-grid"><Metric label="ACTIVE JOBS" value={stats?.activeJobs ?? 0} note="Live from database" /><Metric label="TOTAL CANDIDATES" value={stats?.totalCandidates ?? 0} note={`${stats?.recentUploads ?? 0} this week`} /><Metric label="SHORTLISTED" value={stats?.shortlisted ?? 0} note="Recruiter decisions" /><Metric label="TOP SCORE" value={topScore.toFixed(1)} note={candidates[0]?.name || "Awaiting matches"} /></section>
      <section className="tl-data-grid"><article className="tl-panel"><div className="tl-panel-header"><div><p className="tl-micro">LIVE SIGNAL</p><h2 className="tl-panel-title">Candidates to review</h2></div><Link href="/rankings" className="tl-link">Open rankings <ArrowRight className="inline" size={14} /></Link></div><div className="tl-activity">{activity.length ? activity.map((candidate) => <Link href={`/candidates/${candidate.candidateId}`} className="tl-activity-row" key={candidate.matchId}><span className="tl-activity-dot" /><div><p className="tl-activity-name">{candidate.name}</p><p className="tl-activity-detail">{candidate.currentTitle || "Candidate profile"}{candidate.currentCompany ? ` · ${candidate.currentCompany}` : ""}</p></div><span className="tl-score">{candidate.overallScore.toFixed(1)}</span></Link>) : <p className="mt-6 text-sm text-[var(--muted)]">No candidate matches have been generated yet.</p>}</div></article><article className="tl-panel"><div className="tl-panel-header"><div><p className="tl-micro">CANDIDATE PIPELINE</p><h2 className="tl-panel-title">Movement by stage</h2></div><BriefcaseBusiness size={19} /></div><div className="tl-bar-chart">{pipeline.length ? pipeline.map((item, index) => <div key={item.stage} title={`${item.stage}: ${item.candidates}`} className={`tl-bar ${index === pipeline.length - 1 ? "is-last" : ""}`} style={{ height: `${Math.max(10, (item.candidates / pipelineMax) * 100)}%` }} />) : <div className="m-auto text-center text-xs text-[var(--muted)]">Pipeline data will appear once matches are created.</div>}</div><p className="tl-chart-caption">{pipeline.length ? pipeline.map((item) => `${item.stage}: ${item.candidates}`).join(" · ") : "Live pipeline data is connected to the existing analytics route."}</p></article></section>
      <section className="mt-0 overflow-x-auto border-b border-[var(--line)]"><div className="tl-panel-header px-0 py-6"><div><p className="tl-micro">PRIORITY QUEUE</p><h2 className="tl-panel-title">Top ranked candidates</h2></div><Link href="/rankings" className="tl-black-button">Review ranking <ArrowRight size={16} /></Link></div><table className="tl-table"><thead><tr><th>Candidate</th><th>Current role</th><th>Experience</th><th>AI score</th><th>Decision</th></tr></thead><tbody>{candidates.length ? candidates.map((candidate) => <tr key={candidate.matchId}><td><Link className="flex items-center gap-2 font-bold" href={`/candidates/${candidate.candidateId}`}><span className="tl-avatar-inline">{initials(candidate.name)}</span>{candidate.name}</Link></td><td>{candidate.currentTitle || "—"}{candidate.currentCompany ? ` · ${candidate.currentCompany}` : ""}</td><td>{candidate.yearsOfExperience} years</td><td className="font-bold">{candidate.overallScore.toFixed(1)}</td><td><span className={`tl-status ${statusClass(candidate.recruiterStatus)}`}>{candidate.recruiterStatus || "Pending"}</span></td></tr>) : <tr><td colSpan={5} className="py-10 text-center text-[var(--muted)]"><Users className="mx-auto mb-2" size={22} />No ranked candidates yet.</td></tr>}</tbody></table></section>
    </>}
  </DashboardLayout>;
}

function Metric({ label, value, note }: { label: string; value: number | string; note: string }) { return <article className="tl-metric"><p className="tl-micro">{label}</p><p className="tl-metric-value">{typeof value === "number" ? value.toLocaleString() : value}</p><p className="tl-metric-note">{note}</p><i className="tl-metric-rule" /></article>; }
