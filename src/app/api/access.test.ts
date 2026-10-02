import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), job: vi.fn(), match: vi.fn(), rank: vi.fn(), explain: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { job: { findUnique: mocks.job }, match: { findUnique: mocks.match } } }));
vi.mock('@/services/matching.service', () => ({ MatchingService: { runJobMatching: mocks.rank } }));
vi.mock('@/services/gemini.service', () => ({ GeminiService: { generateMatchExplanation: mocks.explain } }));
import { POST as rank } from './jobs/[id]/rank/route';
import { POST as explain } from './matches/[id]/explain/route';

beforeEach(() => { vi.resetAllMocks(); });
const request = () => new NextRequest('http://localhost/api/test', { method: 'POST' });
const params = { params: Promise.resolve({ id: 'target' }) };

describe('ranking and explanation access', () => {
  for (const [name, handler] of [['rank', rank], ['explain', explain]] as const) {
    it(name + ' rejects anonymous requests before reading records', async () => {
      mocks.auth.mockResolvedValue(null);
      expect((await handler(request(), params)).status).toBe(401);
      expect(mocks.job).not.toHaveBeenCalled(); expect(mocks.match).not.toHaveBeenCalled();
    });
    it(name + ' rejects candidates', async () => {
      mocks.auth.mockResolvedValue({ user: { id: 'candidate', role: 'candidate' } });
      expect((await handler(request(), params)).status).toBe(403);
    });
    it(name + ' rejects another recruiter without invoking AI or ranking', async () => {
      mocks.auth.mockResolvedValue({ user: { id: 'intruder', role: 'recruiter' } });
      mocks.job.mockResolvedValue({ userId: 'owner' });
      mocks.match.mockResolvedValue({ job: { userId: 'owner' } });
      expect((await handler(request(), params)).status).toBe(403);
      expect(mocks.rank).not.toHaveBeenCalled(); expect(mocks.explain).not.toHaveBeenCalled();
    });
  }
});
