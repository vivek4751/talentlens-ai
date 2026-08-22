import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileError, requireMobileUser } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (user.role !== "candidate") return NextResponse.json({ message: "Candidate access is required." }, { status: 403 });
    const candidate = await prisma.candidate.findFirst({ where: { userId: user.id }, include: { skills: true, education: true, careerHistory: { orderBy: { isCurrent: "desc" } }, matches: { include: { candidate: { select: { id: true, name: true, headline: true, yearsOfExperience: true } } } } } });
    if (!candidate) return NextResponse.json({ message: "No candidate profile has been created yet." }, { status: 404 });
    return NextResponse.json(candidate);
  } catch (error) {
    const { message, status } = mobileError(error);
    return NextResponse.json({ message }, { status });
  }
}
