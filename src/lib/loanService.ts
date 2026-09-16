import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";
import { sendWhatsAppMessage } from "@/lib/fonnte";

export interface PayLoanOptions {
  sourceAccountId?: string;
  amount?: number;
  sendWaNotification?: boolean;
}

export async function payLoanInstallment(
  loanId: string,
  options: PayLoanOptions = { sendWaNotification: true }
) {
  // 1. Ambil data pinjaman beserta relasi akun & user
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      paylaterAccount: true,
      sourceAccount: true,
      user: {
        select: {
          id: true,
          name: true,
          whatsappNumber: true,
        },
      },
    },
  });

  if (!loan) {
    throw new Error("Data pinjaman / cicilan tidak ditemukan.");
  }

  if (loan.status === "COMPLETED" || loan.remainingMonths <= 0) {
    throw new Error(`Pinjaman "${loan.name}" sudah berstatus LUNAS (COMPLETED).`);
  }

  // 2. Tentukan rekening pembayar & nominal pembayaran
  let sourceAccount = loan.sourceAccount;
  if (options.sourceAccountId && options.sourceAccountId !== loan.sourceAccountId) {
    const customSource = await prisma.account.findFirst({
      where: {
        id: options.sourceAccountId,
        userId: loan.userId,
      },
    });

    if (!customSource) {
      throw new Error("Rekening pembayar yang dipilih tidak valid.");
    }
    sourceAccount = customSource;
  }

  const payAmount =
    options.amount && options.amount > 0 ? options.amount : loan.monthlyTotal;

  // 3. Validasi kecukupan saldo rekening pembayar
  if (sourceAccount.type !== "credit" && sourceAccount.balance < payAmount) {
    throw new Error(
      `Saldo rekening ${sourceAccount.name} tidak mencukupi untuk bayar cicilan ${formatCurrency(
        payAmount
      )}. Saldo saat ini: ${formatCurrency(sourceAccount.balance)}`
    );
  }

  const currentInstallmentNumber = loan.tenor - loan.remainingMonths + 1;
  const newRemaining = Math.max(0, loan.remainingMonths - 1);
  const isCompleted = newRemaining === 0;

  // 4. Eksekusi transaksi atomik via Prisma $transaction
  const result = await prisma.$transaction(async (tx) => {
    // a. Potong saldo rekening pembayar sebesar payAmount
    const updatedSource = await tx.account.update({
      where: { id: sourceAccount.id },
      data: {
        balance: {
          decrement: payAmount,
        },
      },
    });

    // b. Pulihkan/tambah kembali sisa limit pada paylaterAccountId sebesar porsi pokok
    const principalPortion =
      loan.monthlyInterest > 0
        ? Math.min(loan.monthlyPrincipal, payAmount)
        : payAmount;

    const maxLimit =
      loan.paylaterAccount.creditLimit ??
      loan.paylaterAccount.balance + principalPortion;

    const newPaylaterBalance = Math.min(
      maxLimit,
      loan.paylaterAccount.balance + principalPortion
    );

    const updatedPaylater = await tx.account.update({
      where: { id: loan.paylaterAccountId },
      data: {
        balance: newPaylaterBalance,
      },
    });

    // c. Pastikan kategori pengeluaran tersedia
    let category = await tx.category.findFirst({
      where: {
        userId: loan.userId,
        name: {
          in: [
            "Tagihan & Utilitas",
            "Cicilan & Pinjaman",
            "Pelunasan Paylater",
            "Bunga / Biaya Pinjaman",
          ],
        },
        type: "expense",
      },
    });

    if (!category) {
      category = await tx.category.findFirst({
        where: { userId: loan.userId, type: "expense" },
      });
    }

    // d. Catat mutasi EXPENSE pada rekening pembayar
    const expenseTx = await tx.transaction.create({
      data: {
        userId: loan.userId,
        type: "expense",
        amount: payAmount,
        accountId: sourceAccount.id,
        categoryId: category?.id || null,
        date: new Date(),
        description: `Pelunasan Tagihan Paylater: ${loan.name} via ${sourceAccount.name}`,
        tags: "#loan #paylater #payment",
        isRecurring: true,
      },
    });

    // e. Kurangi remainingMonths sebanyak 1 dan update status jika lunas
    const updatedLoan = await tx.loan.update({
      where: { id: loan.id },
      data: {
        remainingMonths: newRemaining,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        lastPaid: new Date(),
        sourceAccountId: sourceAccount.id,
      },
    });

    return {
      updatedLoan,
      updatedSource,
      updatedPaylater,
      expenseTx,
    };
  });

  // 5. Kirim notifikasi WhatsApp jika diminta dan nomor WhatsApp tersedia
  if (options.sendWaNotification && loan.user?.whatsappNumber) {
    const waMessage =
      `💳 *Pembayaran Cicilan Berhasil!*\n\n` +
      `Pembayaran cicilan bulanan Anda telah berhasil diproses:\n\n` +
      `• *Pinjaman*: ${loan.name}\n` +
      `• *Cicilan Ke*: ${currentInstallmentNumber} dari ${loan.tenor} bulan\n` +
      `• *Total Dibayar*: ${formatCurrency(payAmount)}\n` +
      `  - Pokok Limit Dipulihkan: ${formatCurrency(
        loan.monthlyInterest > 0
          ? Math.min(loan.monthlyPrincipal, payAmount)
          : payAmount
      )}\n` +
      (loan.monthlyInterest > 0
        ? `  - Beban Bunga Pinjaman: ${formatCurrency(loan.monthlyInterest)}\n`
        : "") +
      `• *Rekening Pembayar*: ${sourceAccount.name}\n` +
      `• *Sisa Saldo ${sourceAccount.name}*: ${formatCurrency(
        result.updatedSource.balance
      )}\n` +
      `• *Sisa Limit ${loan.paylaterAccount.name}*: ${formatCurrency(
        result.updatedPaylater.balance
      )}${
        loan.paylaterAccount.creditLimit
          ? ` (dari Plafon ${formatCurrency(loan.paylaterAccount.creditLimit)})`
          : ""
      }\n` +
      `• *Status Pinjaman*: ${
        isCompleted
          ? "🎉 LUNAS (Seluruh cicilan selesai)"
          : `Aktif (${newRemaining} bulan tersisa)`
      }`;

    await sendWhatsAppMessage({
      target: loan.user.whatsappNumber,
      message: waMessage,
    }).catch((err) => {
      console.error(
        `[LOAN SERVICE] Gagal mengirim notifikasi WhatsApp pembayaran cicilan:`,
        err
      );
    });
  }

  return result;
}
