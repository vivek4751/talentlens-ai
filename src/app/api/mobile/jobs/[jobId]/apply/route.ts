import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchingService } from "@/services/matching.service";
import { mobileError, requireMobileUser } from "@/lib/mobile-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await requireMobileUser(request);
    if (user.role !== "candidate") return NextResponse.json({ message: "Candidate access is required." }, { status: 403 });
    const { jobId } = await params;
    const candidate = await prisma.candidate.findFirst({ where: { userId: user.id }, select: { id: true, rawResumeText: true } });
    if (!candidate?.rawResumeText?.trim()) return NextResponse.json({ message: "Upload a resume before applying." }, { status: 400 });
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
    if (!job) return NextResponse.json({ message: "Job not found." }, { status: 404 });
    await MatchingService.runJobMatching(jobId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = mobileError(error);
    return NextResponse.json({ message }, { status });
  }
}
