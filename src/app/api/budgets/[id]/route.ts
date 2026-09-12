import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { getAuthUserId } = await import("@/lib/userBootstrap");
    const userId = await getAuthUserId(request);

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Anggaran tidak ditemukan atau Anda tidak memiliki akses" },
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
