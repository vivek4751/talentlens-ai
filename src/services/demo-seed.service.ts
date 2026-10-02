import { createHash } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { demoFixtures, DEMO_LIMITATION, DEMO_WEIGHTS } from '../demo/scenarios';
import { RankingService } from './ranking.service';
import { AnomalyService } from './anomaly.service';

export async function seedRecruiterDemo(userId: string) {
  const namespace = createHash('sha256').update(userId).digest('hex').slice(0, 16);
  return prisma.$transaction(async tx => {
    // Make concurrent clicks idempotent without resetting existing recruiter decisions.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    for (const fixture of demoFixtures.jobs) {
      const id = 'demo-' + namespace + '-' + fixture.id;
      await tx.job.upsert({ where: { id }, update: {}, create: {
        id, userId, title: '[DEMO] ' + fixture.title, company: 'Example Product Studio (fictional)',
        department: 'Synthetic demo', rawDescription: fixture.rawDescription,
        requiredSkills: fixture.profile.requiredSkills, preferredSkills: fixture.profile.preferredSkills,
        experienceYears: fixture.profile.experienceYears, preferProductCompany: false,
        responsibilities: [], softSkills: [], preferredDegrees: [], preferredUniversities: [],
      } });
    }
    for (const fixture of demoFixtures.candidates) {
      const id = 'demo-' + namespace + '-' + fixture.id;
      const profile = fixture.profile;
      const anomaly = AnomalyService.checkCandidate(profile);
      await tx.candidate.upsert({ where: { id }, update: {}, create: {
        id, userId, candidateId: 'DEMO_' + namespace + '_' + fixture.id,
        name: '[DEMO] ' + fixture.name, headline: fixture.headline,
        rawResumeText: fixture.rawResumeText, summary: fixture.summary,
        yearsOfExperience: profile.yearsOfExperience, location: 'Fictional demo profile',
        currentTitle: fixture.headline, currentCompany: 'Example Product Studio (fictional)',
        noticePeriodDays: profile.noticePeriodDays, openToWork: profile.openToWork,
        profileCompleteness: profile.profileCompleteness, connectionCount: profile.connectionCount,
        recruiterResponse: profile.recruiterResponseRate,
        anomalyStatus: anomaly.status, anomalyReasons: anomaly.reasons,
        skills: { create: profile.skills },
        careerHistory: { create: profile.careerHistory.map(role => ({ ...role,
          startDate: new Date(role.startDate), endDate: new Date(role.endDate) })) },
        education: { create: profile.education },
      } });
      for (const job of demoFixtures.jobs) {
        const jobId = 'demo-' + namespace + '-' + job.id;
        const scores = RankingService.scoreCandidate(profile, job.profile, DEMO_WEIGHTS);
        const candidateSkills = new Set(profile.skills.map(skill => skill.name.toLowerCase()));
        const missingSkills = job.profile.requiredSkills.filter(skill => !candidateSkills.has(skill.toLowerCase()));
        await tx.match.upsert({ where: { jobId_candidateId: { jobId, candidateId: id } }, update: {}, create: {
          jobId, candidateId: id, ...scores,
          strengths: ['Synthetic structured-profile score; no Gemini calls were made.'],
          weaknesses: anomaly.reasons, missingSkills,
          hiringRecommendation: DEMO_LIMITATION,
          improvementSuggestions: missingSkills.map(skill => 'Validate practical experience with ' + skill + '.'),
        } });
      }
    }
    return { candidates: demoFixtures.candidates.length, jobs: demoFixtures.jobs.length,
      matches: demoFixtures.candidates.length * demoFixtures.jobs.length,
      message: 'Demo ready. Repeating this action reuses the same records and preserves decisions.' };
  }, { timeout: 30000 });
}
