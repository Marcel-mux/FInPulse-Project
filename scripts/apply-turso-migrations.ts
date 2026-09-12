import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";

// Baca file .env jika ada (karena tsx tidak otomatis memuat .env)
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

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

// Baca environment variables
const rawTursoUrl =
  cleanEnv(process.env.TURSO_DATABASE_URL) ||
  (cleanEnv(process.env.DATABASE_URL)?.startsWith("libsql://") || cleanEnv(process.env.DATABASE_URL)?.startsWith("https://")
    ? cleanEnv(process.env.DATABASE_URL)
    : undefined) ||
  cleanEnv(process.env.DATABASE_URT);

const authToken = cleanEnv(process.env.TURSO_AUTH_TOKEN);

async function applyMigrations() {
  console.log("====================================================");
  console.log("🚀 Menjalankan Migrasi Skema ke Database Cloud Turso");
  console.log("====================================================\n");

  if (!rawTursoUrl || !authToken) {
    console.error("❌ Error: Kredensial Turso tidak ditemukan di file .env!");
    console.error("Pastikan variabel berikut terisi:");
    console.error("  - DATABASE_URL atau TURSO_DATABASE_URL (contoh: libsql://your-db-name.turso.io)");
    console.error("  - TURSO_AUTH_TOKEN (token JWT dari Turso)");
    process.exit(1);
  }

  console.log(`📡 Menghubungkan ke Turso di: ${rawTursoUrl}`);
  const client = createClient({
    url: rawTursoUrl,
    authToken: authToken,
  });

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Direktori migrasi tidak ditemukan di: ${migrationsDir}`);
    process.exit(1);
  }

  // Buat tabel _prisma_migrations jika belum ada
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY,
      "migration_name" TEXT NOT NULL,
      "finished_at" DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedResult = await client.execute(
    "SELECT migration_name FROM _prisma_migrations;"
  );
  const appliedMigrations = new Set(appliedResult.rows.map((row) => row[0]));

  // Jika tabel accounts sudah ada di database dari sebelum ada _prisma_migrations,
  // tandai 20260910152108_init agar tidak diulang
  const existingAccountsTable = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='accounts';"
  );
  if (existingAccountsTable.rows.length > 0 && !appliedMigrations.has("20260910152108_init")) {
    await client.execute({
      sql: "INSERT INTO _prisma_migrations (id, migration_name) VALUES (?, ?)",
      args: [Date.now().toString(), "20260910152108_init"],
    });
    appliedMigrations.add("20260910152108_init");
  }

  // Cari semua folder migrasi dan urutkan berdasarkan nama (timestamp)
  const migrationFolders = fs
    .readdirSync(migrationsDir)
    .filter((file) => fs.statSync(path.join(migrationsDir, file)).isDirectory())
    .sort();

  console.log(`📁 Ditemukan ${migrationFolders.length} folder migrasi Prisma.\n`);

  for (const folder of migrationFolders) {
    const migrationFilePath = path.join(migrationsDir, folder, "migration.sql");
    if (!fs.existsSync(migrationFilePath)) continue;

    if (appliedMigrations.has(folder)) {
      console.log(`⏭️  Melewati migrasi (sudah diterapkan): ${folder}`);
      continue;
    }

    console.log(`⏳ Menerapkan migrasi: ${folder}...`);
    const sql = fs.readFileSync(migrationFilePath, "utf-8");

    try {
      await client.executeMultiple(sql);
      await client.execute({
        sql: "INSERT INTO _prisma_migrations (id, migration_name) VALUES (?, ?)",
        args: [Date.now().toString(), folder],
      });
      console.log(`✅ Berhasil menerapkan: ${folder}`);
    } catch (err: any) {
      console.error(`❌ Gagal menerapkan migrasi ${folder}:`, err.message);
      process.exit(1);
    }
  }

  // Verifikasi tabel yang berhasil dibuat
  console.log("\n🔍 Memverifikasi tabel di database Turso...");
  const tablesResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
  );

  const tableNames = tablesResult.rows.map((row) => row[0]);
  console.log("📋 Tabel terdaftar di Turso:", tableNames.join(", "));

  console.log("\n🎉 Seluruh migrasi Prisma berhasil diterapkan ke database Turso!");
}

applyMigrations().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
