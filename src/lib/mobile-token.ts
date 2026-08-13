import { SignJWT } from "jose";

type MobileAccount = {
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
