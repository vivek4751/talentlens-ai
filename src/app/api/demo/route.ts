import { NextResponse } from 'next/server';
import { requireRecruiter } from '@/lib/recruiter-access';
import { handleError } from '@/core/errors/handler';
import report from '../../../../reports/demo-results.json';
import { seedRecruiterDemo } from '@/services/demo-seed.service';

export const maxDuration = 60;

// Public, fictional fixtures only. No account or database data is read by GET.
export async function GET() {
  return NextResponse.json(report);
}

export async function POST() {
  try {
    const user = await requireRecruiter();
    return NextResponse.json(await seedRecruiterDemo(user.id));
  } catch (error) {
    return handleError(error);
  }
}
