export type MobileUser = { id: string; name: string; email: string; role: "recruiter" | "candidate" };
export type DashboardData = { stats: { activeJobs: number; totalCandidates: number; shortlisted: number; averageAIScore: number }; candidates: { id: string; candidateId: string; name: string; currentTitle: string | null; overallScore: number; recruiterStatus: string }[] };
export type MobileJob = { id: string; title: string; company: string | null; department: string | null; seniority: string; domain: string; experienceYears: number; educationLevel: string; rawDescription: string; applied?: boolean };
export type MobileMatch = { id: string; candidateId: string; overallScore: number; semanticSimilarity: number; skillMatchScore: number; experienceScore: number; educationScore: number; availabilityScore: number; recruiterStatus: string; hiringRecommendation: string; strengths: string[]; weaknesses: string[]; missingSkills: string[]; improvementSuggestions: string[]; candidate: { id: string; name: string; headline: string | null; yearsOfExperience: number } };
export type MobileProfile = { id: string; candidateId: string; name: string; headline: string | null; summary: string | null; location: string | null; currentTitle: string | null; yearsOfExperience: number; skills: { id: string; name: string }[]; education: { id: string; institution: string; degree: string }[]; careerHistory: { id: string; company: string; title: string; durationMonths: number; isCurrent: boolean }[]; matches: MobileMatch[] };

const endpoint = process.env.EXPO_PUBLIC_TALENTLENS_API_URL?.replace(/\/$/, "");

export function configuredEndpoint() { return endpoint; }

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!endpoint) throw new Error("Set EXPO_PUBLIC_TALENTLENS_API_URL to your TalentLens website address before signing in.");
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${endpoint}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({})) as { message?: string } & T;
  if (!response.ok) throw new Error(body.message || "The TalentLens service could not complete this request.");
  return body as T;
}

export const mobileApi = {
  signIn: (email: string, password: string) => request<{ user: MobileUser; token: string }>("/api/mobile/auth/sign-in", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, role: MobileUser["role"]) => request<{ user: MobileUser; token: string }>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, role, mobile: true }) }),
  dashboard: (token: string) => request<DashboardData>("/api/mobile/dashboard", {}, token),
  jobs: (token: string) => request<MobileJob[]>("/api/mobile/jobs", {}, token),
  rankings: (token: string, jobId: string) => request<MobileMatch[]>(`/api/mobile/rankings?jobId=${encodeURIComponent(jobId)}`, {}, token),
  profile: (token: string) => request<MobileProfile>("/api/mobile/profile", {}, token),
  apply: (token: string, jobId: string) => request<{ success: boolean }>(`/api/mobile/jobs/${jobId}/apply`, { method: "POST" }, token),
  updateStatus: (token: string, matchId: string, recruiterStatus: string) => request<{ success: boolean }>(`/api/mobile/matches/${matchId}`, { method: "PATCH", body: JSON.stringify({ recruiterStatus }) }, token),
  uploadResume: (token: string, uri: string, name: string, mimeType: string) => { const body = new FormData(); body.append("file", { uri, name, type: mimeType } as unknown as Blob); return request<{ data: { id: string } }>("/api/mobile/resume", { method: "POST", body }, token); },
};
