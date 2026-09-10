import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Anggaran tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Anggaran berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Gagal menghapus anggaran" },
      { status: 500 }
    );
  }
}
