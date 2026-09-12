import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "nama@domain.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const authStart = Date.now();
        console.log("[AUTH] Memulai verifikasi kredensial NextAuth...");

        try {
          if (!credentials?.email || !credentials?.password) {
            console.warn("[AUTH] Email atau kata sandi tidak diisi");
            return null;
          }

          const email = credentials.email.toLowerCase().trim();
          console.log(`[AUTH] Mencari user di database untuk email: ${email}...`);
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.passwordHash) {
            console.warn(`[AUTH] Akun dengan email ${email} tidak ditemukan di database`);
            return null;
          }

          console.log(`[AUTH] Memvalidasi kecocokan kata sandi dengan bcryptjs...`);
          const isPasswordValid = await bcryptjs.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            console.warn(`[AUTH] Kata sandi salah untuk email: ${email}`);
            return null;
          }

          console.log(
            `[AUTH] Verifikasi kredensial berhasil untuk user ID ${user.id} (${Date.now() - authStart}ms)`
          );

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("[AUTH] Error tidak terduga saat authorize:", error);
          return null;
        }
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
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
        }
      } catch (err) {
        console.error("[AUTH] Error pada jwt callback:", err);
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (token && session?.user) {
          (session.user as { id?: string }).id = (token.id || token.sub) as string;
        }
      } catch (err) {
        console.error("[AUTH] Error pada session callback:", err);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "b4d0d7Ht63Eb4h7gkPxyvhiYStXQzGjZNfkxT5zmjaY=",
};
