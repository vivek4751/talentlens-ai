import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), candidate: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { candidate: { findFirst: mocks.candidate } } }));
import { GET } from './[candidateId]/route';
beforeEach(() => vi.resetAllMocks());
const params = { params: Promise.resolve({ candidateId: 'profile-id' }) };
it('only includes this recruiter’s job matches and orders best fit first', async () => {
  mocks.auth.mockResolvedValue({ user: { id: 'owner', role: 'recruiter' } });
  mocks.candidate.mockResolvedValue({ id: 'profile-id', matches: [] });
  expect((await GET(new NextRequest('http://localhost/api/candidates/profile-id'), params)).status).toBe(200);
  expect(mocks.candidate).toHaveBeenCalledWith(expect.objectContaining({ include: expect.objectContaining({ matches: expect.objectContaining({ where: { job: { userId: 'owner' } }, orderBy: { overallScore: 'desc' } }) }) }));
});
it('rejects candidate accounts reading someone else’s profile', async () => {
  mocks.auth.mockResolvedValue({ user: { id: 'candidate', role: 'candidate' } });
  mocks.candidate.mockResolvedValue({ userId: 'other-user' });
  expect((await GET(new NextRequest('http://localhost/api/candidates/profile-id'), params)).status).toBe(403);
});
