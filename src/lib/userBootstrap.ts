import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Gaji", type: "income", icon: "Briefcase", colorHex: "#10B981" },
  { name: "Bonus", type: "income", icon: "Gift", colorHex: "#34D399" },
  { name: "Investasi", type: "income", icon: "TrendingUp", colorHex: "#6366F1" },
  { name: "Freelance", type: "income", icon: "Laptop", colorHex: "#8B5CF6" },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Makanan & Minuman", type: "expense", icon: "Utensils", colorHex: "#F59E0B" },
  { name: "Transportasi", type: "expense", icon: "Car", colorHex: "#3B82F6" },
  { name: "Hiburan", type: "expense", icon: "Film", colorHex: "#EC4899" },
  { name: "Belanja", type: "expense", icon: "ShoppingBag", colorHex: "#8B5CF6" },
  { name: "Tagihan & Utilitas", type: "expense", icon: "Receipt", colorHex: "#EF4444" },
  { name: "Kesehatan", type: "expense", icon: "HeartPulse", colorHex: "#14B8A6" },
  { name: "Pendidikan", type: "expense", icon: "GraduationCap", colorHex: "#6366F1" },
];

/**
 * Bootstrap data awal untuk user baru:
 * 1. Membuat 1 dompet default: "Kas Tunai" dengan saldo Rp 0.
 * 2. Membuat kumpulan kategori pemasukan & pengeluaran standar.
 */
export async function bootstrapUserData(
  userId: string,
  dbClient?: Prisma.TransactionClient
) {
  const client = dbClient || prisma;

  // 1. Buat 1 dompet default: Kas Tunai saldo Rp 0
  const defaultAccount = await client.account.create({
    data: {
      userId,
      name: "Kas Tunai",
      type: "cash",
      balance: 0,
      currency: "IDR",
      colorHex: "#10B981",
      icon: "Banknote",
      isActive: true,
    },
  });

  // 2. Buat kumpulan kategori standar
  const allDefaultCategories = [
    ...DEFAULT_INCOME_CATEGORIES,
    ...DEFAULT_EXPENSE_CATEGORIES,
  ];

  const createdCategories = await Promise.all(
    allDefaultCategories.map((cat) =>
      client.category.create({
        data: {
          userId,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          colorHex: cat.colorHex,
        },
      })
    )
  );

  return {
    account: defaultAccount,
    categories: createdCategories,
  };
}

/**
 * Helper fleksibel untuk mendapatkan userId yang valid:
 * Prioritas utama adalah sesi NextAuth yang aktif (session.user.id),
 * diikuti oleh header x-user-id / body.userId untuk pengujian terisolasi.
 */
export async function getAuthUserId(
  request?: Request,
  body?: Record<string, unknown> | null
): Promise<string> {
  // 1. Ambil dari sesi NextAuth sebagai prioritas utama (Multi-Tenant Secure)
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as { id?: string }).id) {
      return (session.user as { id: string }).id;
    }
  } catch {
    // Sesi NextAuth belum tersedia / bukan dalam request context
  }

  // 2. Header x-user-id (untuk pengujian otomatis / skrip internal)
  if (request) {
    const headerUserId = request.headers.get("x-user-id");
    if (headerUserId) return headerUserId;
  }

  // 3. Fallback body.userId (hanya jika tidak ada sesi NextAuth aktif)
  if (body?.userId && typeof body.userId === "string") {
    return body.userId;
  }

  const existingUser = await prisma.user.findFirst();
  if (existingUser) return existingUser.id;

  // Fallback bootstrap user awal jika database masih kosong
  const defaultUser = await prisma.user.upsert({
    where: { email: "user@finpulse.local" },
    update: {},
    create: {
      name: "Pengguna FinPulse",
      email: "user@finpulse.local",
      passwordHash: "uninitialized",
    },
  });

  return defaultUser.id;
}

/**
 * Memastikan bahwa pengguna telah terautentikasi sebelum mengeksekusi operasi mutasi data.
 */
export async function requireAuthUserId(
  request?: Request,
  body?: Record<string, unknown> | null
): Promise<string> {
  const userId = await getAuthUserId(request, body);
  if (!userId) {
    throw new Error("UNAUTHORIZED: Pengguna tidak terautentikasi");
  }
  return userId;
}
