import type { NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Role } from "@prisma/client";

// Edge-safe config — no Prisma, no bcrypt, no native addons.
// proxy.ts imports ONLY this; auth.ts spreads this and adds the full Credentials provider.
export const authConfig = {
  session: { strategy: "jwt" as const, maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: { id?: string; role?: Role } }) {
      if (user) {
        if (user.id) token.id = user.id;
        if (user.role) token.role = user.role;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
