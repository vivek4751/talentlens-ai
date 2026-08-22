import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileError, requireMobileUser } from "@/lib/mobile-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    if (user.role !== "recruiter" && user.role !== "admin") return NextResponse.json({ message: "Recruiter access is required." }, { status: 403 });
    const { id } = await params;
    const { recruiterStatus } = await request.json() as { recruiterStatus?: string };
    if (!recruiterStatus || !["PENDING", "SHORTLISTED", "REJECTED"].includes(recruiterStatus)) return NextResponse.json({ message: "A valid recruiter status is required." }, { status: 400 });
    const match = await prisma.match.findFirst({ where: { id, job: { userId: user.id } }, select: { id: true } });
    if (!match) return NextResponse.json({ message: "Match not found." }, { status: 404 });
    await prisma.match.update({ where: { id }, data: { recruiterStatus } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = mobileError(error);
    return NextResponse.json({ message }, { status });
  }
}
