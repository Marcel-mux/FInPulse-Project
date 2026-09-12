import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function sanitize(val?: string): string {
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

function resolveDatabaseUrl(): string {
  const candidates = [
    sanitize(process.env.TURSO_DATABASE_URL),
    sanitize(process.env.DATABASE_URL),
    sanitize(process.env.DATABASE_URT),
  ];

  // Prioritaskan koneksi Turso remote (libsql:// atau https:// atau host turso.io)
  for (const c of candidates) {
    if (
      c &&
      (c.startsWith("libsql://") ||
        c.startsWith("https://") ||
        c.includes("turso.io"))
    ) {
      return c;
    }
  }

  // Fallback ke candidate yang ada (misal SQLite file:./dev.db)
  for (const c of candidates) {
    if (c) return c;
  }

  return "file:./dev.db";
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = resolveDatabaseUrl();
  const authToken = sanitize(process.env.TURSO_AUTH_TOKEN);

  // Jika koneksi ke Turso Cloud via libSQL
  if (
    tursoUrl &&
    (tursoUrl.startsWith("libsql://") ||
      tursoUrl.startsWith("https://") ||
      tursoUrl.includes("turso.io"))
  ) {
    console.log("[PRISMA] Menghubungkan ke Turso Cloud:", tursoUrl);
    const client = createClient({
      url: tursoUrl,
      authToken: authToken || undefined,
    });
    const adapter = new PrismaLibSQL(client);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
  }

  // Fallback SQLite lokal (file:./dev.db) saat pengujian lokal
  if (tursoUrl && tursoUrl.startsWith("file:")) {
    try {
      const client = createClient({ url: tursoUrl });
      const adapter = new PrismaLibSQL(client);
      return new PrismaClient({ adapter });
    } catch {
      return new PrismaClient();
    }
  }

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

// Singleton Prisma Client instance agar tidak membuka koneksi baru berulang kali di serverless
export const prisma = globalForPrisma.prisma || createPrismaClient();

// Simpan di globalThis untuk mencegah duplikasi koneksi di serverless container reuse
globalForPrisma.prisma = prisma;
