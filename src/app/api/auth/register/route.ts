import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issueMobileToken } from "@/lib/mobile-token";

function candidateId() {
  return `CAND_${Math.floor(1_000_000 + Math.random() * 9_000_000)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, mobile } = await req.json();
    const normalizedName = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const validRole = role === "candidate" || role === "recruiter" ? role : null;

    if (!normalizedName || !normalizedEmail || typeof password !== "string" || !validRole) {
      return NextResponse.json({ message: "Name, email, password, and role are required." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: "Use a password with at least six characters." }, { status: 400 });
    }
    if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
      return NextResponse.json({ message: "A user with this email address already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: normalizedName, email: normalizedEmail, passwordHash, role: validRole },
      });

      if (created.role === "candidate") {
        await tx.candidate.create({
          data: {
            userId: created.id,
            candidateId: candidateId(),
            name: created.name,
            email: created.email,
            rawResumeText: "",
            headline: "Candidate Profile",
            summary: "Awaiting resume import and profile setup.",
            verifiedEmail: false,
          },
        });
      }

      return created;
    });

    const responseUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    if (mobile) {
      const token = await issueMobileToken(responseUser);
      return NextResponse.json({ user: responseUser, token }, { status: 201 });
    }
    return NextResponse.json({ message: "Account created. You can now sign in.", user: responseUser }, { status: 201 });
  } catch (error) {
    console.error("Direct registration error:", error);
    return NextResponse.json({ message: "Unable to create your account." }, { status: 500 });
  }
}
