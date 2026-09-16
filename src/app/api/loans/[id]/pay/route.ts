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
        { error: "Data pinjaman / cicilan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (loan.status === "COMPLETED" || loan.remainingMonths <= 0) {
      return NextResponse.json(
        { error: "Pinjaman ini sudah lunas" },
        { status: 400 }
      );
    }

    // Ambil payload opsional: { sourceAccountId, amount }
    const body = await request.json().catch(() => ({}));
    const sourceAccountId = typeof body?.sourceAccountId === "string" ? body.sourceAccountId : undefined;
    const amount = typeof body?.amount === "number" && body.amount > 0 ? body.amount : undefined;

    const result = await payLoanInstallment(loan.id, {
      sourceAccountId,
      amount,
      sendWaNotification: true,
    });

    return NextResponse.json({
      success: true,
      message: "Cicilan berhasil dibayar! Limit paylater Anda telah dipulihkan.",
      loan: result.updatedLoan,
      account: result.updatedSource,
      paylater: result.updatedPaylater,
      transaction: result.expenseTx,
    });
  } catch (error: unknown) {
    console.error("[PAY LOAN MANUAL ERROR]", error);
    const msg =
      error instanceof Error ? error.message : "Gagal membayar cicilan";
    const status =
      msg.includes("tidak mencukupi") ||
      msg.includes("sudah berstatus LUNAS") ||
      msg.includes("tidak valid")
        ? 400
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
