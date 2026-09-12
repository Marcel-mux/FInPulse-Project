import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Mengosongkan seluruh data lama FinPulse ke kondisi awal (raw)...");

  // Bersihkan data lama
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("✨ Database berhasil direset dan bersih 100% (semua saldo 0, tidak ada dummy).");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat reset database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
