import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/services/dashboard.service";
import { getTopCandidates } from "@/services/candidate-dashboard.service";
import { mobileError, requireMobileUser } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (user.role !== "recruiter" && user.role !== "admin") return NextResponse.json({ message: "Recruiter access is required." }, { status: 403 });
    const [stats, candidates] = await Promise.all([getDashboardStats(), getTopCandidates()]);
    return NextResponse.json({ stats, candidates });
  } catch (error) {
    const { message, status } = mobileError(error);
    return NextResponse.json({ message }, { status });
  }
}
