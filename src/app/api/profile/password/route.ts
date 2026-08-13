import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { currentPassword?: string; newPassword?: string };
    const currentPassword = body.currentPassword || "";
    const newPassword = body.newPassword || "";

    if (newPassword.length < 8) {
      return NextResponse.json({ message: "Your new password must be at least 8 characters." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ message: "Account not found" }, { status: 404 });

    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Enter your current password first." }, { status: 400 });
      }
      const matches = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!matches) {
        return NextResponse.json({ message: "Your current password is not correct." }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ message: user.passwordHash ? "Password changed successfully." : "Password created successfully." });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ message: "Unable to update your password right now." }, { status: 500 });
  }
}
