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

    // Eksekusi atomik: kurangi saldo, buat transaksi pengeluaran, perbarui lastDeducted
    const result = await prisma.$transaction(async (tx) => {
      // 1. Kurangi saldo rekening
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
          description: `Pembayaran Tagihan: ${bill.name}`,
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

      return { updatedAccount, newTransaction, updatedBill };
    });

    // Kirim notifikasi WhatsApp jika user memiliki nomor WhatsApp terdaftar
    if (bill.user?.whatsappNumber) {
      const todayFormatted = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const message =
        `✅ *Pembayaran Tagihan Berhasil!*\n\n` +
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
