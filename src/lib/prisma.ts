import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function cleanEnv(val: string | undefined): string {
  if (!val) return "";
  let clean = val.trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

function resolveTursoUrl(): string {
  const candidates = [
    cleanEnv(process.env.TURSO_DATABASE_URL),
    cleanEnv(process.env.DATABASE_URL),
    cleanEnv(process.env.DATABASE_URT),
  ];

  for (const candidate of candidates) {
    if (!candidate || candidate.startsWith("file:")) continue;

    if (
      candidate.startsWith("libsql://") ||
      candidate.startsWith("https://") ||
      candidate.startsWith("http://") ||
      candidate.startsWith("wss://") ||
      candidate.startsWith("ws://")
    ) {
      return candidate;
    }

    if (candidate.includes("turso.io")) {
      return `libsql://${candidate}`;
    }
  }

  return "";
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = resolveTursoUrl();
  const authToken = cleanEnv(process.env.TURSO_AUTH_TOKEN);

  // Hubungkan ke Turso via libSQL jika tursoUrl valid
  if (tursoUrl) {
    try {
      const libsql = createClient({
        url: tursoUrl,
        authToken: authToken || undefined,
      });
      const adapter = new PrismaLibSQL(libsql);

      return new PrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
      });
    } catch (err) {
      console.warn("⚠️ Warning: Gagal menginisialisasi PrismaLibSQL adapter:", err);
    }
  }

  // Fallback SQLite lokal (file:./dev.db) saat pengujian lokal tanpa Turso
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
