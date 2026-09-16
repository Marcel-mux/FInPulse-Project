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
    // B. SCOPE === "DAILY" (Reset Total Aktivitas Harian)
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

      // Rentang waktu presisi hari tersebut dalam zona WIB (UTC+7): 00:00:00.000 s/d 23:59:59.999
      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 3600 * 1000);
      const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 3600 * 1000);

      const displayDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

      const { affectedTxCount, affectedLoansCount, deletedBillsCount, resetBillsCount } =
        await prisma.$transaction(async (tx) => {
          // 1. Ambil transaksi pada rentang hari tersebut (berdasarkan tanggal transaksi atau createdAt)
          const targetTransactions = await tx.transaction.findMany({
            where: {
              userId,
              OR: [
                { date: { gte: startOfDay, lte: endOfDay } },
                { createdAt: { gte: startOfDay, lte: endOfDay } },
              ],
            },
          });

          // 2. Hitung pengembalian mutasi saldo rekening kas & paylater dari transaksi
          const balanceReversals: Record<string, number> = {};
          for (const t of targetTransactions) {
            if (t.type === "expense") {
              balanceReversals[t.accountId] = (balanceReversals[t.accountId] || 0) + t.amount;
            } else if (t.type === "income") {
              balanceReversals[t.accountId] = (balanceReversals[t.accountId] || 0) - t.amount;
            } else if (t.type === "transfer") {
              balanceReversals[t.accountId] = (balanceReversals[t.accountId] || 0) + t.amount;
              if (t.toAccountId) {
                balanceReversals[t.toAccountId] = (balanceReversals[t.toAccountId] || 0) - t.amount;
              }
            }
          }

          // 3. Pinjaman & Cicilan Paylater (Loan):
          // Cari pinjaman yang dibuat pada rentang hari tersebut
          const targetLoans = await tx.loan.findMany({
            where: {
              userId,
              createdAt: { gte: startOfDay, lte: endOfDay },
            },
          });

          for (const loan of targetLoans) {
            if (loan.disbursementAccountId) {
              // Mode Kredit Pinjaman Tunai:
              // a. Pulihkan kembali limit paylater/kredit penyedia
              balanceReversals[loan.paylaterAccountId] =
                (balanceReversals[loan.paylaterAccountId] || 0) + loan.totalAmount;

              // b. Tarik kembali saldo pencairan dari rekening tujuan (jika belum tercakup transaksi income)
              const hasIncomeTx = targetTransactions.some(
                (t) =>
                  t.type === "income" &&
                  t.accountId === loan.disbursementAccountId &&
                  Math.abs(t.amount - loan.totalAmount) < 0.01
              );
              if (!hasIncomeTx) {
                balanceReversals[loan.disbursementAccountId] =
                  (balanceReversals[loan.disbursementAccountId] || 0) - loan.totalAmount;
              }
            } else {
              // Mode Cicilan Belanja Paylater / Autodebet Tagihan:
              // Pulihkan sisa limit paylater jika belum tercakup transaksi expense
              const hasExpenseTx = targetTransactions.some(
                (t) =>
                  t.type === "expense" &&
                  t.accountId === loan.paylaterAccountId &&
                  Math.abs(t.amount - loan.totalAmount) < 0.01
              );
              if (!hasExpenseTx) {
                balanceReversals[loan.paylaterAccountId] =
                  (balanceReversals[loan.paylaterAccountId] || 0) + loan.totalAmount;
              }
            }
          }

          // Hapus entri Loan yang dibuat pada hari tersebut
          if (targetLoans.length > 0) {
            await tx.loan.deleteMany({
              where: {
                id: { in: targetLoans.map((l) => l.id) },
              },
            });
          }

          // 4. Tagihan & Autodebet (Bill):
          // a. Tagihan yang baru dibuat di hari tersebut -> hapus entri Bill
          const newBills = await tx.bill.findMany({
            where: {
              userId,
              createdAt: { gte: startOfDay, lte: endOfDay },
            },
            select: { id: true },
          });

          if (newBills.length > 0) {
            await tx.bill.deleteMany({
              where: {
                id: { in: newBills.map((b) => b.id) },
              },
            });
          }

          // b. Tagihan lama yang dieksekusi/dibayar pada hari tersebut -> ubah kembali status menjadi UNPAID / PENDING (lastDeducted = null)
          const oldExecutedBills = await tx.bill.findMany({
            where: {
              userId,
              createdAt: { lt: startOfDay },
              lastDeducted: { gte: startOfDay, lte: endOfDay },
            },
            select: { id: true },
          });

          if (oldExecutedBills.length > 0) {
            await tx.bill.updateMany({
              where: {
                id: { in: oldExecutedBills.map((b) => b.id) },
              },
              data: {
                lastDeducted: null,
              },
            });
          }

          // 5. Terapkan seluruh penyesuaian saldo rekening & limit paylater
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

          // 6. Hapus semua transaksi pada rentang hari tersebut
          if (targetTransactions.length > 0) {
            await tx.transaction.deleteMany({
              where: {
                id: { in: targetTransactions.map((t) => t.id) },
              },
            });
          }

          return {
            affectedTxCount: targetTransactions.length,
            affectedLoansCount: targetLoans.length,
            deletedBillsCount: newBills.length,
            resetBillsCount: oldExecutedBills.length,
          };
        });

      return NextResponse.json({
        success: true,
        scope: "DAILY",
        date: targetDateStr,
        displayDate,
        affectedTransactions: affectedTxCount,
        affectedLoans: affectedLoansCount,
        deletedBills: deletedBillsCount,
        resetBills: resetBillsCount,
        message: `Seluruh aktivitas pada tanggal ${displayDate} berhasil direset total.`,
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
