import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi Sesi Pengguna
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    // 2. Verifikasi Payload & Kata Kunci Konfirmasi ("reset")
    const body = await request.json().catch(() => ({}));
    if (
      !body ||
      typeof body.confirmation !== "string" ||
      body.confirmation.trim().toLowerCase() !== "reset"
    ) {
      return NextResponse.json(
        {
          error: "Kata kunci konfirmasi tidak cocok. Harap ketik 'reset' untuk melanjutkan.",
        },
        { status: 400 }
      );
    }

    const scope: "ALL" | "MONTHLY" | "DAILY" =
      body.scope === "DAILY" || body.scope === "MONTHLY" ? body.scope : "ALL";

    // =========================================================================
    // A. SCOPE === "ALL" (Total Reset Seluruh Data)
    // =========================================================================
    if (scope === "ALL") {
      const paylaterAccounts = await prisma.account.findMany({
        where: {
          userId,
          accountCategory: "PAYLATER",
        },
        select: {
          id: true,
          creditLimit: true,
        },
      });

      const paylaterRestorations = paylaterAccounts.map((account) =>
        prisma.account.update({
          where: { id: account.id },
          data: { balance: account.creditLimit ?? 0 },
        })
      );

      await prisma.$transaction([
        // 1. Hapus semua mutasi transaksi
        prisma.transaction.deleteMany({ where: { userId } }),
        // 2. Hapus catatan pinjaman / cicilan paylater
        prisma.loan.deleteMany({ where: { userId } }),
        // 3. Hapus tagihan berkala
        prisma.bill.deleteMany({ where: { userId } }),
        // 4. Hapus anggaran bulanan
        prisma.budget.deleteMany({ where: { userId } }),
        // 5. Nol-kan saldo seluruh rekening kas & bank reguler
        prisma.account.updateMany({
          where: {
            userId,
            accountCategory: { not: "PAYLATER" },
          },
          data: { balance: 0 },
        }),
        // 6. Pulihkan sisa limit paylater kembali sama dengan plafon creditLimit
        ...paylaterRestorations,
      ]);

      return NextResponse.json({
        success: true,
        scope: "ALL",
        message: "Seluruh data keuangan berhasil direset ke awal.",
        resetAt: new Date().toISOString(),
      });
    }

    // =========================================================================
    // B. SCOPE === "DAILY" (Reset Transaksi Harian)
    // =========================================================================
    if (scope === "DAILY") {
      // Default: Hari ini dalam zona WIB (UTC+7)
      const nowWib = new Date(Date.now() + 7 * 3600 * 1000);
      const defaultDateStr = nowWib.toISOString().slice(0, 10); // YYYY-MM-DD
      const targetDateStr =
        body.date && typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(body.date)
          ? body.date.slice(0, 10)
          : defaultDateStr;

      const [year, month, day] = targetDateStr.split("-").map(Number);

      // Rentang waktu hari tersebut dalam zona WIB (UTC+7)
      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 3600 * 1000);
      const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 3600 * 1000);

      // 1. Ambil transaksi pada rentang hari tersebut
      const targetTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      // 2. Hitung pengembalian mutasi saldo rekening
      const balanceReversals: Record<string, number> = {};
      for (const tx of targetTransactions) {
        if (tx.type === "expense") {
          balanceReversals[tx.accountId] = (balanceReversals[tx.accountId] || 0) + tx.amount;
        } else if (tx.type === "income") {
          balanceReversals[tx.accountId] = (balanceReversals[tx.accountId] || 0) - tx.amount;
        } else if (tx.type === "transfer") {
          balanceReversals[tx.accountId] = (balanceReversals[tx.accountId] || 0) + tx.amount;
          if (tx.toAccountId) {
            balanceReversals[tx.toAccountId] = (balanceReversals[tx.toAccountId] || 0) - tx.amount;
          }
        }
      }

      // 3. Eksekusi pemulihan saldo & penghapusan transaksi secara atomik
      await prisma.$transaction(async (tx) => {
        // Pulihkan saldo rekening terdampak
        for (const [accId, adjustment] of Object.entries(balanceReversals)) {
          if (adjustment !== 0) {
            await tx.account.update({
              where: { id: accId },
              data: {
                balance:
                  adjustment > 0
                    ? { increment: adjustment }
                    : { decrement: Math.abs(adjustment) },
              },
            });
          }
        }

        // Pastikan sisa limit Paylater tidak melebihi plafon creditLimit
        const paylaterAccounts = await tx.account.findMany({
          where: { userId, accountCategory: "PAYLATER" },
          select: { id: true, creditLimit: true, balance: true },
        });
        for (const p of paylaterAccounts) {
          if (p.creditLimit != null && p.balance > p.creditLimit) {
            await tx.account.update({
              where: { id: p.id },
              data: { balance: p.creditLimit },
            });
          }
        }

        // Hapus transaksi pada rentang hari tersebut
        await tx.transaction.deleteMany({
          where: {
            userId,
            date: { gte: startOfDay, lte: endOfDay },
          },
        });
      });

      return NextResponse.json({
        success: true,
        scope: "DAILY",
        date: targetDateStr,
        affectedCount: targetTransactions.length,
        message: `${targetTransactions.length} transaksi pada tanggal ${targetDateStr} berhasil direset dan saldo akun telah dipulihkan.`,
        resetAt: new Date().toISOString(),
      });
    }

    // =========================================================================
    // C. SCOPE === "MONTHLY" (Reset Transaksi & Anggaran Bulanan)
    // =========================================================================
    if (scope === "MONTHLY") {
      // Default: Bulan berjalan dalam zona WIB
      const nowWib = new Date(Date.now() + 7 * 3600 * 1000);
      const defaultMonthStr = nowWib.toISOString().slice(0, 7); // YYYY-MM
      const targetMonthStr =
        body.monthYear && typeof body.monthYear === "string" && /^\d{4}-\d{2}/.test(body.monthYear)
          ? body.monthYear.slice(0, 7)
          : defaultMonthStr;

      const [year, month] = targetMonthStr.split("-").map(Number);

      // Rentang waktu bulan tersebut dalam zona WIB (UTC+7)
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - 7 * 3600 * 1000);
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - 7 * 3600 * 1000);

      // 1. Ambil transaksi pada rentang bulan tersebut
      const targetTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });

      // 2. Hitung pengembalian mutasi saldo rekening
      const balanceReversals: Record<string, number> = {};
      for (const tx of targetTransactions) {
        if (tx.type === "expense") {
          balanceReversals[tx.accountId] = (balanceReversals[tx.accountId] || 0) + tx.amount;
        } else if (tx.type === "income") {
          balanceReversals[tx.accountId] = (balanceReversals[tx.accountId] || 0) - tx.amount;
        } else if (tx.type === "transfer") {
          balanceReversals[tx.accountId] = (balanceReversals[tx.accountId] || 0) + tx.amount;
          if (tx.toAccountId) {
            balanceReversals[tx.toAccountId] = (balanceReversals[tx.toAccountId] || 0) - tx.amount;
          }
        }
      }

      // 3. Eksekusi pemulihan saldo, hapus transaksi, dan hapus anggaran bulanan secara atomik
      await prisma.$transaction(async (tx) => {
        // Pulihkan saldo rekening terdampak
        for (const [accId, adjustment] of Object.entries(balanceReversals)) {
          if (adjustment !== 0) {
            await tx.account.update({
              where: { id: accId },
              data: {
                balance:
                  adjustment > 0
                    ? { increment: adjustment }
                    : { decrement: Math.abs(adjustment) },
              },
            });
          }
        }

        // Pastikan sisa limit Paylater tidak melebihi plafon creditLimit
        const paylaterAccounts = await tx.account.findMany({
          where: { userId, accountCategory: "PAYLATER" },
          select: { id: true, creditLimit: true, balance: true },
        });
        for (const p of paylaterAccounts) {
          if (p.creditLimit != null && p.balance > p.creditLimit) {
            await tx.account.update({
              where: { id: p.id },
              data: { balance: p.creditLimit },
            });
          }
        }

        // Hapus transaksi pada rentang bulan tersebut
        await tx.transaction.deleteMany({
          where: {
            userId,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        });

        // Reset / hapus catatan Budget untuk bulan tersebut
        await tx.budget.deleteMany({
          where: {
            userId,
            periodMonth: month,
            periodYear: year,
          },
        });
      });

      return NextResponse.json({
        success: true,
        scope: "MONTHLY",
        monthYear: targetMonthStr,
        affectedCount: targetTransactions.length,
        message: `${targetTransactions.length} transaksi dan anggaran bulan ${targetMonthStr} berhasil direset dan saldo akun telah dipulihkan.`,
        resetAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: "Scope reset tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("[RESET-DATA] Error saat mereset data keuangan:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat mereset data." },
      { status: 500 }
    );
  }
}
