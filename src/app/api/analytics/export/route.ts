import { NextRequest, NextResponse } from 'next/server';
import { GET as getAnalytics } from '../route';
import { analyticsCsv, filterAnalyticsCandidates } from '@/lib/analytics-export';
import { RecruiterAnalyticsData } from '@/types/analytics';

export async function GET(req: NextRequest) {
  // Reuse analytics authentication, account scoping and date validation.
  const response = await getAnalytics(req);
  if (!response.ok) return response;
  const data = await response.json() as RecruiterAnalyticsData;
  const query = req.nextUrl.searchParams;
  const minimum = Number(query.get('minimum') || 0);
  if (!Number.isFinite(minimum) || minimum < 0 || minimum > 100) return NextResponse.json({ message: 'Minimum score must be between 0 and 100.' }, { status: 400 });
  const rows = filterAnalyticsCandidates(data.leaderboard, { search: query.get('search') || '', status: query.get('status') || '', minimum, sort: query.get('sort') || 'score' });
  return new NextResponse(analyticsCsv(rows), { headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="talentlens-candidate-analytics.csv"',
    'Cache-Control': 'private, no-store',
  } });
}
