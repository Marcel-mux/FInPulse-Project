import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserId } from "@/lib/userBootstrap";
import { sendWhatsAppMessage } from "@/lib/fonnte";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = await requireAuthUserId(request);

    const bill = await prisma.bill.findFirst({
      where: { id, userId },
      include: {
        account: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            whatsappNumber: true,
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    const isPaylater = bill.account.accountCategory === "PAYLATER";

    // Validasi kecukupan limit paylater atau saldo kas
    if (isPaylater) {
      if (bill.account.balance < bill.amount) {
        return NextResponse.json(
          {
            error: `Sisa limit Paylater ${bill.account.name} tidak mencukupi (${formatCurrency(bill.account.balance)}). Dibutuhkan: ${formatCurrency(bill.amount)}.`,
          },
          { status: 400 }
        );
      }
    } else if (bill.account.type !== "credit" && bill.account.balance < bill.amount) {
      return NextResponse.json(
        {
          error: `Saldo ${bill.account.name} tidak mencukupi (${formatCurrency(bill.account.balance)}). Dibutuhkan: ${formatCurrency(bill.amount)}.`,
        },
        { status: 400 }
      );
    }

    // Eksekusi atomik: kurangi saldo, buat transaksi pengeluaran, perbarui lastDeducted, dan buat record cicilan jika paylater
    const result = await prisma.$transaction(async (tx) => {
      // 1. Kurangi saldo rekening / sisa limit paylater
      const updatedAccount = await tx.account.update({
        where: { id: bill.accountId },
        data: {
          balance: {
            decrement: bill.amount,
          },
        },
      });

      // 2. Buat record transaksi pengeluaran
      const newTransaction = await tx.transaction.create({
        data: {
          userId,
          type: "expense",
          amount: bill.amount,
          accountId: bill.accountId,
          categoryId: bill.categoryId,
          description: `Pembayaran Tagihan: ${bill.name}${isPaylater ? ` (${bill.account.name})` : ""}`,
          tags: isPaylater ? "#paylater #bill" : "#bill",
          date: new Date(),
          isRecurring: true,
        },
      });

      // 3. Update lastDeducted pada bill
      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          lastDeducted: new Date(),
        },
        include: {
          account: true,
          category: true,
        },
      });

      // 4. [BUG FIX - WAJIB]: Jika menggunakan Paylater (SPayLater dll), otomatis buat record Loan
      let newLoan = null;
      let sourceAcc = null;

      if (isPaylater) {
        // Cari rekening kas/bank reguler utama milik user untuk sumber pembayaran cicilan nanti
        sourceAcc = await tx.account.findFirst({
          where: {
            userId,
            accountCategory: "REGULAR",
            type: { not: "credit" },
            isActive: true,
          },
          orderBy: [{ balance: "desc" }, { createdAt: "asc" }],
        });

        if (!sourceAcc) {
          sourceAcc = await tx.account.findFirst({
            where: {
              userId,
              id: { not: bill.accountId },
              isActive: true,
            },
            orderBy: { createdAt: "asc" },
          });
        }

        const loanSourceAccountId = sourceAcc?.id || bill.accountId;
        const loanName = `Tagihan: ${bill.name} (${bill.account.name})`;

        newLoan = await tx.loan.create({
          data: {
            userId,
            name: loanName,
            totalAmount: bill.amount,
            tenor: 1,
            monthlyPrincipal: bill.amount,
            monthlyInterest: 0,
            monthlyTotal: bill.amount,
            dueDay: 1, // Otomatis diset tanggal 1 (siklus jatuh tempo SPayLater)
            remainingMonths: 1,
            status: "ACTIVE",
            paylaterAccountId: bill.accountId,
            sourceAccountId: loanSourceAccountId,
            disbursementAccountId: null,
          },
        });

        console.log(
          `[PAY BILL] Berhasil membuat catatan cicilan Paylater: "${newLoan.name}" (ID: ${newLoan.id}) jatuh tempo tanggal 1.`
        );
      }

      return {
        updatedAccount,
        newTransaction,
        updatedBill,
        createdLoan: newLoan,
        defaultSourceAccount: sourceAcc,
      };
    });

    // Kirim notifikasi WhatsApp jika user memiliki nomor WhatsApp terdaftar
    if (bill.user?.whatsappNumber) {
      const todayFormatted = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const nextMonthDate = new Date(Date.now() + 7 * 3600 * 1000);
      const nextDueFormatted = new Date(
        Date.UTC(nextMonthDate.getUTCFullYear(), nextMonthDate.getUTCMonth() + 1, 1)
      ).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const message = isPaylater
        ? `✅ *Pembayaran Tagihan Paylater Berhasil!*\n\n` +
          `Tagihan *${bill.name}* telah berhasil dibayarkan menggunakan *${bill.account.name}*.\n\n` +
          `📋 *Rincian Pembayaran:*\n` +
          `• *Tagihan*: ${bill.name}\n` +
          `• *Nominal*: ${formatCurrency(bill.amount)}\n` +
          `• *Provider*: ${bill.account.name} (Paylater)\n` +
          `• *Kategori*: ${bill.category.name}\n` +
          `• *Tanggal*: ${todayFormatted}\n` +
          `• *Sisa Limit ${bill.account.name}*: ${formatCurrency(result.updatedAccount.balance)}${
            bill.account.creditLimit ? ` (dari Plafon ${formatCurrency(bill.account.creditLimit)})` : ""
          }\n\n` +
          `📌 *Jadwal Pembayaran Cicilan:*\n` +
          `Tagihan ini otomatis dicatat ke daftar cicilan paylater dan *jatuh tempo pada tanggal 1 bulan berikutnya (${nextDueFormatted})*.\n` +
          (result.defaultSourceAccount
            ? `• *Rekening Pembayar*: ${result.defaultSourceAccount.name}\n\n`
            : `\n`) +
          `_Dikelola otomatis oleh FinPulse Pro._`
        : `✅ *Pembayaran Tagihan Berhasil!*\n\n` +
          `Tagihan *${bill.name}* telah berhasil dibayarkan.\n\n` +
          `• *Nominal*: ${formatCurrency(bill.amount)}\n` +
          `• *Rekening*: ${bill.account.name}\n` +
          `• *Kategori*: ${bill.category.name}\n` +
          `• *Tanggal*: ${todayFormatted}\n` +
          `• *Sisa Saldo*: ${formatCurrency(result.updatedAccount.balance)}\n\n` +
          `_Dikelola otomatis oleh FinPulse Pro._`;

      // Jalankan kirim pesan di latar belakang tanpa memblokir respons HTTP
      sendWhatsAppMessage({
        target: bill.user.whatsappNumber,
        message,
      }).catch((err) => {
        console.error("Gagal mengirim WA pembayaran tagihan:", err);
      });
    }

    return NextResponse.json({
      success: true,
      bill: result.updatedBill,
      transaction: result.newTransaction,
      loan: result.createdLoan,
      remainingBalance: result.updatedAccount.balance,
    });
  } catch (error) {
    console.error("Error paying bill:", error);
    return NextResponse.json(
      { error: "Gagal memproses pembayaran tagihan" },
      { status: 500 }
    );
  }
}
