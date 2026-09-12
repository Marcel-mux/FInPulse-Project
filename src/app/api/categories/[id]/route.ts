import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/userBootstrap";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, type, icon, colorHex } = body;
    const userId = await getAuthUserId(request, body);

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan atau Anda tidak memiliki akses" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (type !== undefined) {
      if (type !== "income" && type !== "expense") {
        return NextResponse.json(
          { error: "Tipe kategori harus 'income' atau 'expense'" },
          { status: 400 }
        );
      }
      updateData.type = type;
    }
    if (icon !== undefined) updateData.icon = icon;
    if (colorHex !== undefined) updateData.colorHex = colorHex;

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori" },
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
    const userId = await getAuthUserId(request);

    const existing = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            transactions: true,
            budgets: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan atau Anda tidak memiliki akses" },
        { status: 404 }
      );
    }

    if (existing._count.transactions > 0 || existing._count.budgets > 0) {
      return NextResponse.json(
        {
          error: `Kategori tidak dapat dihapus karena sedang digunakan oleh ${existing._count.transactions} transaksi dan ${existing._count.budgets} anggaran.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
