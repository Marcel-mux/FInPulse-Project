import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { actualBalance, note } = body;

    if (actualBalance === undefined || actualBalance === null || isNaN(Number(actualBalance))) {
      return NextResponse.json(
        { error: "Saldo aktual wajib berupa angka valid" },
        { status: 400 }
      );
    }

    const targetBalance = Number(actualBalance);

    // Jalankan atomic Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id },
      });

      if (!account) {
        throw new Error("Akun tidak ditemukan");
      }

      const currentBalance = account.balance;
      const difference = targetBalance - currentBalance;

      // Jika tidak ada perbedaan, kembalikan langsung
      if (Math.abs(difference) < 0.001) {
        return {
          account,
          difference: 0,
          adjustmentTransaction: null,
          message: "Saldo aktual sama dengan saldo tercatat",
        };
      }

      const isSurplus = difference > 0;
      const amount = Math.abs(difference);
      const diffFormatted = formatCurrency(amount);

      const defaultDesc = isSurplus
        ? `Penyesuaian Saldo Rekonsiliasi (+${diffFormatted})`
        : `Penyesuaian Saldo Rekonsiliasi (-${diffFormatted})`;

      // Catat mutasi penyesuaian ke buku besar transaksi
      const adjustmentTransaction = await tx.transaction.create({
        data: {
          userId: account.userId,
          type: isSurplus ? "income" : "expense",
          amount,
          date: new Date(),
          accountId: id,
          description: note?.trim() || defaultDesc,
          tags: "#reconciliation #audit",
          isRecurring: false,
        },
        include: {
          account: true,
        },
      });

      // Update saldo akun ke saldo aktual yang diinput pengguna
      const updatedAccount = await tx.account.update({
        where: { id },
        data: {
          balance: targetBalance,
        },
      });

      return {
        account: updatedAccount,
        difference,
        adjustmentTransaction,
        message: `Rekonsiliasi berhasil: saldo disesuaikan sebesar ${isSurplus ? "+" : "-"}${diffFormatted}`,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error reconciling account balance:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Gagal melakukan rekonsiliasi saldo";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
