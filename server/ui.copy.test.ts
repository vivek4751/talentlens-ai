import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const appSource = readFileSync(join(process.cwd(), "client/src/App.tsx"), "utf8");
const layoutSource = readFileSync(join(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");

describe("TalentLens recruitment workspace UI", () => {
  it("keeps the required lower-case match sub-score labels", () => {
    for (const label of ["semantic", "skills", "experience", "education", "availability"]) {
      expect(appSource).toContain(`"${label}"`);
    }
  });

  it("includes every required recruiter status control in the explanation modal", () => {
    for (const label of ["Shortlist", "Reject", "Pending"]) {
      expect(appSource).toContain(`"${label}"`);
    }
    expect(appSource).toContain("AI RECOMMENDATION");
    expect(appSource).toContain("IMPROVEMENT SUGGESTIONS");
    expect(appSource).toContain("RECRUITER STATUS");
  });

  it("defines separate recruiter and candidate navigation menus", () => {
    expect(layoutSource).toContain("const recruiterMenu");
    expect(layoutSource).toContain("const candidateMenu");
    expect(layoutSource).toContain("role === \"recruiter\" ? recruiterMenu : candidateMenu");
  });
});
