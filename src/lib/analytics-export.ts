import { AnalyticsCandidate } from '@/types/analytics';

export function filterAnalyticsCandidates(rows: AnalyticsCandidate[], filters: { search: string; status: string; minimum: number; sort: string }) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter(c => (!query || [c.name, c.title || '', c.jobTitle, ...c.skills].some(value => value.toLowerCase().includes(query))) && (!filters.status || c.status === filters.status) && c.score >= filters.minimum).sort((a, b) => filters.sort === 'name' ? a.name.localeCompare(b.name) : filters.sort === 'lowest' ? a.score - b.score : b.score - a.score);
}

export function analyticsCsv(rows: AnalyticsCandidate[]) {
  const cell = (value: string | number) => `"${String(value).replace(/^\s*[=+@-]/, "'$&").replace(/"/g, '""')}"`;
  const lines = [['Candidate', 'Role', 'Fit score (%)', 'Decision', 'Semantic', 'Skills', 'Experience', 'Education', 'Domain', 'Career', 'Availability', 'Missing skills'], ...rows.map(c => [c.name, c.jobTitle, c.score, c.status, c.dimensions.semantic, c.dimensions.skills, c.dimensions.experience, c.dimensions.education, c.dimensions.domain, c.dimensions.career, c.dimensions.availability, c.missingSkills.join('; ')])];
  return '\uFEFF' + lines.map(row => row.map(cell).join(',')).join('\r\n');
}
