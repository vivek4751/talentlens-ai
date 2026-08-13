import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issueMobileToken } from "@/lib/mobile-token";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail || !password) return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ message: "Incorrect email or password." }, { status: 401 });
    }
    const responseUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return NextResponse.json({ user: responseUser, token: await issueMobileToken(responseUser) });
  } catch (error) {
    console.error("Mobile sign-in error:", error);
    return NextResponse.json({ message: "Unable to sign in on mobile." }, { status: 500 });
  }
}
