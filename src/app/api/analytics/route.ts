import { NextRequest, NextResponse } from "next/server";
import { getRecruiterAnalytics } from "@/services/analytics.service";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "recruiter" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const analyticsData = await getRecruiterAnalytics({
      jobId,
      startDate,
      endDate,
    });

    return NextResponse.json(analyticsData, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Recruiter Analytics Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch recruiter analytics" },
      { status: 500 }
    );
  }
}
