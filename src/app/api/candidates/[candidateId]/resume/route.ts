import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/core/errors';
import { requireRecruiter } from '@/lib/recruiter-access';
import { MatchingService } from '@/services/matching.service';

export const maxDuration = 180;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ candidateId: string }> }) {
  try {
    const user = await requireRecruiter();
    const { candidateId } = await params;
    const body = await req.json();
    if (typeof body.rawResumeText !== 'string' || body.rawResumeText.trim().length < 50 || body.rawResumeText.length > 100000) {
      throw new AppError('Provide resume text between 50 and 100,000 characters.', 400);
    }
    const candidate = await MatchingService.createCandidateProfile(user.id, body.rawResumeText.trim(), undefined, candidateId);
    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Update resume failed:', error);
    return NextResponse.json({ message: error instanceof AppError ? error.message : 'Unable to update the resume. Please retry.' }, { status: error instanceof AppError ? error.statusCode : 500 });
  }
}
