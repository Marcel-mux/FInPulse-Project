import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/userBootstrap";

export const dynamic = "force-dynamic";

export async function DELETE(
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
    });

    if (!loan) {
      return NextResponse.json(
        { error: "Data pinjaman tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.loan.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Pinjaman berhasil dihapus",
      id,
    });
  } catch (error) {
    console.error("[DELETE LOAN ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus pinjaman" },
      { status: 500 }
    );
  }
}
