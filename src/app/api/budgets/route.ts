import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(
      searchParams.get("month") || String(now.getMonth() + 1),
      10
    );
    const year = parseInt(
      searchParams.get("year") || String(now.getFullYear()),
      10
    );

    const budgets = await prisma.budget.findMany({
      where: {
        periodMonth: month,
        periodYear: year,
      },
      include: {
        category: true,
      },
      orderBy: {
        amountLimit: "desc",
      },
    });

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() + 1 === month;
    const elapsedDays = isCurrentMonth ? Math.max(1, now.getDate()) : totalDaysInMonth;
    const daysLeftInMonth = isCurrentMonth
      ? Math.max(0, totalDaysInMonth - now.getDate())
      : 0;

    // Ambil pengeluaran transaksi bulan ini per kategori
    const processedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const expenseAgg = await prisma.transaction.aggregate({
          where: {
            type: "expense",
            categoryId: b.categoryId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalSpent = expenseAgg._sum.amount || 0;
        const remaining = Math.max(0, b.amountLimit - totalSpent);
        const percentage =
          b.amountLimit > 0
            ? Math.round((totalSpent / b.amountLimit) * 100 * 10) / 10
            : 0;

        // Hitung laju pembakaran harian (Daily Burn Rate)
        const dailyBurnRate = Math.round(totalSpent / elapsedDays);

        // Proyeksi sisa hari sampai bujet habis
        let estimatedDaysRemaining: number | null = null;
        if (totalSpent > 0 && dailyBurnRate > 0) {
          if (b.amountLimit <= totalSpent) {
            estimatedDaysRemaining = 0;
          } else {
            estimatedDaysRemaining = Math.floor((b.amountLimit - totalSpent) / dailyBurnRate);
          }
        }

        // Peringatan dini jika sisa hari bujet lebih sedikit dari sisa hari di bulan ini
        const isWarning =
          estimatedDaysRemaining !== null &&
          estimatedDaysRemaining < daysLeftInMonth &&
          percentage < 100;

        const isExceeded = percentage >= 100;

        return {
          ...b,
          totalSpent,
          remaining,
          percentage,
          dailyBurnRate,
          estimatedDaysRemaining,
          isWarning,
          isExceeded,
        };
      })
    );

    const totalLimit = processedBudgets.reduce(
      (sum, b) => sum + b.amountLimit,
      0
    );
    const totalSpent = processedBudgets.reduce(
      (sum, b) => sum + b.totalSpent,
      0
    );
    const totalRemaining = Math.max(0, totalLimit - totalSpent);
    const overallPercentage =
      totalLimit > 0
        ? Math.round((totalSpent / totalLimit) * 100 * 10) / 10
        : 0;

    return NextResponse.json({
      budgets: processedBudgets,
      totalLimit,
      totalSpent,
      totalRemaining,
      overallPercentage,
      periodMonth: month,
      periodYear: year,
    });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data anggaran" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, amountLimit, periodMonth, periodYear } = body;

    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { error: "Kategori wajib dipilih" },
        { status: 400 }
      );
    }

    const parsedLimit =
      typeof amountLimit === "number"
        ? amountLimit
        : parseFloat(amountLimit);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return NextResponse.json(
        { error: "Limit bujet harus berupa angka lebih besar dari 0" },
        { status: 400 }
      );
    }

    const now = new Date();
    const month = periodMonth ? parseInt(periodMonth, 10) : now.getMonth() + 1;
    const year = periodYear ? parseInt(periodYear, 10) : now.getFullYear();

    // Cek apakah kategori valid
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    // Upsert budget: update jika sudah ada di bulan/tahun tsb, atau buat baru
    const existingBudget = await prisma.budget.findFirst({
      where: {
        categoryId,
        periodMonth: month,
        periodYear: year,
      },
    });

    let budget;
    if (existingBudget) {
      budget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: {
          amountLimit: parsedLimit,
        },
        include: {
          category: true,
        },
      });
    } else {
      budget = await prisma.budget.create({
        data: {
          userId: category.userId,
          categoryId,
          amountLimit: parsedLimit,
          periodMonth: month,
          periodYear: year,
        },
        include: {
          category: true,
        },
      });
    }

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating budget:", error);
    return NextResponse.json(
      { error: "Gagal mengatur anggaran" },
      { status: 500 }
    );
  }
}
