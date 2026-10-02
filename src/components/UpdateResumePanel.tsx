'use client';

import { useState } from 'react';

export default function UpdateResumePanel({ candidateId, rawResumeText, onUpdated }: { candidateId: string; rawResumeText: string; onUpdated: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(rawResumeText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function update(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess(false);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/resume`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rawResumeText: text }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to update the resume.');
      await onUpdated(); setOpen(false); setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update the resume.'); }
    finally { setBusy(false); }
  }

  return <div className="my-6">
    <button className="tl-black-button" onClick={() => { setText(rawResumeText); setOpen(true); setError(''); }}>Update resume</button>
    {success && <p role="status" className="mt-3 text-sm">Resume analyzed, profile updated, and matches refreshed.</p>}
    {open && <section role="dialog" aria-modal="true" aria-label="Update candidate resume" className="tl-modal-layer">
      <div className="tl-modal-backdrop" />
      <article className="tl-modal"><header><h2>Update candidate resume</h2><button aria-label="Close resume editor" disabled={busy} onClick={() => setOpen(false)}>Close</button></header>
        <form className="tl-form" onSubmit={update}>
          <p className="text-sm">Analyze the source text again to refresh the profile, semantic embedding, and job matches. Recruiter decisions are preserved.</p>
          <label>Resume text<textarea required minLength={50} maxLength={100000} rows={12} value={text} onChange={event => setText(event.target.value)} /></label>
          {error && <p role="alert" className="text-sm text-[var(--coral)]">{error}</p>}
          <button className="tl-red-button" disabled={busy} type="submit">{busy ? 'Analyzing resume…' : 'Analyze & update'}</button>
        </form>
      </article>
    </section>}
  </div>;
}
