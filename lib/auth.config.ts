import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin",
    error: "/admin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Always allow API auth routes
      if (pathname.startsWith("/api/auth")) return true;

      // Admin sign-in page
      if (pathname === "/admin") {
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }
        return true;
      }

      // Protected admin routes
      if (pathname.startsWith("/admin/")) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return true;
      }

      // All other routes are public
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.role = (user as { role?: string }).role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { username?: string }).username = token.username as string;
        (session.user as { role?: string }).role = token.role as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
