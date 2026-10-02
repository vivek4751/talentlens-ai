import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  lock: vi.fn(), existing: vi.fn(), jobs: vi.fn(), candidates: vi.fn(),
  skills: vi.fn(), careers: vi.fn(), education: vi.fn(), matches: vi.fn(), transaction: vi.fn(),
}));
vi.mock('../lib/prisma', () => ({ prisma: { $transaction: mocks.transaction } }));
import { seedRecruiterDemo } from './demo-seed.service';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.existing.mockResolvedValue([]);
  mocks.transaction.mockImplementation(async callback => callback({
    $queryRaw: mocks.lock, candidate: { findMany: mocks.existing, createMany: mocks.candidates },
    job: { createMany: mocks.jobs }, skill: { createMany: mocks.skills },
    careerHistory: { createMany: mocks.careers }, education: { createMany: mocks.education },
    match: { createMany: mocks.matches },
  }));
});

describe('bulk demo import', () => {
  it('writes 12 profiles, 3 jobs and 36 matches with one insert per table', async () => {
    expect(await seedRecruiterDemo('owner')).toMatchObject({ candidates: 12, jobs: 3, matches: 36 });
    expect(mocks.jobs.mock.calls[0][0].data).toHaveLength(3);
    expect(mocks.candidates.mock.calls[0][0].data).toHaveLength(12);
    expect(mocks.matches.mock.calls[0][0].data).toHaveLength(36);
    for (const insert of [mocks.jobs, mocks.candidates, mocks.skills, mocks.careers, mocks.education, mocks.matches]) {
      expect(insert).toHaveBeenCalledTimes(1);
    }
    expect(mocks.lock).toHaveBeenCalledTimes(1);
  });
  it('reuses account-specific records without duplicating nested data or resetting decisions', async () => {
    await seedRecruiterDemo('owner');
    const original = mocks.candidates.mock.calls[0][0].data;
    mocks.existing.mockResolvedValue(original.map((candidate: { id: string }) => ({ id: candidate.id })));
    await seedRecruiterDemo('owner');
    expect(mocks.skills).toHaveBeenCalledTimes(1);
    expect(mocks.careers).toHaveBeenCalledTimes(1);
    expect(mocks.education).toHaveBeenCalledTimes(1);
    expect(mocks.matches.mock.calls[1][0].skipDuplicates).toBe(true);
    await seedRecruiterDemo('other-owner');
    expect(mocks.candidates.mock.calls[2][0].data[0].id).not.toBe(original[0].id);
  });
});
