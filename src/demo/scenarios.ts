import fixtures from './fixtures.json';
import type { ScorerConfig } from '../services/ranking.service';

export const demoFixtures = fixtures;

// No invented embeddings: omit semantic scoring and proportionally redistribute its 20%.
export const DEMO_WEIGHTS: ScorerConfig['weights'] = {
  semantic: 0, skills: 0.3125, experience: 0.25, education: 0.125,
  career_progression: 0.1875, availability: 0.125,
};

export const DEMO_LIMITATION = 'Synthetic demonstration: 12 fictional resumes, 3 jobs and 36 manually labeled pairs. Uses structured profiles with semantic scoring disabled. Does not measure Gemini parsing, real embeddings, hiring accuracy, network or database latency. Labels are not independently reviewed or held out.';
