import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/userBootstrap";
import { payLoanInstallment } from "@/lib/loanService";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
      include: {
        sourceAccount: true,
      },
    });

    if (!loan) {
      return NextResponse.json(
        { error: "Data pinjaman tidak ditemukan" },
        { status: 404 }
      );
    }

    if (loan.status === "COMPLETED" || loan.remainingMonths <= 0) {
      return NextResponse.json(
        { error: "Pinjaman ini sudah lunas" },
        { status: 400 }
      );
    }

    if (
      loan.sourceAccount.type !== "credit" &&
      loan.sourceAccount.balance < loan.monthlyTotal
    ) {
      return NextResponse.json(
        {
          error: `Saldo rekening ${loan.sourceAccount.name} tidak mencukupi untuk bayar cicilan.`,
        },
        { status: 400 }
      );
    }

    const result = await payLoanInstallment(loan.id, {
      sendWaNotification: true,
    });

    return NextResponse.json({
      success: true,
      message: "Cicilan berhasil dibayar",
      loan: result.updatedLoan,
      account: result.updatedSource,
      paylater: result.updatedPaylater,
    });
  } catch (error) {
    console.error("[PAY LOAN MANUAL ERROR]", error);
    const msg =
      error instanceof Error ? error.message : "Gagal membayar cicilan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
