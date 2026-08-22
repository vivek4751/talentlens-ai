import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-token";

export async function requireMobileUser(request: NextRequest) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new Error("Unauthorized");
  const account = await verifyMobileToken(token);
  const user = await prisma.user.findUnique({ where: { id: account.id }, select: { id: true, name: true, email: true, role: true } });
  if (!user) throw new Error("Unauthorized");
  return user;
}

export function mobileError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to complete the mobile request.";
  return message === "Unauthorized" ? { message, status: 401 } : { message, status: 500 };
}
