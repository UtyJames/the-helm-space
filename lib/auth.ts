import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { z } from "zod";
import bcrypt from "bcryptjs";

const credentialsSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  pin: z.string().optional(),
  mode: z.enum(["credentials", "pin"]).default("credentials"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "the-helm-space-auth-secret-fallback-key-2025",
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      authorize: async (credentials) => {
        try {
          const parsed = credentialsSchema.parse(credentials);
          const { mode } = parsed;

          if (mode === "pin") {
            // PIN mode: find user by PIN alone (no username required)
            const pin = parsed.pin?.trim();
            if (!pin || pin.length !== 4) return null;

            // Find active user with this PIN
            const user = await prisma.user.findFirst({
              where: { pin: pin, active: true },
            });
            if (!user) return null;

            return {
              id: user.id,
              name: user.name ?? user.username,
              username: user.username,
              role: user.role,
            };
          } else {
            // Credentials mode: username + password
            const username = parsed.username?.trim();
            if (!username) return null;

            const user = await prisma.user.findFirst({
              where: {
                OR: [
                  { username: username },
                  { username: { equals: username, mode: "insensitive" } },
                ],
              },
            });
            if (!user || !user.active) return null;

            const password = parsed.password || "";
            if (!password || !user.password) return null;

            let matches = password === user.password;
            if (!matches && user.password.startsWith("$2")) {
              try {
                matches = await bcrypt.compare(password, user.password);
              } catch {}
            }
            if (!matches) return null;

            return {
              id: user.id,
              name: user.name ?? user.username,
              username: user.username,
              role: user.role,
            };
          }
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
  ],
});
