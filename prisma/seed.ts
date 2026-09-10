import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding database FinPulse...");

  // Bersihkan data lama jika ada
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();

  // 1. Seed Akun Dummy
  const accounts = [
    {
      name: "BCA",
      type: "bank",
      balance: 15_000_000,
      currency: "IDR",
      colorHex: "#0060AF",
      icon: "Landmark",
      isActive: true,
    },
    {
      name: "Cash",
      type: "cash",
      balance: 1_500_000,
      currency: "IDR",
      colorHex: "#10B981",
      icon: "Banknote",
      isActive: true,
    },
    {
      name: "GoPay",
      type: "ewallet",
      balance: 750_000,
      currency: "IDR",
      colorHex: "#00AED6",
      icon: "Wallet",
      isActive: true,
    },
  ];

  for (const acc of accounts) {
    await prisma.account.create({
      data: acc,
    });
  }
  console.log(`✅ Berhasil membuat ${accounts.length} akun.`);

  // 2. Seed Kategori Default
  const incomeCategories = [
    { name: "Gaji", type: "income", icon: "Briefcase", colorHex: "#10B981" },
    { name: "Bonus", type: "income", icon: "Gift", colorHex: "#34D399" },
    { name: "Investasi", type: "income", icon: "TrendingUp", colorHex: "#6366F1" },
    { name: "Freelance", type: "income", icon: "Laptop", colorHex: "#8B5CF6" },
  ];

  const expenseCategories = [
    { name: "Makanan & Minuman", type: "expense", icon: "Utensils", colorHex: "#F59E0B" },
    { name: "Transportasi", type: "expense", icon: "Car", colorHex: "#3B82F6" },
    { name: "Hiburan", type: "expense", icon: "Film", colorHex: "#EC4899" },
    { name: "Belanja", type: "expense", icon: "ShoppingBag", colorHex: "#8B5CF6" },
    { name: "Tagihan & Utilitas", type: "expense", icon: "Receipt", colorHex: "#EF4444" },
    { name: "Kesehatan", type: "expense", icon: "HeartPulse", colorHex: "#14B8A6" },
    { name: "Pendidikan", type: "expense", icon: "GraduationCap", colorHex: "#6366F1" },
  ];

  const allCategories = [...incomeCategories, ...expenseCategories];

  for (const cat of allCategories) {
    await prisma.category.create({
      data: cat,
    });
  }
  console.log(`✅ Berhasil membuat ${allCategories.length} kategori.`);

  console.log("✨ Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
