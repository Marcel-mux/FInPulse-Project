import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";
import { sendWhatsAppMessage } from "@/lib/fonnte";

export interface PayLoanOptions {
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

  // 2. Validasi kecukupan saldo rekening pembayar
  if (
    loan.sourceAccount.type !== "credit" &&
    loan.sourceAccount.balance < loan.monthlyTotal
  ) {
    throw new Error(
      `Saldo rekening ${loan.sourceAccount.name} tidak mencukupi untuk bayar cicilan ${formatCurrency(
        loan.monthlyTotal
      )}. Saldo saat ini: ${formatCurrency(loan.sourceAccount.balance)}`
    );
  }

  const currentInstallmentNumber = loan.tenor - loan.remainingMonths + 1;
  const newRemaining = Math.max(0, loan.remainingMonths - 1);
  const isCompleted = newRemaining === 0;

  // 3. Eksekusi transaksi atomik via Prisma $transaction
  const result = await prisma.$transaction(async (tx) => {
    // a. Potong saldo rekening pembayar (sourceAccountId) sebesar monthlyTotal
    const updatedSource = await tx.account.update({
      where: { id: loan.sourceAccountId },
      data: {
        balance: {
          decrement: loan.monthlyTotal,
        },
      },
    });

    // b. Pulihkan/tambah kembali sisa limit pada paylaterAccountId sebesar monthlyPrincipal
    const maxLimit =
      loan.paylaterAccount.creditLimit ??
      loan.paylaterAccount.balance + loan.monthlyPrincipal;
    const newPaylaterBalance = Math.min(
      maxLimit,
      loan.paylaterAccount.balance + loan.monthlyPrincipal
    );

    const updatedPaylater = await tx.account.update({
      where: { id: loan.paylaterAccountId },
      data: {
        balance: newPaylaterBalance,
      },
    });

    // c. Pastikan kategori "Bunga / Biaya Pinjaman" tersedia
    let interestCategory = await tx.category.findFirst({
      where: {
        userId: loan.userId,
        name: { in: ["Bunga / Biaya Pinjaman", "Bunga Pinjaman", "Biaya Pinjaman"] },
        type: "expense",
      },
    });

    if (!interestCategory) {
      interestCategory = await tx.category.create({
        data: {
          userId: loan.userId,
          name: "Bunga / Biaya Pinjaman",
          type: "expense",
          icon: "Percent",
          colorHex: "#EF4444",
        },
      });
    }

    // d. Catat transaksi EXPENSE sebesar monthlyInterest
    let expenseTx = null;
    if (loan.monthlyInterest > 0) {
      expenseTx = await tx.transaction.create({
        data: {
          userId: loan.userId,
          type: "expense",
          amount: loan.monthlyInterest,
          accountId: loan.sourceAccountId,
          categoryId: interestCategory.id,
          date: new Date(),
          description: `Bunga Cicilan ${loan.name} (${currentInstallmentNumber}/${loan.tenor})`,
          tags: "#whatsapp #loan #interest",
          isRecurring: true,
        },
      });
    }

    // e. Kurangi remainingMonths sebanyak 1 dan update status jika lunas
    const updatedLoan = await tx.loan.update({
      where: { id: loan.id },
      data: {
        remainingMonths: newRemaining,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        lastPaid: new Date(),
      },
    });

    return {
      updatedLoan,
      updatedSource,
      updatedPaylater,
      expenseTx,
    };
  });

  // 4. Kirim notifikasi WhatsApp jika diminta dan nomor WhatsApp tersedia
  if (options.sendWaNotification && loan.user?.whatsappNumber) {
    const waMessage =
      `💳 *Pembayaran Cicilan Berhasil!*\n\n` +
      `Pembayaran cicilan bulanan Anda telah berhasil diproses:\n\n` +
      `• *Pinjaman*: ${loan.name}\n` +
      `• *Cicilan Ke*: ${currentInstallmentNumber} dari ${loan.tenor} bulan\n` +
      `• *Total Dibayar*: ${formatCurrency(loan.monthlyTotal)}\n` +
      `  - Pokok Limit Dipulihkan: ${formatCurrency(loan.monthlyPrincipal)}\n` +
      `  - Beban Bunga Pinjaman: ${formatCurrency(loan.monthlyInterest)}\n` +
      `• *Rekening Pembayar*: ${loan.sourceAccount.name}\n` +
      `• *Sisa Saldo ${loan.sourceAccount.name}*: ${formatCurrency(
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
