import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const cookieStore = await cookies();
        const registrationRole = cookieStore.get("talentlens-google-registration-role")?.value;
        const requestedRole = registrationRole === "candidate" ? "candidate" : registrationRole === "recruiter" ? "recruiter" : null;
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

        if (!dbUser && !requestedRole) {
          return "/login?error=GoogleAccountNotRegistered";
        }

        if (dbUser && requestedRole) {
          cookieStore.delete("talentlens-google-registration-role");
          return "/login?error=GoogleAccountExists";
        }

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split("@")[0] || "Google user",
              passwordHash: null,
              role: requestedRole ?? "recruiter",
              emailVerifiedAt: new Date(),
            },
          });

          if (dbUser.role === "candidate") {
            await prisma.candidate.create({
              data: {
                userId: dbUser.id,
                candidateId: `CAND_${Math.floor(1000000 + Math.random() * 9000000)}`,
                name: dbUser.name,
                email: dbUser.email,
                rawResumeText: "",
                headline: "Candidate Profile",
                summary: "Awaiting resume import and profile setup.",
                verifiedEmail: true,
              },
            });
          }
        }

        cookieStore.delete("talentlens-google-registration-role");
        user.id = dbUser.id;
        user.name = dbUser.name;
        user.email = dbUser.email;
        (user as { role?: string }).role = dbUser.role;
      }
      return true;
    },
  },
});
