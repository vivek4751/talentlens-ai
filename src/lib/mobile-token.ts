import { jwtVerify, SignJWT } from "jose";

export type MobileAccount = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function tokenSecret() {
  const secret = process.env.MOBILE_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Mobile authentication is not configured.");
  return new TextEncoder().encode(secret);
}

export async function issueMobileToken(user: MobileAccount) {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(tokenSecret());
}

export async function verifyMobileToken(token: string): Promise<MobileAccount> {
  const { payload } = await jwtVerify(token, tokenSecret());
  if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid mobile session.");
  }
  return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
}
