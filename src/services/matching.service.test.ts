import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const entity = () => ({ findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() });
  const tx = { candidate: entity(), skill: entity(), careerHistory: entity(), education: entity(), $queryRaw: vi.fn(), $executeRawUnsafe: vi.fn() };
  return { tx, db: { user: entity(), candidate: entity(), $transaction: vi.fn() }, parse: vi.fn(), embed: vi.fn() };
});
vi.mock('../lib/prisma', () => ({ prisma: mocks.db }));
vi.mock('./gemini.service', () => ({ GeminiService: { parseResume: mocks.parse, generateEmbedding: mocks.embed } }));
import { MatchingService } from './matching.service';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.db.$transaction.mockImplementation(callback => callback(mocks.tx));
  mocks.parse.mockResolvedValue({ profile: { anonymizedName: 'Test Candidate', yearsOfExperience: 2 }, skills: [{ name: 'React', proficiency: 'intermediate', durationMonths: 24, endorsements: 0 }], careerHistory: [], education: [] });
  mocks.embed.mockResolvedValue([1, 0]);
  mocks.db.candidate.findUnique.mockResolvedValue(null);
  vi.spyOn(MatchingService, 'runCandidateMatching').mockResolvedValue(0);
});

describe('resume persistence', () => {
  it('creates separate profiles for two resumes uploaded by the same recruiter', async () => {
    mocks.db.user.findUnique.mockResolvedValue({ role: 'recruiter' });
    mocks.tx.candidate.create.mockResolvedValueOnce({ id: 'first' }).mockResolvedValueOnce({ id: 'second' });
    expect((await MatchingService.createCandidateProfile('recruiter', 'first resume')).id).toBe('first');
    expect((await MatchingService.createCandidateProfile('recruiter', 'second resume')).id).toBe('second');
    expect(mocks.tx.candidate.create).toHaveBeenCalledTimes(2);
    expect(mocks.tx.candidate.update).not.toHaveBeenCalled();
    expect(mocks.tx.skill.deleteMany).not.toHaveBeenCalled();
  });
  it('updates the existing profile for a candidate account inside one transaction', async () => {
    mocks.db.user.findUnique.mockResolvedValue({ role: 'candidate' });
    mocks.tx.candidate.findFirst.mockResolvedValue({ id: 'self', name: 'Old Name' });
    mocks.tx.candidate.update.mockResolvedValue({ id: 'self' });
    await MatchingService.createCandidateProfile('candidate', 'updated resume');
    expect(mocks.tx.candidate.create).not.toHaveBeenCalled();
    expect(mocks.tx.candidate.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'self' } }));
    expect(mocks.db.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(mocks.tx.skill.createMany).toHaveBeenCalledTimes(1);
  });
  it('does not change a stored profile when Gemini parsing fails', async () => {
    mocks.db.user.findUnique.mockResolvedValue({ role: 'candidate' });
    mocks.parse.mockRejectedValue(new Error('AI unavailable'));
    await expect(MatchingService.createCandidateProfile('candidate', 'resume')).rejects.toThrow('AI unavailable');
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });
  it('does not rank after a transaction fails', async () => {
    mocks.db.user.findUnique.mockResolvedValue({ role: 'recruiter' });
    mocks.tx.candidate.create.mockResolvedValue({ id: 'new' });
    mocks.tx.skill.createMany.mockRejectedValue(new Error('database write failed'));
    await expect(MatchingService.createCandidateProfile('recruiter', 'resume')).rejects.toThrow('database write failed');
    expect(MatchingService.runCandidateMatching).not.toHaveBeenCalled();
  });
  it('parses empty vector storage as an empty vector', () => {
    expect(MatchingService.parseVectorString('[]')).toEqual([]);
  });
});
