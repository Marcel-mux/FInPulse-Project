import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/userBootstrap";

export const dynamic = "force-dynamic";

function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/@.*$/, "").replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, whatsappNumber: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      whatsappNumber: user.whatsappNumber || null,
      user,
    });
  } catch (error) {
    console.error("Error fetching user whatsapp:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data WhatsApp" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = await getAuthUserId(request, body);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { whatsappNumber } = body;

    // Jika user mengosongkan / menghapus nomor WA
    if (!whatsappNumber || typeof whatsappNumber !== "string" || !whatsappNumber.trim()) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { whatsappNumber: null },
        select: { id: true, name: true, whatsappNumber: true },
      });

      return NextResponse.json({
        message: "Nomor WhatsApp berhasil dicabut.",
        whatsappNumber: null,
        user: updatedUser,
      });
    }

    const normalized = normalizePhoneNumber(whatsappNumber);
    if (normalized.length < 9 || normalized.length > 16) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid. Masukkan nomor HP aktif (contoh: 08123456789)." },
        { status: 400 }
      );
    }

    // Periksa apakah nomor sudah digunakan oleh user lain
    const existing = await prisma.user.findFirst({
      where: {
        whatsappNumber: normalized,
        id: { not: userId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Nomor WhatsApp ini sudah digunakan oleh akun FinPulse lain." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { whatsappNumber: normalized },
      select: { id: true, name: true, whatsappNumber: true },
    });

    return NextResponse.json({
      message: "Nomor WhatsApp berhasil ditautkan!",
      whatsappNumber: normalized,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user whatsapp:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan nomor WhatsApp" },
      { status: 500 }
    );
  }
}
