'use client';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AnalyticsCandidate } from '@/types/analytics';

const dimensions = ['semantic', 'skills', 'experience', 'education', 'domain', 'career', 'availability'] as const;
const colors = ['#ed5b44', '#3268b9', '#0e8b71'];

export default function AnalyticsRadar({ candidates }: { candidates: AnalyticsCandidate[] }) {
  const rows = dimensions.map(key => ({ dimension: key.charAt(0).toUpperCase() + key.slice(1), ...Object.fromEntries(candidates.map(c => [c.id, c.dimensions[key]])) }));
  if (!candidates.length) return <p className="p-8 text-sm">Select up to three candidates from the leaderboard to compare their score breakdowns.</p>;
  return <>
    <div style={{ height: 330, minWidth: 0 }} role="img" aria-label={`Score comparison for ${candidates.map(c => c.name).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%"><RadarChart data={rows} outerRadius="65%">
        <PolarGrid /><PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} /><PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip />{candidates.map((c, i) => <Radar key={c.id} name={c.name} dataKey={c.id} stroke={colors[i]} fill={colors[i]} fillOpacity={.12} isAnimationActive={false} />)}
      </RadarChart></ResponsiveContainer>
    </div>
    <div className="flex flex-wrap gap-4 text-sm">{candidates.map((c, i) => <span key={c.id} style={{ color: colors[i] }}>● {c.name} · {c.score}%</span>)}</div>
    <details className="mt-4 text-sm"><summary>View comparison values</summary><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Dimension</th>{candidates.map(c => <th key={c.id}>{c.name}</th>)}</tr></thead><tbody>{dimensions.map(key => <tr key={key}><td>{key}</td>{candidates.map(c => <td key={c.id}>{c.dimensions[key]}</td>)}</tr>)}</tbody></table></div></details>
  </>;
}
