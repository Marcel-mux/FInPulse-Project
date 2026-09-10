import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");

    const where: Record<string, unknown> = {};

    if (type && ["income", "expense", "transfer"].includes(type)) {
      where.type = type;
    }

    if (accountId) {
      where.OR = [{ accountId: accountId }, { toAccountId: accountId }];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            colorHex: true,
          },
        },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      amount,
      date,
      accountId,
      toAccountId,
      categoryId,
      description,
      tags,
      receiptUrl,
      isRecurring,
      adminFee,
    } = body;

    // Validasi Tipe Transaksi
    if (!type || !["income", "expense", "transfer"].includes(type)) {
      return NextResponse.json(
        { error: "Tipe transaksi harus 'income', 'expense', atau 'transfer'" },
        { status: 400 }
      );
    }

    // Validasi Nominal
    const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal transaksi harus berupa angka lebih besar dari 0" },
        { status: 400 }
      );
    }

    // Validasi Akun Asal
    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json(
        { error: "Akun asal wajib dipilih" },
        { status: 400 }
      );
    }

    // Validasi Khusus Transfer
    if (type === "transfer") {
      if (!toAccountId || typeof toAccountId !== "string") {
        return NextResponse.json(
          { error: "Akun tujuan transfer wajib dipilih" },
          { status: 400 }
        );
      }
      if (accountId === toAccountId) {
        return NextResponse.json(
          { error: "Akun asal dan akun tujuan transfer tidak boleh sama" },
          { status: 400 }
        );
      }
    }

    const txDate = date ? new Date(date) : new Date();
    const parsedAdminFee = adminFee ? Math.max(0, parseFloat(adminFee) || 0) : 0;

    // Eksekusi atomik menggunakan Prisma $transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek akun asal
      const sourceAccount = await tx.account.findUnique({
        where: { id: accountId },
      });

      if (!sourceAccount || !sourceAccount.isActive) {
        throw new Error("Akun asal tidak ditemukan atau tidak aktif");
      }

      // 2. Alur Khusus Transfer
      if (type === "transfer") {
        const destAccount = await tx.account.findUnique({
          where: { id: toAccountId },
        });

        if (!destAccount || !destAccount.isActive) {
          throw new Error("Akun tujuan transfer tidak ditemukan atau tidak aktif");
        }

        const totalDeduction = parsedAmount + parsedAdminFee;

        // Cek saldo akun asal kecuali kartu kredit
        if (sourceAccount.type !== "credit" && sourceAccount.balance < totalDeduction) {
          throw new Error(
            `Saldo ${sourceAccount.name} tidak mencukupi (Tersedia: Rp ${new Intl.NumberFormat(
              "id-ID"
            ).format(sourceAccount.balance)})`
          );
        }

        // Potong saldo akun asal (nominal transfer + biaya admin)
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: { decrement: totalDeduction },
          },
        });

        // Tambah saldo akun tujuan
        await tx.account.update({
          where: { id: toAccountId },
          data: {
            balance: { increment: parsedAmount },
          },
        });

        // Catat transaksi transfer utama
        const transferTx = await tx.transaction.create({
          data: {
            type: "transfer",
            amount: parsedAmount,
            date: txDate,
            accountId,
            toAccountId,
            categoryId: categoryId || null,
            description: description?.trim() || `Transfer ke ${destAccount.name}`,
            tags: tags?.trim() || "#transfer",
            receiptUrl: receiptUrl || null,
            isRecurring: Boolean(isRecurring),
          },
          include: {
            account: true,
            toAccount: true,
            category: true,
          },
        });

        // Jika ada biaya admin, catat sebagai transaksi pengeluaran terpisah
        if (parsedAdminFee > 0) {
          await tx.transaction.create({
            data: {
              type: "expense",
              amount: parsedAdminFee,
              date: txDate,
              accountId,
              description: `Biaya Admin Transfer (${sourceAccount.name} ➔ ${destAccount.name})`,
              tags: "#adminfee #transfer",
              isRecurring: false,
            },
          });
        }

        return transferTx;
      }

      // 3. Alur Pengeluaran (Expense)
      if (type === "expense") {
        if (sourceAccount.type !== "credit" && sourceAccount.balance < parsedAmount) {
          throw new Error(
            `Saldo ${sourceAccount.name} tidak mencukupi untuk pengeluaran ini (Tersedia: Rp ${new Intl.NumberFormat(
              "id-ID"
            ).format(sourceAccount.balance)})`
          );
        }

        // Kurangi saldo akun asal
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: { decrement: parsedAmount },
          },
        });

        const expenseTx = await tx.transaction.create({
          data: {
            type: "expense",
            amount: parsedAmount,
            date: txDate,
            accountId,
            categoryId: categoryId || null,
            description: description?.trim() || null,
            tags: tags?.trim() || null,
            receiptUrl: receiptUrl || null,
            isRecurring: Boolean(isRecurring),
          },
          include: {
            account: true,
            category: true,
          },
        });

        return expenseTx;
      }

      // 4. Alur Pemasukan (Income)
      if (type === "income") {
        // Tambah saldo akun tujuan
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: { increment: parsedAmount },
          },
        });

        const incomeTx = await tx.transaction.create({
          data: {
            type: "income",
            amount: parsedAmount,
            date: txDate,
            accountId,
            categoryId: categoryId || null,
            description: description?.trim() || null,
            tags: tags?.trim() || null,
            receiptUrl: receiptUrl || null,
            isRecurring: Boolean(isRecurring),
          },
          include: {
            account: true,
            category: true,
          },
        });

        return incomeTx;
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    const message =
      error instanceof Error ? error.message : "Gagal mencatat transaksi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
