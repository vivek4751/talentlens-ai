import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PdfParserService } from './pdf-parser.service';
import { demoFixtures } from '../demo/scenarios';

describe('demo PDF upload compatibility', () => {
  it.each(demoFixtures.candidates)('extracts the complete profile from $id.pdf', async person => {
    const text = await PdfParserService.parsePdf(readFileSync('public/demo/resumes/' + person.id + '.pdf'));
    expect(text).toContain(person.name);
    expect(text).toContain('SYNTHETIC DEMO');
    for (const skill of person.profile.skills) expect(text).toContain(skill.name);
  });
  it.each(demoFixtures.jobs)('extracts requirements from $id.pdf', async job => {
    const text = await PdfParserService.parsePdf(readFileSync('public/demo/jobs/' + job.id + '.pdf'));
    expect(text).toContain(job.title);
    for (const skill of job.profile.requiredSkills) expect(text).toContain(skill);
  });
});
