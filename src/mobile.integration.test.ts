import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("TalentLens Android companion integration", () => {
  it("verifies bearer tokens before exposing Android mobile data routes", () => {
    expect(source("src/lib/mobile-token.ts")).toContain("verifyMobileToken");
    for (const path of [
      "src/app/api/mobile/dashboard/route.ts",
      "src/app/api/mobile/jobs/route.ts",
      "src/app/api/mobile/rankings/route.ts",
      "src/app/api/mobile/profile/route.ts",
      "src/app/api/mobile/resume/route.ts",
    ]) {
      expect(source(path)).toContain("requireMobileUser");
    }
  });

  it("keeps Android resume uploads and candidate applications on existing backend services", () => {
    expect(source("src/app/api/mobile/resume/route.ts")).toContain("MatchingService.createCandidateProfile");
    const application = source("src/app/api/mobile/jobs/[jobId]/apply/route.ts");
    expect(application).toContain("MatchingService.runJobMatching");
    expect(application).toContain("rawResumeText");
    expect(application).not.toContain("resumeUrl");
  });

  it("uses a currently supported Gemini Flash model for parser-backed mobile workflows", () => {
    const gemini = source("src/services/gemini.service.ts");
    expect(gemini).toContain("gemini-3.6-flash");
    expect(gemini).not.toContain("gemini-2.5-flash");
  });

  it("keeps the native app configurable and exposes every required recruiter decision", () => {
    const api = source("mobile/lib/api.ts");
    const rankings = source("mobile/app/(tabs)/rankings.tsx");
    expect(api).toContain("EXPO_PUBLIC_TALENTLENS_API_URL");
    expect(api).toContain('"/api/mobile/auth/sign-in"');
    for (const label of ["Shortlist", "Reject", "Pending", "semantic", "skills", "experience", "education", "availability"]) {
      expect(rankings).toContain(label);
    }
  });
});
