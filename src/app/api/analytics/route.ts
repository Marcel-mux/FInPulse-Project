import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  AccountType,
  CashFlowDataPoint,
  CategoryBreakdownPoint,
  CreditFacilitySummary,
  CreditPlatformBreakdown,
  ExpenseTrendPoint,
  LiquidAccountDistribution,
  NetWorthSummary,
  RealWealthSummary,
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

    const { getAuthUserId } = await import("@/lib/userBootstrap");
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Ambil seluruh akun user beserta pinjaman paylater aktif untuk pemisahan Saldo Aktual vs Kredit
    const allAccounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        paylaterLoans: {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            dueDay: true,
            remainingMonths: true,
            monthlyTotal: true,
            monthlyPrincipal: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const actualAccounts = allAccounts.filter(
      (a) => a.accountCategory !== "PAYLATER" && a.type !== "credit"
    );
    const paylaterAccounts = allAccounts.filter(
      (a) => a.accountCategory === "PAYLATER" || a.type === "credit"
    );

    // Hitung Saldo Likuid Riil (Actual Liquid Balance)
    const totalActualBalance = actualAccounts.reduce((sum, a) => sum + a.balance, 0);

    const PRESET_ACC_COLORS = [
      "#10B981",
      "#3B82F6",
      "#06B6D4",
      "#6366F1",
      "#8B5CF6",
      "#F59E0B",
      "#EC4899",
      "#14B8A6",
    ];

    const accountsDistribution: LiquidAccountDistribution[] = actualAccounts.map((a, idx) => ({
      id: a.id,
      name: a.name,
      type: a.type as AccountType,
      balance: a.balance,
      colorHex: a.colorHex || PRESET_ACC_COLORS[idx % PRESET_ACC_COLORS.length],
      icon: a.icon,
      percentage:
        totalActualBalance > 0
          ? Math.round((a.balance / totalActualBalance) * 100 * 10) / 10
          : 0,
    }));

    // Hitung Fasilitas Kredit / Paylater
    let totalCreditLimit = 0;
    let totalRemainingCredit = 0;

    const platforms: CreditPlatformBreakdown[] = paylaterAccounts.map((p) => {
      const limit = p.creditLimit || 0;
      const remaining = p.balance;
      const used = Math.max(0, limit - remaining);
      const utilization =
        limit > 0 ? Math.round((used / limit) * 100 * 10) / 10 : 0;
      totalCreditLimit += limit;
      totalRemainingCredit += remaining;

      const activeLoan = p.paylaterLoans[0];
      const dueDay = activeLoan?.dueDay || 1;

      return {
        id: p.id,
        name: p.name,
        creditLimit: limit,
        remainingCredit: remaining,
        usedCredit: used,
        utilizationRate: utilization,
        dueDay,
        colorHex: p.colorHex || "#F97316",
        icon: p.icon,
        activeLoanCount: p.paylaterLoans.length,
      };
    });

    const totalUsedCredit = Math.max(0, totalCreditLimit - totalRemainingCredit);
    const creditUtilization =
      totalCreditLimit > 0
        ? Math.round((totalUsedCredit / totalCreditLimit) * 100 * 10) / 10
        : 0;

    const creditFacility: CreditFacilitySummary = {
      totalCreditLimit,
      totalRemainingCredit,
      totalUsedCredit,
      creditUtilization,
      platforms,
    };

    // Hitung Kekayaan Bersih (Net Worth) Transparan
    const netWorth = totalActualBalance - totalUsedCredit;
    const netWorthSummary: NetWorthSummary = {
      totalActualBalance,
      totalUsedCredit,
      netWorth,
      formula: "Kekayaan Bersih = Total Saldo Aktual - Total Limit Terpakai (Utang Paylater & Pokok Pinjaman Aktif)",
    };

    // 2. Ambil transaksi dalam rentang tanggal
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
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
            accountCategory: true,
            colorHex: true,
            icon: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            accountCategory: true,
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

    // Filter transaksi rekening riil/likuid (agar arus kas & pengeluaran tidak tercampur mutasi kredit internal)
    const realTransactions = transactions.filter(
      (tx) => tx.account.accountCategory !== "PAYLATER" && tx.account.type !== "credit"
    );

    // 3. Hitung Ringkasan KPI Arus Kas Riil
    let totalRealIncome = 0;
    let totalRealExpense = 0;

    for (const tx of realTransactions) {
      if (tx.type === "income") totalRealIncome += tx.amount;
      if (tx.type === "expense") totalRealExpense += tx.amount;
    }

    const netCashFlow = totalRealIncome - totalRealExpense;
    const savingsRate =
      totalRealIncome > 0
        ? Math.round(((totalRealIncome - totalRealExpense) / totalRealIncome) * 100 * 10) / 10
        : 0;

    const realWealth: RealWealthSummary = {
      totalActualBalance,
      totalRealIncome,
      totalRealExpense,
      netCashFlow,
      savingsRate,
      transactionCount: realTransactions.length,
      accountsDistribution,
    };

    // 4. Agregasi Cash Flow In vs Out (Group by date) dari transaksi riil
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

    for (const tx of realTransactions) {
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

    // 5. Agregasi Category Breakdown (Donut Chart) dari transaksi riil
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

    for (const tx of realTransactions) {
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
          totalRealExpense > 0
            ? Math.round((data.value / totalRealExpense) * 100 * 10) / 10
            : 0,
        icon: data.icon,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);

    // 6. Agregasi Expense Trend (Area Chart)
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
        totalIncome: totalRealIncome,
        totalExpense: totalRealExpense,
        netCashFlow,
        savingsRate,
        transactionCount: realTransactions.length,
      },
      realWealth,
      creditFacility,
      netWorth: netWorthSummary,
      cashFlow,
      categoryBreakdown,
      expenseTrend,
      transactions: realTransactions.map((t) => ({
        ...t,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error: unknown) {
    console.error("Error generating analytics:", error);
    const msg = error instanceof Error ? error.message : "Gagal memproses data analitik keuangan";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
