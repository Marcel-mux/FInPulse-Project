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
    const { name, type, colorHex, icon, isActive } = body;
    const userId = await getAuthUserId(request, body);

    const existing = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau Anda tidak memiliki akses" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (type !== undefined) updateData.type = type;
    if (colorHex !== undefined) updateData.colorHex = colorHex;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.account.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui akun" },
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

    const existing = await prisma.account.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            transactionsFrom: true,
            transactionsTo: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau Anda tidak memiliki akses" },
        { status: 404 }
      );
    }

    const totalTransactions =
      existing._count.transactionsFrom + existing._count.transactionsTo;

    if (totalTransactions > 0) {
      // Soft delete untuk menjaga integritas data riwayat mutasi
      await prisma.account.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Akun dinonaktifkan karena memiliki riwayat transaksi",
        softDeleted: true,
      });
    } else {
      // Hard delete aman jika akun baru tanpa mutasi transaksi
      await prisma.account.delete({
        where: { id },
      });
      return NextResponse.json({
        message: "Akun berhasil dihapus permanen",
        softDeleted: false,
      });
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Gagal menghapus akun" },
      { status: 500 }
    );
  }
}
