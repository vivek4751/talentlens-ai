import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (relativePath: string) => readFileSync(join(root, relativePath), "utf8");

describe("TalentLens Next.js redesign integration", () => {
  it("keeps the original backend endpoints wired into the redesigned core workflows", () => {
    const dashboard = source("src/app/dashboard/page.tsx");
    const jobs = source("src/app/jobs/page.tsx");
    const rankings = source("src/app/rankings/page.tsx");
    const upload = source("src/app/upload-resume/page.tsx");

    expect(dashboard).toContain('"/api/dashboard/stats"');
    expect(dashboard).toContain('"/api/dashboard/candidates"');
    expect(jobs).toContain('"/api/jobs"');
    expect(jobs).toContain('"/api/matches"');
    expect(rankings).toContain('`/api/matches?jobId=${selectedJobId}`');
    expect(rankings).toContain('`/api/jobs/${selectedJobId}/export`');
    expect(upload).toContain('"/api/candidates/upload"');

    const directory = source("src/app/candidates/page.tsx");
    const directoryApi = source("src/app/api/candidates/route.ts");
    expect(directory).toContain('`/api/candidates?${params.toString()}`');
    expect(directoryApi).toContain("await auth()");
    expect(directoryApi).toContain("prisma.candidate.findMany");
  });

  it("keeps every required recruiter decision and score label in the match explanation UI", () => {
    const rankings = source("src/app/rankings/page.tsx");
    for (const label of ["semantic", "skills", "experience", "education", "availability"]) {
      expect(rankings).toContain(`"${label}"`);
    }
    for (const status of ["Shortlist", "Reject", "Pending"]) {
      expect(rankings).toContain(`"${status}"`);
    }
    expect(rankings).toContain("AI RECOMMENDATION");
    expect(rankings).toContain("IMPROVEMENT SUGGESTIONS");
    expect(rankings).toContain("RECRUITER STATUS");
  });

  it("keeps recruiter and candidate navigation distinct inside the shared Next.js sidebar", () => {
    const sidebar = source("src/components/SideBar.tsx");
    expect(sidebar).toContain("const recruiterMenus");
    expect(sidebar).toContain("const candidateMenus");
    expect(sidebar).toContain('role === "candidate" ? candidateMenus : recruiterMenus');
  });

  it("preserves role selection and both registration paths in the redesigned register screen", () => {
    const register = source("src/app/register/page.tsx");
    expect(register).toContain('useState<"recruiter" | "candidate">');
    expect(register).toContain('"/api/auth/register"');
    expect(register).toContain('"/api/auth/google-intent"');
    expect(register).toContain('signIn("google"');
  });
});
