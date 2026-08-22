"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Check, ChevronRight, Download, FileSpreadsheet, Sparkles, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

type Job = { id: string; title: string; company: string | null; department: string | null };
type Candidate = { id: string; candidateId: string; name: string; headline: string | null; yearsOfExperience: number; location: string | null; skills?: { name: string }[] };
type Match = { id: string; jobId: string; candidateId: string; overallScore: number; semanticSimilarity: number; skillMatchScore: number; experienceScore: number; educationScore: number; availabilityScore: number; strengths: string[]; weaknesses: string[]; missingSkills: string[]; hiringRecommendation: string; improvementSuggestions: string[]; recruiterStatus: string; candidate: Candidate };

const toPercent = (value: number) => Math.round(value <= 1 ? value * 100 : value);
const labelForStatus = (value: string) => value === "SHORTLISTED" ? "Shortlist" : value === "REJECTED" ? "Reject" : "Pending";
const apiStatus = (label: string) => label === "Shortlist" ? "SHORTLISTED" : label === "Reject" ? "REJECTED" : "PENDING";
const statusClass = (value: string) => value === "SHORTLISTED" ? "tl-status-shortlisted" : value === "REJECTED" ? "tl-status-rejected" : "tl-status-pending";

export default function RankingsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/jobs").then(async (response) => { if (!response.ok) throw new Error("Unable to load jobs."); return response.json() as Promise<Job[]>; }).then((nextJobs) => { setJobs(nextJobs); setSelectedJobId(nextJobs[0]?.id || ""); }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load jobs.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedJobId) { setMatches([]); return; }
    setLoading(true);
    fetch(`/api/matches?jobId=${selectedJobId}`).then(async (response) => { if (!response.ok) throw new Error("Unable to load candidate rankings."); return response.json() as Promise<Match[]>; }).then(setMatches).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load candidate rankings.")).finally(() => setLoading(false));
  }, [selectedJobId]);

  const changeStatus = async (match: Match, label: string) => {
    const recruiterStatus = apiStatus(label);
    setUpdating(match.id);
    try {
      const response = await fetch(`/api/matches/${match.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recruiterStatus }) });
      if (!response.ok) throw new Error("Unable to update recruiter status.");
      setMatches((current) => current.map((item) => item.id === match.id ? { ...item, recruiterStatus } : item));
      setActiveMatch((current) => current?.id === match.id ? { ...current, recruiterStatus } : current);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to update recruiter status."); } finally { setUpdating(null); }
  };

  const exportReport = async () => {
    if (!selectedJobId) return;
    setExporting(true);
    try { const response = await fetch(`/api/jobs/${selectedJobId}/export`); if (!response.ok) throw new Error("Unable to export the ranking report."); const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "talentlens-ranked-candidates.xlsx"; anchor.click(); URL.revokeObjectURL(url); } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to export the ranking report."); } finally { setExporting(false); }
  };

  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  return <DashboardLayout>
    <section className="tl-page-intro"><div><p className="tl-eyebrow">04 / RANKINGS</p><h1 className="tl-heading">The why behind every score.</h1><p className="tl-subheading">A transparent shortlist built from the role requirements, current experience, and candidate evidence—not a black box.</p></div><button type="button" className="tl-red-button" onClick={exportReport} disabled={!selectedJobId || exporting}>{exporting ? "Exporting…" : "Export Excel"} <Download size={16} /></button></section>
    <section className="tl-ranking-toolbar"><div><p className="tl-micro">ACTIVE ROLE</p><select className="tl-role-select" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} aria-label="Select job ranking">{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}{job.company ? ` · ${job.company}` : ""}</option>)}</select></div><p className="tl-ranking-count">{matches.length} candidates analyzed{selectedJob?.department ? ` · ${selectedJob.department}` : ""}</p></section>
    {error && <div className="mt-5 flex items-center gap-3 border border-[var(--line)] bg-[#fff0ec] p-4 text-sm"><AlertTriangle size={18} className="text-[var(--coral)]" />{error}<button onClick={() => setError(null)} className="ml-auto"><X size={17} /></button></div>}
    <section className="tl-ranking-table">{loading ? <div className="p-10 text-center text-sm text-[var(--muted)]">Loading transparent match evidence…</div> : matches.length === 0 ? <div className="p-10 text-center text-sm text-[var(--muted)]">No candidate matches are available for this job yet.</div> : <><div className="tl-ranking-head"><span>Rank / Candidate</span><span>Overall</span><span>Score composition</span><span>Decision</span><span /></div>{matches.map((match, index) => <button className="tl-ranking-row" key={match.id} onClick={() => setActiveMatch(match)}><span className="tl-rank-person"><b>{String(index + 1).padStart(2, "0")}</b><i>{match.candidate.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i><span><strong>{match.candidate.name}</strong><small>{match.candidate.headline || `${match.candidate.yearsOfExperience} years experience`}</small></span></span><span className="tl-overall-score">{toPercent(match.overallScore)}<small>/100</small></span><span className="tl-mini-scores">{[["semantic", match.semanticSimilarity], ["skills", match.skillMatchScore], ["experience", match.experienceScore], ["education", match.educationScore], ["availability", match.availabilityScore]].map(([label, value]) => <span key={String(label)}><i style={{ width: `${toPercent(Number(value))}%` }} /><small>{label}</small></span>)}</span><span className={`tl-status ${statusClass(match.recruiterStatus)}`}>{labelForStatus(match.recruiterStatus)}</span><ChevronRight size={17} /></button>)}</>}</section>
    {activeMatch && <section className="tl-modal-layer" role="dialog" aria-modal="true" aria-label={`Match explanation for ${activeMatch.candidate.name}`}><button className="tl-modal-backdrop" onClick={() => setActiveMatch(null)} aria-label="Close match explanation" /><article className="tl-modal"><header><div><p className="tl-micro">MATCH EXPLANATION</p><h2>{activeMatch.candidate.name}</h2></div><button onClick={() => setActiveMatch(null)} aria-label="Close"><X size={20} /></button></header><div className="tl-modal-body"><div className="tl-explanation-score"><span>{toPercent(activeMatch.overallScore)}</span><div><p className="tl-micro">OVERALL MATCH</p><p>{activeMatch.candidate.headline || "Candidate profile"}</p></div><Link href={`/candidates/${activeMatch.candidateId}`} className="tl-link">Open profile <ArrowRight size={14} /></Link></div><section><p className="tl-micro">AI RECOMMENDATION</p><p className="tl-recommendation">{activeMatch.hiringRecommendation || "Review the candidate evidence and role-specific score breakdown before deciding."}</p></section><section className="tl-modal-columns"><div><p className="tl-micro">STRENGTHS</p>{(activeMatch.strengths || []).length ? activeMatch.strengths.map((item) => <p className="tl-tick" key={item}><Check size={15} />{item}</p>) : <p className="tl-empty-copy">No strengths recorded yet.</p>}</div><div><p className="tl-micro">MISSING SKILLS / RISKS</p>{[...(activeMatch.weaknesses || []), ...(activeMatch.missingSkills || [])].slice(0, 4).map((item) => <p className="tl-risk" key={item}><AlertTriangle size={14} />{item}</p>) || <p className="tl-empty-copy">No gaps recorded yet.</p>}</div></section><section><p className="tl-micro">IMPROVEMENT SUGGESTIONS</p><div className="tl-suggestion"><Sparkles size={17} /><p>{activeMatch.improvementSuggestions?.[0] || "Use the interview to validate the score dimensions that need more evidence."}</p></div></section><section><p className="tl-micro">RECRUITER STATUS</p><div className="tl-status-controls">{["Shortlist", "Reject", "Pending"].map((label) => <button key={label} disabled={updating === activeMatch.id} className={labelForStatus(activeMatch.recruiterStatus) === label ? "is-selected" : ""} onClick={() => changeStatus(activeMatch, label)}>{label}</button>)}</div></section></div></article></section>}
  </DashboardLayout>;
}
