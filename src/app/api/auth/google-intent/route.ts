import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const validRoles = new Set(["recruiter", "candidate"]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { role?: string };
    if (!body.role || !validRoles.has(body.role)) {
      return NextResponse.json({ message: "Choose a valid account role first." }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("talentlens-google-registration-role", body.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unable to start Google registration." }, { status: 400 });
  }
}
