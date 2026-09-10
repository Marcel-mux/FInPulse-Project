import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CashFlowDataPoint,
  CategoryBreakdownPoint,
  ExpenseTrendPoint,
  TimeRange,
} from "@/types";

export const dynamic = "force-dynamic";

function toLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") || "30d") as TimeRange;
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (range) {
      case "7d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "3m":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 2);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case "custom":
        startDate = customStart ? new Date(customStart) : new Date(now.getTime() - 29 * 86400000);
        startDate.setHours(0, 0, 0, 0);
        if (customEnd) {
          endDate = new Date(customEnd);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        startDate = new Date(now.getTime() - 29 * 86400000);
        startDate.setHours(0, 0, 0, 0);
    }

    // Ambil transaksi dalam rentang tanggal
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            colorHex: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // 1. Hitung Ringkasan KPI
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === "income") totalIncome += tx.amount;
      if (tx.type === "expense") totalExpense += tx.amount;
    }

    const netCashFlow = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100 * 10) / 10 : 0;

    // 2. Agregasi Cash Flow In vs Out (Group by date)
    // Buat map tanggal
    const cashFlowMap = new Map<string, { income: number; expense: number; label: string }>();

    // Buat timeline kontinu jika range 7d atau 30d
    if (range === "7d" || range === "30d") {
      const iterDate = new Date(startDate);
      while (iterDate <= endDate) {
        const key = toLocalDateKey(iterDate);
        const label = iterDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        cashFlowMap.set(key, { income: 0, expense: 0, label });
        iterDate.setDate(iterDate.getDate() + 1);
      }
    }

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const key = toLocalDateKey(txDate);
      const label = txDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      if (!cashFlowMap.has(key)) {
        cashFlowMap.set(key, { income: 0, expense: 0, label });
      }

      const entry = cashFlowMap.get(key)!;
      if (tx.type === "income") {
        entry.income += tx.amount;
      } else if (tx.type === "expense") {
        entry.expense += tx.amount;
      }
    }

    // Urutkan data poin secara kronologis
    const sortedKeys = Array.from(cashFlowMap.keys()).sort();
    const cashFlow: CashFlowDataPoint[] = sortedKeys.map((key) => {
      const val = cashFlowMap.get(key)!;
      return {
        date: key,
        label: val.label,
        income: val.income,
        expense: val.expense,
        net: val.income - val.expense,
      };
    });

    // 3. Agregasi Category Breakdown (untuk Donut Chart)
    const categoryMap = new Map<
      string,
      { name: string; color: string; value: number; icon: string | null; count: number }
    >();

    const PRESET_COLORS = [
      "#F59E0B",
      "#3B82F6",
      "#EC4899",
      "#8B5CF6",
      "#EF4444",
      "#14B8A6",
      "#6366F1",
      "#10B981",
      "#06B6D4",
    ];

    let colorIdx = 0;

    for (const tx of transactions) {
      if (tx.type === "expense") {
        const catId = tx.categoryId || "uncategorized";
        const catName = tx.category?.name || "Tanpa Kategori";
        const catColor =
          tx.category?.colorHex || PRESET_COLORS[colorIdx % PRESET_COLORS.length];
        const catIcon = tx.category?.icon || null;

        if (!categoryMap.has(catId)) {
          colorIdx++;
          categoryMap.set(catId, {
            name: catName,
            color: catColor,
            value: 0,
            icon: catIcon,
            count: 0,
          });
        }

        const catData = categoryMap.get(catId)!;
        catData.value += tx.amount;
        catData.count += 1;
      }
    }

    const categoryBreakdown: CategoryBreakdownPoint[] = Array.from(categoryMap.entries())
      .map(([catId, data]) => ({
        categoryId: catId,
        name: data.name,
        color: data.color,
        value: data.value,
        percentage:
          totalExpense > 0 ? Math.round((data.value / totalExpense) * 100 * 10) / 10 : 0,
        icon: data.icon,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);

    // 4. Agregasi Expense Trend (Area Chart)
    const expenseTrend: ExpenseTrendPoint[] = cashFlow.map((cf) => ({
      date: cf.date,
      label: cf.label,
      amount: cf.expense,
    }));

    return NextResponse.json({
      timeRange: range,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalIncome,
        totalExpense,
        netCashFlow,
        savingsRate,
        transactionCount: transactions.length,
      },
      cashFlow,
      categoryBreakdown,
      expenseTrend,
      transactions: transactions.map((t) => ({
        ...t,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    return NextResponse.json(
      { error: "Gagal memproses data analitik keuangan" },
      { status: 500 }
    );
  }
}
