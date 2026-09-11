import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    (process.env.DATABASE_URL?.startsWith("libsql://") || process.env.DATABASE_URL?.startsWith("https://")
      ? process.env.DATABASE_URL
      : undefined) ||
    process.env.DATABASE_URT;

  const authToken = process.env.TURSO_AUTH_TOKEN;
  const rawUrl = tursoUrl || process.env.DATABASE_URL || "";

  // Hubungkan ke Turso via libSQL jika protokol libsql://, https://, atau ada TURSO_AUTH_TOKEN
  const isLibSql =
    rawUrl.startsWith("libsql://") ||
    rawUrl.startsWith("https://") ||
    Boolean(authToken && !rawUrl.startsWith("file:"));

  if (isLibSql && rawUrl) {
    const libsql = createClient({
      url: rawUrl,
      authToken: authToken,
    });
    const adapter = new PrismaLibSQL(libsql);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
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
