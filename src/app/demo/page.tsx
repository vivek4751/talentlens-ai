'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { DemoReport } from '@/services/demo-evaluation';

export default function DemoPage() {
  const [report, setReport] = useState<DemoReport | null>(null);
  const [roleIndex, setRoleIndex] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/demo', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Could not run the demonstration. Please reload to try again.');
      setReport(await response.json());
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, []);

  async function importDemo() {
    setImporting(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/demo', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 401
        ? 'Please sign in as a recruiter, then return here to add the sample data.' : data.message);
      setMessage(data.message);
    } catch (error) { setError(error instanceof Error ? error.message : 'Import failed.'); }
    finally { setImporting(false); }
  }

  function downloadResults() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'talentlens-demo-results.json';
    link.click(); URL.revokeObjectURL(url);
  }
  const activeRole = report?.roles[roleIndex];
  const percent = (value: number) => (value * 100).toFixed(1) + '%';

  return <main className="mx-auto w-full max-w-6xl px-6 py-10 text-[var(--ink)] sm:px-10">
    <nav className="mb-14 flex flex-wrap items-center justify-between gap-5 border-b border-[var(--line)] pb-6">
      <Link href="/dashboard" className="text-lg font-black tracking-tight">TALENTLENS / DEMO</Link>
      <div className="flex gap-6 text-sm"><Link href="/login">Sign in</Link><Link href="/rankings">My rankings</Link></div>
    </nav>
    <section className="max-w-3xl">
      <p className="tl-eyebrow">12 PROFILES / 3 ROLES / 36 COMPARISONS</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">See the evidence<br />behind the shortlist.</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">Explore fictional resumes across frontend, machine learning and backend roles. Compare their scores, inspect the gaps, and take the sample files into your own workspace.</p>
    </section>
    <div className="my-8 border-l-4 border-[var(--coral)] bg-[var(--surface)] p-5 text-sm leading-relaxed">
      <strong>Synthetic demo, not hiring accuracy.</strong>{' '}Results use structured sample profiles and the application&apos;s scoring rules. Semantic scoring is disabled; the remaining weights are redistributed proportionally. This does not test Gemini parsing or real-world hiring outcomes.
    </div>
    <div className="flex flex-wrap gap-3">
      <button className="tl-red-button" disabled={importing} onClick={importDemo}>{importing ? 'Adding samples...' : 'Add sample data to my workspace'}</button>
      <button className="tl-black-button" disabled={!report} onClick={downloadResults}>Download measured results</button>
    </div>
    <p className="mt-3 text-xs text-[var(--muted)]">Recruiter sign-in is required to import. Adds labeled demo records; repeated imports preserve your decisions and reuse the same records.</p>
    {error && <p role="alert" className="mt-5 border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
    {message && <p role="status" className="mt-5 border border-green-300 bg-green-50 p-4 text-sm text-green-900">{message} <Link className="underline" href="/rankings">Open rankings</Link></p>}
    {!report && !error && <p role="status" className="my-12">Loading the measured evaluation...</p>}
    {report && <>
      <section aria-label="Measured demo metrics" className="my-12 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        <Metric label="PRECISION AT 3" value={percent(report.metrics.precisionAt3)} explanation="Share of the top three with a manually assigned relevance grade of 2 or 3, averaged across three jobs." />
        <Metric label="NDCG AT 3" value={report.metrics.ndcgAt3.toFixed(3)} explanation="How closely the top-three order follows the fixed relevance labels. 1.0 is the ideal order." />
        <Metric label="LOCAL MEDIAN SCORING TIME" value={report.timing.medianBatchMs.toFixed(2) + ' ms'} explanation={'For all 36 comparisons across ' + report.timing.repetitions + ' measured local batches. Excludes AI, network and database work.'} />
      </section>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="tl-micro">EXPLORE THE RANKING</p><h2 className="mt-2 text-2xl font-bold">Same candidates. Different requirements.</h2></div>
          <select aria-label="Choose demo role" className="border border-[var(--line)] bg-transparent p-3 text-sm" value={roleIndex} onChange={event => setRoleIndex(Number(event.target.value))}>{report.roles.map((role, index) => <option value={index} key={role.id}>{role.title}</option>)}</select>
        </div>
        <p className="my-4 text-sm text-[var(--muted)]">Fit scores summarize the selected rules. Relevance grades are scenario labels: 0 unsuitable, 1 partial, 2 relevant, 3 strong.</p>
        <div className="overflow-x-auto"><table className="tl-table"><thead><tr><th>Rank / Candidate</th><th>Fit score</th><th>Skills</th><th>Experience</th><th>Relevance</th></tr></thead>
          <tbody>{activeRole?.ranked.map((candidate, index) => <tr key={candidate.id}><td><a href={'/demo/resumes/' + candidate.id + '.pdf'} className="font-bold underline underline-offset-4">{String(index + 1).padStart(2, '0')} / {candidate.name}</a><p className="mt-1 text-xs text-[var(--muted)]">{candidate.headline}</p></td><td className="font-bold">{percent(candidate.scores.overallScore)}</td><td>{candidate.scores.skillMatchScore.toFixed(0)}/100</td><td>{candidate.scores.experienceScore.toFixed(0)}/100</td><td>{candidate.relevance}/3</td></tr>)}</tbody>
        </table></div>
      </section>
      <section className="my-12 border-y border-[var(--line)] py-8"><p className="tl-micro">SAMPLE JOB DESCRIPTIONS</p><div className="mt-4 flex flex-wrap gap-5">{report.roles.map(role => <a className="font-semibold underline underline-offset-4" key={role.id} href={'/demo/jobs/' + role.id + '.pdf'}>{role.title} PDF</a>)}</div></section>
      <section className="max-w-3xl text-sm leading-relaxed"><h2 className="text-xl font-bold">How to describe these results</h2><p className="mt-4">Evaluated a recruitment scoring engine on 36 manually labeled synthetic candidate-job pairs, measuring {percent(report.metrics.precisionAt3)} precision@3 and {report.metrics.ndcgAt3.toFixed(3)} NDCG@3 across three job roles.</p><p className="mt-4 text-[var(--muted)]">Use the word “synthetic” when quoting these results. The 36 pairs share 12 profiles, so they are not 36 independent people. The labels were authored for this demo and are not an independent validation set. Larger recruiter-reviewed datasets are needed to estimate real-world performance.</p><p className="mt-4 text-xs text-[var(--muted)]">Dataset: {report.version}. Measured: {new Date(report.generatedAt).toLocaleString()}. Runtime: {report.timing.runtime}. P95 batch time: {report.timing.p95BatchMs.toFixed(2)} ms. No Gemini calls are needed for this demo.</p></section>
    </>}
    <footer className="mt-16 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">All names, employers, resumes and vacancies in this demo are fictional.</footer>
  </main>;
}

function Metric({ label, value, explanation }: { label: string; value: string; explanation: string }) {
  return <article className="bg-[var(--surface)] p-7"><p className="tl-micro">{label}</p><p className="my-4 text-4xl font-bold tracking-tight">{value}</p><p className="text-xs leading-relaxed text-[var(--muted)]">{explanation}</p></article>;
}
