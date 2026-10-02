import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterAnalytics } from '@/services/analytics.service';
import { requireRecruiter } from '@/lib/recruiter-access';
import { AppError } from '@/core/errors';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRecruiter();
    const query = req.nextUrl.searchParams;
    const startDate = query.get('startDate') || undefined;
    const endDate = query.get('endDate') || undefined;
    for (const date of [startDate, endDate]) if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new AppError('Choose valid dates.', 400);
    if (startDate && endDate && startDate > endDate) throw new AppError('Start date must be before end date.', 400);
    return NextResponse.json(await getRecruiterAnalytics({ userId: user.id, admin: user.role === 'admin', jobId: query.get('jobId') || undefined, startDate, endDate }));
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ message: error instanceof AppError ? error.message : 'Unable to load analytics.' }, { status: error instanceof AppError ? error.statusCode : 500 });
  }
}
