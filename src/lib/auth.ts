import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { ROLE_HOME } from "./roles";

const DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "jihc.edu.kz";
export const demoLoginEnabled = process.env.DEMO_LOGIN === "true";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "parent",
    name: "Ата-ана",
    credentials: { identifier: {}, pin: {} },
    async authorize(credentials) {
      const identifier = credentials?.identifier?.trim();
      const pin = credentials?.pin?.trim();
      if (!identifier || !pin) return null;

      // Identifier is either the system-issued Parent ID or the child's IIN.
      const candidates = await prisma.user.findMany({
        where: {
          role: "PARENT",
          OR: [{ parentId: identifier }, { children: { some: { child: { iin: identifier } } } }],
        },
      });
      for (const parent of candidates) {
        if (parent.parentPinHash && (await bcrypt.compare(pin, parent.parentPinHash))) {
          return { id: parent.id, name: parent.name, email: parent.email, role: parent.role };
        }
      }
      return null;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // "hd" only pre-selects the domain in Google's chooser; signIn below enforces it.
      authorization: { params: { hd: DOMAIN, prompt: "select_account" } },
    }),
  );
}

if (demoLoginEnabled) {
  providers.push(
    CredentialsProvider({
      id: "demo",
      name: "Демо",
      credentials: { email: {} },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        return user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login", error: "/login" },
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const email = profile?.email?.toLowerCase();
      const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
      if (!email || !verified || !email.endsWith(`@${DOMAIN}`)) return "/login?error=domain";
      // Accounts are created by the administration (import), not on first login.
      const exists = await prisma.user.findUnique({ where: { email } });
      return exists ? true : "/login?error=unknown";
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email.toLowerCase() } });
        if (dbUser) {
          token.uid = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
        }
      } else if (user) {
        token.uid = user.id;
        token.role = (user as unknown as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
};

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** For server components and actions: returns the user or redirects. */
export async function requireUser(roles?: Role[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}
