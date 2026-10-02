import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ generate: vi.fn(), model: vi.fn() }));
vi.mock('@google/generative-ai', () => ({ SchemaType: { OBJECT: 'object', ARRAY: 'array', STRING: 'string', INTEGER: 'integer', NUMBER: 'number', BOOLEAN: 'boolean' }, GoogleGenerativeAI: class { getGenerativeModel(config: { model: string }) { mocks.model(config); return { generateContent: () => mocks.generate(config.model) }; } } }));
import { GeminiService } from './gemini.service';

beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('GEMINI_API_KEY', 'test-key'); vi.stubEnv('GEMINI_PARSE_MODEL', 'gemini-3.6-flash'); vi.stubEnv('GEMINI_FALLBACK_MODEL', 'gemini-3.5-flash'); });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
const response = { response: { text: () => JSON.stringify({ profile: { anonymizedName: 'Candidate', yearsOfExperience: 2 }, skills: [], education: [], careerHistory: [] }) } };

it('falls back immediately on exhausted daily quota with the same output schema', async () => {
  mocks.generate.mockRejectedValueOnce(Object.assign(new Error('GenerateRequestsPerDayPerProjectPerModel-FreeTier'), { status: 429 })).mockResolvedValue(response);
  expect((await GeminiService.parseResume('source')).profile.anonymizedName).toBe('Candidate');
  expect(mocks.generate.mock.calls.map(args => args[0])).toEqual(['gemini-3.6-flash', 'gemini-3.5-flash']);
  expect(mocks.model.mock.calls[0][0].generationConfig).toEqual(mocks.model.mock.calls[1][0].generationConfig);
});
it('does not fall back for invalid credentials', async () => {
  mocks.generate.mockRejectedValue(Object.assign(new Error('Invalid API key'), { status: 401 }));
  await expect(GeminiService.parseResume('source')).rejects.toThrow('Invalid API key');
  expect(mocks.generate).toHaveBeenCalledTimes(1);
});
it('falls back after bounded retries for model overload', async () => {
  vi.useFakeTimers();
  mocks.generate.mockRejectedValueOnce(Object.assign(new Error('overloaded'), { status: 503 })).mockRejectedValueOnce(Object.assign(new Error('overloaded'), { status: 503 })).mockRejectedValueOnce(Object.assign(new Error('overloaded'), { status: 503 })).mockRejectedValueOnce(Object.assign(new Error('overloaded'), { status: 503 })).mockResolvedValue(response);
  const pending = GeminiService.parseResume('source');
  await vi.runAllTimersAsync();
  await expect(pending).resolves.toMatchObject({ profile: { anonymizedName: 'Candidate' } });
  expect(mocks.generate.mock.calls.map(args => args[0])).toEqual(['gemini-3.6-flash', 'gemini-3.6-flash', 'gemini-3.6-flash', 'gemini-3.6-flash', 'gemini-3.5-flash']);
});
