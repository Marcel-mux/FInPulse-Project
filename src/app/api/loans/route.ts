import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/userBootstrap";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loans = await prisma.loan.findMany({
      where: { userId },
      include: {
        paylaterAccount: {
          select: {
            id: true,
            name: true,
            accountCategory: true,
            creditLimit: true,
            balance: true,
          },
        },
        sourceAccount: {
          select: {
            id: true,
            name: true,
            balance: true,
            type: true,
          },
        },
        disbursementAccount: {
          select: {
            id: true,
            name: true,
            balance: true,
            type: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDay: "asc" }, { createdAt: "desc" }],
    });

    const wibNow = new Date(Date.now() + 7 * 3600 * 1000);
    const currentMonth = wibNow.getUTCMonth();
    const currentYear = wibNow.getUTCFullYear();

    let totalActiveDebt = 0;
    let totalMonthlyInstallment = 0;
    let activeLoansCount = 0;

    const formattedLoans = loans.map((loan) => {
      let isPaidThisMonth = false;
      if (loan.lastPaid) {
        const lastP = new Date(loan.lastPaid);
        const lastPWib = new Date(lastP.getTime() + 7 * 3600 * 1000);
        isPaidThisMonth =
          lastPWib.getUTCMonth() === currentMonth &&
          lastPWib.getUTCFullYear() === currentYear;
      }

      if (loan.status === "ACTIVE" && loan.remainingMonths > 0) {
        totalActiveDebt += loan.remainingMonths * loan.monthlyPrincipal;
        totalMonthlyInstallment += loan.monthlyTotal;
        activeLoansCount++;
      }

      return {
        ...loan,
        isPaidThisMonth,
      };
    });

    return NextResponse.json({
      loans: formattedLoans,
      totalActiveDebt,
      totalMonthlyInstallment,
      activeLoansCount,
    });
  } catch (error) {
    console.error("[GET LOANS ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pinjaman & cicilan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await getAuthUserId(request, body);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      totalAmount,
      tenor,
      dueDay,
      paylaterAccountId,
      sourceAccountId, // Rekening Pembayaran Cicilan
      disbursementAccountId, // Rekening Pencairan Dana
      monthlyTotal: customMonthlyTotal,
      loanType,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Nama pinjaman / cicilan wajib diisi" },
        { status: 400 }
      );
    }

    const numTotalAmount = parseFloat(totalAmount);
    if (isNaN(numTotalAmount) || numTotalAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal pinjaman harus lebih besar dari 0" },
        { status: 400 }
      );
    }

    const numTenor = parseInt(tenor, 10);
    if (isNaN(numTenor) || numTenor < 1) {
      return NextResponse.json(
        { error: "Tenor cicilan minimal 1 bulan" },
        { status: 400 }
      );
    }

    const numDueDay = parseInt(dueDay, 10);
    if (isNaN(numDueDay) || numDueDay < 1 || numDueDay > 31) {
      return NextResponse.json(
        { error: "Tanggal jatuh tempo harus antara tanggal 1 - 31" },
        { status: 400 }
      );
    }

    if (!paylaterAccountId || !sourceAccountId) {
      return NextResponse.json(
        { error: "Provider Paylater dan Rekening Pembayaran Cicilan wajib dipilih" },
        { status: 400 }
      );
    }

    // Hitung pokok, bunga, dan total angsuran per bulan
    const monthlyPrincipal = Math.round(numTotalAmount / numTenor);
    let monthlyTotal = monthlyPrincipal;
    if (customMonthlyTotal && !isNaN(parseFloat(customMonthlyTotal))) {
      monthlyTotal = Math.max(monthlyPrincipal, parseFloat(customMonthlyTotal));
    }
    const monthlyInterest = Math.max(0, monthlyTotal - monthlyPrincipal);

    // Ambil info akun paylater dan rekening pembayaran
    const paylaterAcc = await prisma.account.findFirst({
      where: { id: paylaterAccountId, userId },
    });
    const sourceAcc = await prisma.account.findFirst({
      where: { id: sourceAccountId, userId },
    });

    if (!paylaterAcc || !sourceAcc) {
      return NextResponse.json(
        { error: "Akun yang dipilih tidak valid atau tidak ditemukan" },
        { status: 404 }
      );
    }

    const isPaylaterPurchase = loanType === "PAYLATER_PURCHASE";

    // Untuk Kredit Pinjaman Tunai, ambil rekening pencairan dana
    let disbursementAcc = null;
    if (!isPaylaterPurchase) {
      const targetDisbursementId = disbursementAccountId || sourceAccountId;
      disbursementAcc = await prisma.account.findFirst({
        where: { id: targetDisbursementId, userId },
      });
      if (!disbursementAcc) {
        return NextResponse.json(
          { error: "Rekening pencairan dana tidak valid atau tidak ditemukan" },
          { status: 404 }
        );
      }
    }

    if (paylaterAcc.balance < numTotalAmount) {
      return NextResponse.json(
        {
          error: `Sisa limit ${paylaterAcc.name} tidak mencukupi (${formatCurrency(
            paylaterAcc.balance
          )} tersisa dari total ${formatCurrency(numTotalAmount)})`,
        },
        { status: 400 }
      );
    }

    // Eksekusi atomik pencairan pinjaman / cicilan paylater & pembuatan record Loan
    const result = await prisma.$transaction(async (tx) => {
      // 1. Kurangi sisa limit pada provider paylater
      await tx.account.update({
        where: { id: paylaterAcc.id },
        data: {
          balance: { decrement: numTotalAmount },
        },
      });

      if (!isPaylaterPurchase && disbursementAcc) {
        // Mode Kredit Pinjaman Tunai:
        // a. Tambah saldo pada Rekening Pencairan Dana
        await tx.account.update({
          where: { id: disbursementAcc.id },
          data: {
            balance: { increment: numTotalAmount },
          },
        });

        // b. Catat riwayat transaksi pemasukan (INCOME) pencairan pinjaman
        await tx.transaction.create({
          data: {
            userId,
            type: "income",
            amount: numTotalAmount,
            accountId: disbursementAcc.id,
            date: new Date(),
            description: `Pencairan Pinjaman ${name.trim()} (${numTenor} bln)`,
            tags: "#loan #disbursement #income",
          },
        });
      } else {
        // Mode Cicilan Belanja Paylater: Catat transaksi pengeluaran belanja barang
        await tx.transaction.create({
          data: {
            userId,
            type: "expense",
            amount: numTotalAmount,
            accountId: paylaterAcc.id,
            date: new Date(),
            description: `Belanja Paylater: ${name.trim()} (${numTenor} bln)`,
            tags: "#paylater #purchase #installment",
          },
        });
      }

      // Simpan entitas Loan baru
      const newLoan = await tx.loan.create({
        data: {
          userId,
          name: name.trim(),
          totalAmount: numTotalAmount,
          tenor: numTenor,
          monthlyPrincipal,
          monthlyInterest,
          monthlyTotal,
          dueDay: numDueDay,
          remainingMonths: numTenor,
          status: "ACTIVE",
          paylaterAccountId: paylaterAcc.id,
          sourceAccountId: sourceAcc.id, // Rekening Pembayaran Cicilan
          disbursementAccountId: disbursementAcc ? disbursementAcc.id : null, // Rekening Pencairan Dana
        },
        include: {
          paylaterAccount: true,
          sourceAccount: true,
          disbursementAccount: true,
        },
      });

      return newLoan;
    });

    return NextResponse.json(
      {
        message: "Pinjaman / cicilan berhasil dibuat",
        loan: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CREATE LOAN ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat pinjaman / cicilan" },
      { status: 500 }
    );
  }
}
