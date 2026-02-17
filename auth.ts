import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    jwt({ token, user, account, profile }) {
      // Attach userId to JWT token when user signs in
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      // Attach userId from JWT to session for easy access in API routes
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin", // Custom sign-in page
  },
  session: {
    strategy: "jwt", // Use JWT sessions (works in Edge Runtime)
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
