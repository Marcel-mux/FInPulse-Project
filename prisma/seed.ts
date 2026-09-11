import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Memulai seeding database FinPulse...");

  // Bersihkan data lama
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();

  // 1. Seed Akun Dummy
  const createdBca = await prisma.account.create({
    data: {
      name: "BCA",
      type: "bank",
      balance: 15_000_000,
      currency: "IDR",
      colorHex: "#0060AF",
      icon: "Landmark",
      isActive: true,
    },
  });

  const createdCash = await prisma.account.create({
    data: {
      name: "Cash",
      type: "cash",
      balance: 1_500_000,
      currency: "IDR",
      colorHex: "#10B981",
      icon: "Banknote",
      isActive: true,
    },
  });

  const createdGopay = await prisma.account.create({
    data: {
      name: "GoPay",
      type: "ewallet",
      balance: 750_000,
      currency: "IDR",
      colorHex: "#00AED6",
      icon: "Wallet",
      isActive: true,
    },
  });

  console.log("✅ Berhasil membuat 3 akun: BCA, Cash, GoPay.");

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

  const categoryMap: Record<string, string> = {};

  for (const cat of [...incomeCategories, ...expenseCategories]) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.name] = created.id;
  }
  console.log("✅ Berhasil membuat 11 kategori.");

  // 3. Seed Sample Transaksi Realistis
  const now = new Date();
  const sampleTransactions = [
    {
      type: "income",
      amount: 15_000_000,
      date: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3 jam lalu
      accountId: createdBca.id,
      categoryId: categoryMap["Gaji"],
      description: "Gaji Bulanan PT Solusi Digital",
      tags: "#gaji #payroll",
    },
    {
      type: "expense",
      amount: 85_000,
      date: new Date(now.getTime() - 1000 * 60 * 120), // 2 jam lalu
      accountId: createdGopay.id,
      categoryId: categoryMap["Makanan & Minuman"],
      description: "Makan Siang & Es Kopi Susu",
      tags: "#lunch #kopi",
    },
    {
      type: "transfer",
      amount: 500_000,
      date: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 hari lalu
      accountId: createdBca.id,
      toAccountId: createdGopay.id,
      description: "Top Up Saldo E-Wallet",
      tags: "#topup #transfer",
    },
    {
      type: "expense",
      amount: 75_000,
      date: new Date(now.getTime() - 1000 * 60 * 60 * 36), // 1.5 hari lalu
      accountId: createdCash.id,
      categoryId: categoryMap["Transportasi"],
      description: "Bensin Motor & Parkir",
      tags: "#transport #bensin",
    },
    {
      type: "expense",
      amount: 249_000,
      date: new Date(now.getTime() - 1000 * 60 * 60 * 72), // 3 hari lalu
      accountId: createdBca.id,
      categoryId: categoryMap["Hiburan"],
      description: "Langganan Netflix & Spotify Family",
      tags: "#subscription #entertainment",
    },
    {
      type: "income",
      amount: 3_500_000,
      date: new Date(now.getTime() - 1000 * 60 * 60 * 120), // 5 hari lalu
      accountId: createdBca.id,
      categoryId: categoryMap["Freelance"],
      description: "Pembayaran Desain UI/UX FinPulse",
      tags: "#freelance #project",
    },
  ];

  for (const tx of sampleTransactions) {
    await prisma.transaction.create({ data: tx });
  }
  console.log(`✅ Berhasil membuat ${sampleTransactions.length} transaksi sample.`);

  // 4. Seed Sample Budgets untuk bulan ini
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await prisma.budget.create({
    data: {
      categoryId: categoryMap["Makanan & Minuman"],
      amountLimit: 2_500_000,
      periodMonth: currentMonth,
      periodYear: currentYear,
    },
  });

  await prisma.budget.create({
    data: {
      categoryId: categoryMap["Transportasi"],
      amountLimit: 1_000_000,
      periodMonth: currentMonth,
      periodYear: currentYear,
    },
  });
  console.log("✅ Berhasil membuat sample budgets.");

  console.log("✨ Seeding selesai dengan sempurna!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
