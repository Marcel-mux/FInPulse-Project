import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { bootstrapUserData } from "@/lib/userBootstrap";
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) {
            console.warn("[AUTH-GOOGLE] Gagal login: Email Google tidak ditemukan");
            return false;
          }

          const normalizedEmail = user.email.toLowerCase().trim();
          console.log(`[AUTH-GOOGLE] Memeriksa akun di database untuk: ${normalizedEmail}`);

          let dbUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!dbUser) {
            console.log(`[AUTH-GOOGLE] Pengguna pertama kali login via Google. Mendaftarkan ke database...`);
            dbUser = await prisma.user.create({
              data: {
                name: user.name || "Pengguna FinPulse",
                email: normalizedEmail,
                passwordHash: "OAUTH_GOOGLE",
              },
            });
            console.log(`[AUTH-GOOGLE] Pengguna baru berhasil dibuat dengan ID: ${dbUser.id}`);

            // Inisialisasi Kas Tunai dan kategori default
            try {
              await bootstrapUserData(dbUser.id);
              console.log(`[AUTH-GOOGLE] Inisialisasi dompet Kas Tunai & kategori standar berhasil untuk user ${dbUser.id}`);
            } catch (bootErr) {
              console.error("[AUTH-GOOGLE] Gagal bootstrap data user:", bootErr);
            }
          } else {
            console.log(`[AUTH-GOOGLE] Akun sudah terdaftar (ID: ${dbUser.id}). Menautkan login Google.`);
          }

          // Mutasikan user.id agar callback jwt dan session langsung menerima ID user Prisma
          user.id = dbUser.id;
          return true;
        } catch (error) {
          console.error("[AUTH-GOOGLE] Terjadi error saat signIn callback:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      try {
        if (user) {
          token.id = user.id;
        }

        // Pastikan token.id selalu mengambil user.id dari database Prisma
        if (token.email && (!token.id || account?.provider === "google")) {
          const dbUser = await prisma.user.findUnique({
            where: { email: (token.email as string).toLowerCase().trim() },
            select: { id: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
          }
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
