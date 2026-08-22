import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const status = request.nextUrl.searchParams.get("status") || "";
    const role = (session.user as { role?: string }).role;
    const candidates = await prisma.candidate.findMany({
      where: {
        ...(role === "candidate" ? { userId: session.user.id } : {}),
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { currentTitle: { contains: search, mode: "insensitive" } }, { skills: { some: { name: { contains: search, mode: "insensitive" } } } }] } : {}),
      },
      include: {
        skills: { select: { id: true, name: true }, take: 5 },
        matches: { orderBy: { overallScore: "desc" }, take: 1, include: { job: { select: { title: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    const result = candidates.map((candidate) => {
      const match = candidate.matches[0];
      return {
        id: candidate.id,
        candidateId: candidate.candidateId,
        name: candidate.name,
        currentTitle: candidate.currentTitle,
        location: candidate.location,
        yearsOfExperience: candidate.yearsOfExperience,
        skills: candidate.skills,
        match: match ? { id: match.id, overallScore: match.overallScore, recruiterStatus: match.recruiterStatus, jobTitle: match.job.title } : null,
      };
    }).filter((candidate) => !status || candidate.match?.recruiterStatus === status);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to load candidates";
    return NextResponse.json({ message }, { status: 500 });
  }
}
