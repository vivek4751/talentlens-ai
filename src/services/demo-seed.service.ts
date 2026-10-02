import { createHash } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { demoFixtures, DEMO_LIMITATION, DEMO_WEIGHTS } from '../demo/scenarios';
import { RankingService } from './ranking.service';
import { AnomalyService } from './anomaly.service';

export async function seedRecruiterDemo(userId: string) {
  const namespace = createHash('sha256').update(userId).digest('hex').slice(0, 16);
  const demoId = (id: string) => 'demo-' + namespace + '-' + id;
  const jobs = demoFixtures.jobs.map(fixture => ({
    id: demoId(fixture.id), userId, title: '[DEMO] ' + fixture.title,
    company: 'Example Product Studio (fictional)', department: 'Synthetic demo',
    rawDescription: fixture.rawDescription, requiredSkills: fixture.profile.requiredSkills,
    preferredSkills: fixture.profile.preferredSkills, experienceYears: fixture.profile.experienceYears,
    preferProductCompany: false, responsibilities: [], softSkills: [], preferredDegrees: [], preferredUniversities: [],
  }));
  const candidates = demoFixtures.candidates.map(fixture => {
    const profile = fixture.profile;
    const anomaly = AnomalyService.checkCandidate(profile);
    return {
      id: demoId(fixture.id), userId, candidateId: 'DEMO_' + namespace + '_' + fixture.id,
      name: '[DEMO] ' + fixture.name, headline: fixture.headline,
      rawResumeText: fixture.rawResumeText, summary: fixture.summary,
      yearsOfExperience: profile.yearsOfExperience, location: 'Fictional demo profile',
      currentTitle: fixture.headline, currentCompany: 'Example Product Studio (fictional)',
      noticePeriodDays: profile.noticePeriodDays, openToWork: profile.openToWork,
      profileCompleteness: profile.profileCompleteness, connectionCount: profile.connectionCount,
      recruiterResponse: profile.recruiterResponseRate, anomalyStatus: anomaly.status, anomalyReasons: anomaly.reasons,
    };
  });
  // Compute outside the transaction. Bulk writes keep remote database round trips bounded.
  const matches = demoFixtures.candidates.flatMap((fixture, index) => demoFixtures.jobs.map(job => {
    const scores = RankingService.scoreCandidate(fixture.profile, job.profile, DEMO_WEIGHTS);
    const skills = new Set(fixture.profile.skills.map(skill => skill.name.toLowerCase()));
    const missingSkills = job.profile.requiredSkills.filter(skill => !skills.has(skill.toLowerCase()));
    return {
      jobId: demoId(job.id), candidateId: demoId(fixture.id), ...scores,
      strengths: ['Synthetic structured-profile score; no Gemini calls were made.'],
      weaknesses: candidates[index].anomalyReasons, missingSkills, hiringRecommendation: DEMO_LIMITATION,
      improvementSuggestions: missingSkills.map(skill => 'Validate practical experience with ' + skill + '.'),
    };
  }));

  return prisma.$transaction(async tx => {
    // Serialize imports for this account; existing records and decisions are never reset.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    const existing = await tx.candidate.findMany({
      where: { id: { in: candidates.map(candidate => candidate.id) } }, select: { id: true },
    });
    const existingIds = new Set(existing.map(candidate => candidate.id));
    const fresh = demoFixtures.candidates.filter(fixture => !existingIds.has(demoId(fixture.id)));
    await tx.job.createMany({ data: jobs, skipDuplicates: true });
    await tx.candidate.createMany({ data: candidates, skipDuplicates: true });
    if (fresh.length) {
      await tx.skill.createMany({ data: fresh.flatMap(fixture => fixture.profile.skills
        .map(skill => ({ ...skill, candidateId: demoId(fixture.id) }))) });
      await tx.careerHistory.createMany({ data: fresh.flatMap(fixture => fixture.profile.careerHistory
        .map(role => ({ ...role, candidateId: demoId(fixture.id),
          startDate: new Date(role.startDate), endDate: new Date(role.endDate) }))) });
      await tx.education.createMany({ data: fresh.flatMap(fixture => fixture.profile.education
        .map(school => ({ ...school, candidateId: demoId(fixture.id) }))) });
    }
    await tx.match.createMany({ data: matches, skipDuplicates: true });
    return { candidates: candidates.length, jobs: jobs.length, matches: matches.length,
      message: 'Demo ready. Repeating this action reuses the same records and preserves decisions.' };
  }, { timeout: 45000 });
}
