import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileError, requireMobileUser } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (user.role !== "recruiter" && user.role !== "admin") return NextResponse.json({ message: "Recruiter access is required." }, { status: 403 });
    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ message: "jobId is required." }, { status: 400 });
    const job = await prisma.job.findFirst({ where: { id: jobId, userId: user.id }, select: { id: true } });
    if (!job) return NextResponse.json({ message: "Job not found." }, { status: 404 });
    const matches = await prisma.match.findMany({ where: { jobId }, orderBy: { overallScore: "desc" }, include: { candidate: { select: { id: true, name: true, headline: true, yearsOfExperience: true } } } });
    return NextResponse.json(matches);
  } catch (error) {
    const { message, status } = mobileError(error);
    return NextResponse.json({ message }, { status });
  }
}
