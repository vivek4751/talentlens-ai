import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileError, requireMobileUser } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    const candidate = user.role === "candidate" ? await prisma.candidate.findFirst({ where: { userId: user.id }, select: { id: true } }) : null;
    const jobs = await prisma.job.findMany({ where: user.role === "recruiter" || user.role === "admin" ? { userId: user.id } : {}, orderBy: { createdAt: "desc" } });
    const applications = candidate ? await prisma.match.findMany({ where: { candidateId: candidate.id }, select: { jobId: true } }) : [];
    const appliedJobIds = new Set(applications.map((application) => application.jobId));
    return NextResponse.json(jobs.map((job) => ({ ...job, applied: candidate ? appliedJobIds.has(job.id) : undefined })));
  } catch (error) {
    const { message, status } = mobileError(error);
    return NextResponse.json({ message }, { status });
  }
}
