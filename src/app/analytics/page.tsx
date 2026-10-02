'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { RecruiterAnalyticsData } from '@/types/analytics';
import { filterAnalyticsCandidates } from '@/lib/analytics-export';

const AnalyticsRadar = dynamic(() => import('@/components/AnalyticsRadar'), { ssr: false, loading: () => <p className="p-8 text-sm">Loading comparison chart…</p> });
const statusLabel = (status: string) => status === 'SHORTLISTED' ? 'Shortlisted' : status === 'REJECTED' ? 'Rejected' : 'Pending';

export default function AnalyticsPage() {
  const [data, setData] = useState<RecruiterAnalyticsData | null>(null);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [jobId, setJobId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [minimum, setMinimum] = useState(0);
  const [sort, setSort] = useState('score');
  const [selected, setSelected] = useState<string[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/jobs', { signal: controller.signal }).then(async r => { if (!r.ok) throw new Error('Unable to load roles.'); return r.json(); }).then(setJobs).catch(err => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(); if (jobId) params.set('jobId', jobId); if (startDate) params.set('startDate', startDate); if (endDate) params.set('endDate', endDate);
    fetch(`/api/analytics?${params}`, { signal: controller.signal }).then(async r => { const result = await r.json(); if (!r.ok) throw new Error(result.message || 'Unable to load analytics.'); return result as RecruiterAnalyticsData; }).then(result => { setData(result); setError(''); setSelected([]); }).catch(err => { if (err.name !== 'AbortError') setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [jobId, startDate, endDate, refresh]);
  const rows = useMemo(() => filterAnalyticsCandidates(data?.leaderboard || [], { search, status, minimum, sort }), [data, search, status, minimum, sort]);
  const exportParams = new URLSearchParams({ search, status, minimum: String(minimum), sort });
  if (jobId) exportParams.set('jobId', jobId);
  if (startDate) exportParams.set('startDate', startDate);
  if (endDate) exportParams.set('endDate', endDate);
  const compared = rows.filter(c => selected.includes(c.id));
  const compare = (id: string) => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : current.length < 3 ? [...current, id] : current);
  const changeScope = () => { setLoading(true); setError(''); };

  return <DashboardLayout>
    <section className="tl-page-intro"><div><p className="tl-eyebrow">05 / ANALYTICS</p><h1 className="tl-heading">Evidence behind every decision.</h1><p className="tl-subheading">Compare candidates, inspect skill gaps, and track decisions across your hiring pipeline.</p></div><div className="flex flex-wrap gap-3"><button className="tl-black-button" disabled={loading} onClick={() => { changeScope(); setRefresh(v => v + 1); }}><RefreshCw size={15} />Refresh</button><a className="tl-red-button" aria-disabled={!rows.length || loading || !!error} href={rows.length && !loading && !error ? `/api/analytics/export?${exportParams}` : undefined}><Download size={15} />Export CSV</a></div></section>
    <section className="tl-filter-strip" aria-label="Analytics filters">
      <label>Role<select aria-label="Analytics role" value={jobId} onChange={e => { changeScope(); setJobId(e.target.value); }}><option value="">All my roles</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select></label>
      <label>From<input aria-label="From date" type="date" value={startDate} onChange={e => { changeScope(); setStartDate(e.target.value); }} /></label>
      <label>Through<input aria-label="Through date" type="date" value={endDate} onChange={e => { changeScope(); setEndDate(e.target.value); }} /></label>
      <button className="tl-link" onClick={() => { if (jobId || startDate || endDate) changeScope(); setJobId(''); setStartDate(''); setEndDate(''); setSearch(''); setStatus(''); setMinimum(0); }}>Clear filters</button>
    </section>
    <p className="mt-2 text-xs text-[var(--muted)]">Dates filter when matches were first created, through the end of the selected day (UTC). Fit scores describe alignment; they do not measure hiring accuracy.</p>
    {error ? <p role="alert" className="mt-5 border border-[var(--line)] bg-[#fff0ec] p-5 text-sm">{error}</p> : loading || !data ? <p role="status" className="p-10 text-sm">Loading recruiter analytics…</p> : <>
      <section className="tl-metric-grid"><Metric label="ACTIVE ROLES" value={data.kpis.totalJobs} note={`${data.kpis.totalMatches} candidate–job matches`} /><Metric label="RANKED CANDIDATES" value={data.kpis.totalCandidates} note="Unique people in this selection" /><Metric label="AVERAGE FIT" value={`${data.statistics.averageScore}%`} note={`Median ${data.statistics.medianScore}%`} /><Metric label="REVIEWED" value={`${data.statistics.reviewRate}%`} note={`${data.decisions.shortlisted} shortlisted · ${data.decisions.pending} pending`} /></section>
      <section className="tl-data-grid">
        <article className="tl-panel"><p className="tl-micro">HIRING FUNNEL</p><h2 className="tl-panel-title">From scoring to shortlist</h2><div className="mt-6 space-y-4">{data.hiringFunnel.map(stage => <div className="tl-progress-row" key={stage.name}><span>{stage.name}</span><div><i style={{ width: `${data.kpis.totalMatches ? stage.count / data.kpis.totalMatches * 100 : 0}%` }} /></div><b>{stage.count}</b></div>)}</div><p className="tl-chart-caption">Current candidate–job decisions: {data.decisions.pending} pending, {data.decisions.shortlisted} shortlisted, {data.decisions.rejected} rejected. This is a decision snapshot; interview and offer stages are not tracked.</p></article>
        <article className="tl-panel"><p className="tl-micro">SKILL GAPS</p><h2 className="tl-panel-title">Requirements needing attention</h2><div className="mt-6 space-y-3">{data.skillGaps.length ? data.skillGaps.map(g => <div className="flex justify-between gap-4 text-sm" key={g.skill}><span>{g.skill}</span><strong>{g.count} matches</strong></div>) : <p className="text-sm">No missing required skills recorded.</p>}</div><p className="tl-chart-caption">Counts show candidate–job matches missing each requirement.</p></article>
      </section>
      <section className="tl-panel mt-6"><div className="tl-panel-header"><div><p className="tl-micro">CANDIDATE LEADERBOARD</p><h2 className="tl-panel-title">Find and compare the strongest fits</h2></div><span className="text-sm">{rows.length} candidates</span></div>
        <div className="tl-filter-strip"><input className="min-w-0 flex-1" aria-label="Search candidates" placeholder="Search name, role, or skill" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Best-match decision" value={status} onChange={e => setStatus(e.target.value)}><option value="">All decisions</option><option value="PENDING">Pending</option><option value="SHORTLISTED">Shortlisted</option><option value="REJECTED">Rejected</option></select><label>Minimum fit<input aria-label="Minimum fit score" type="number" min={0} max={100} value={minimum} onChange={e => setMinimum(Math.min(100, Math.max(0, Number(e.target.value))))} /></label><select aria-label="Sort candidates" value={sort} onChange={e => setSort(e.target.value)}><option value="score">Highest fit</option><option value="lowest">Lowest fit</option><option value="name">Name A–Z</option></select></div>
        <p className="mb-4 text-xs text-[var(--muted)]">Each person appears once, with their best match in the selected roles. Select up to three for comparison. Choose one role for the fairest comparison.</p>
        <div className="overflow-x-auto"><table className="tl-analytics-table"><thead><tr><th>Compare</th><th>Rank / Candidate</th><th>Best role</th><th>Fit</th><th>Decision</th><th>Missing skills</th></tr></thead><tbody>{rows.map((c, i) => <tr key={c.id}><td><input type="checkbox" aria-label={`Compare ${c.name}`} checked={selected.includes(c.id)} disabled={!selected.includes(c.id) && selected.length >= 3} onChange={() => compare(c.id)} /></td><td><Link href={`/candidates/${c.candidateId}`}>{i + 1}. {c.name}</Link><small>{c.title}</small></td><td>{c.jobTitle}</td><td><strong>{c.score}%</strong></td><td>{statusLabel(c.status)}</td><td>{c.missingSkills.slice(0, 3).join(', ') || 'None recorded'}</td></tr>)}</tbody></table></div>{!rows.length && <p className="p-8 text-sm">No candidates match these filters. Upload a resume or adjust your selection.</p>}
      </section>
      <section className="tl-data-grid"><article className="tl-panel min-w-0"><p className="tl-micro">COMPARATIVE RADAR</p><h2 className="tl-panel-title">Seven dimensions of fit</h2><button className="tl-link mt-3" onClick={() => setSelected([])}>Clear comparison</button><AnalyticsRadar candidates={compared} /></article><article className="tl-panel"><p className="tl-micro">SCORE DISTRIBUTION</p><h2 className="tl-panel-title">Quality across the pool</h2><div className="mt-6 space-y-4">{data.scoreDistribution.map(bin => <div className="tl-progress-row" key={bin.range}><span>{bin.range}</span><div><i style={{ width: `${data.kpis.totalMatches ? bin.count / data.kpis.totalMatches * 100 : 0}%` }} /></div><b>{bin.count}</b></div>)}</div><p className="tl-chart-caption">Distribution includes all candidate–job matches in the role and date filters.</p></article></section>
      <section className="tl-data-grid"><article className="tl-panel"><p className="tl-micro">ROLE HEALTH</p><h2 className="tl-panel-title">Candidate coverage and average fit</h2><div className="mt-5 space-y-4">{data.jobsOverview.map(j => <div key={j.id} className="flex justify-between gap-4 text-sm"><Link href={`/rankings?jobId=${encodeURIComponent(j.id)}`}>{j.title}</Link><strong>{j.candidates} matches · {data.averageScorePerJob.find(item => item.id === j.id)?.averageScore || 0}%</strong></div>)}</div>{!data.jobsOverview.length && <p className="mt-5 text-sm">No roles in this selection.</p>}</article><article className="tl-panel"><p className="tl-micro">RECENT ACTIVITY</p><h2 className="tl-panel-title">Latest scoring updates</h2><div className="mt-5 space-y-4">{data.recentActivity.slice(0, 5).map((a, i) => <div key={`${a.timestamp}-${i}`}><p className="text-sm">{a.description}</p><p className="mt-1 text-xs text-[var(--muted)]">{new Date(a.timestamp).toLocaleString()}</p></div>)}</div>{!data.recentActivity.length && <p className="mt-5 text-sm">No scored activity yet.</p>}</article></section>
    </>}
  </DashboardLayout>;
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <article className="tl-metric"><p className="tl-micro">{label}</p><p className="tl-metric-value">{value}</p><p className="tl-metric-note">{note}</p><i className="tl-metric-rule" /></article>;
}
