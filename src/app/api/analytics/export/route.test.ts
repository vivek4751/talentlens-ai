import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ analytics: vi.fn() }));
vi.mock('../route', () => ({ GET: mocks.analytics }));
import { GET } from './route';
beforeEach(() => vi.resetAllMocks());
it('preserves analytics access failures without exporting private data', async () => {
  mocks.analytics.mockResolvedValue(NextResponse.json({ message: 'Forbidden' }, { status: 403 }));
  expect((await GET(new NextRequest('http://localhost/api/analytics/export'))).status).toBe(403);
});
it('exports the selected rows, safely quotes cells and guards spreadsheet formulas', async () => {
  const candidate = { name: '=UNSAFE("x")', title: 'Engineer', jobTitle: 'Frontend, UI', score: 82, status: 'SHORTLISTED', skills: ['React'], dimensions: { semantic: 72, skills: 80, experience: 100, education: 60, domain: 50, career: 60, availability: 80 }, missingSkills: ['TypeScript'] };
  mocks.analytics.mockResolvedValue(NextResponse.json({ leaderboard: [candidate, { ...candidate, name: 'Other', score: 40, status: 'PENDING' }] }));
  const response = await GET(new NextRequest('http://localhost/api/analytics/export?minimum=80&status=SHORTLISTED'));
  expect(response.headers.get('Content-Disposition')).toContain('attachment');
  const csv = await response.text();
  expect(csv).toContain('"\'=UNSAFE(""x"")"');
  expect(csv).toContain('"Frontend, UI"');
  expect(csv).not.toContain('Other');
  expect(csv.split('\r\n')).toHaveLength(2);
});
