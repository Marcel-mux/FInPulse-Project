import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserId } from "@/lib/userBootstrap";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const userId = await requireAuthUserId(request, body);

    const existingBill = await prisma.bill.findFirst({
      where: { id, userId },
    });

    if (!existingBill) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    const { name, amount, dueDay, accountId, categoryId, autoDeduct, resetDeducted } =
      body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Nama tagihan tidak boleh kosong." },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { error: "Nominal tagihan harus lebih besar dari 0." },
          { status: 400 }
        );
      }
      updateData.amount = parsedAmount;
    }

    if (dueDay !== undefined) {
      const parsedDueDay = parseInt(dueDay, 10);
      if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
        return NextResponse.json(
          { error: "Tanggal jatuh tempo harus antara 1 sampai 31." },
          { status: 400 }
        );
      }
      updateData.dueDay = parsedDueDay;
    }

    if (autoDeduct !== undefined) {
      updateData.autoDeduct = Boolean(autoDeduct);
    }

    if (resetDeducted === true) {
      updateData.lastDeducted = null;
    }

    if (accountId !== undefined) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });
      if (!account) {
        return NextResponse.json(
          { error: "Rekening sumber tidak valid." },
          { status: 400 }
        );
      }
      updateData.accountId = accountId;
    }

    if (categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Kategori tidak valid." },
          { status: 400 }
        );
      }
      updateData.categoryId = categoryId;
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: updateData,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
            balance: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json({ bill: updatedBill });
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui tagihan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = await requireAuthUserId(request);

    const existingBill = await prisma.bill.findFirst({
      where: { id, userId },
    });

    if (!existingBill) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    await prisma.bill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json(
      { error: "Gagal menghapus tagihan" },
      { status: 500 }
    );
  }
}
