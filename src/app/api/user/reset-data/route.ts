import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi Sesi Pengguna
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    // 2. Verifikasi String Konfirmasi ("reset")
    const body = await request.json().catch(() => ({}));
    if (
      !body ||
      typeof body.confirmation !== "string" ||
      body.confirmation.trim().toLowerCase() !== "reset"
    ) {
      return NextResponse.json(
        {
          error: "Kata kunci konfirmasi tidak cocok. Harap ketik 'reset' untuk melanjutkan.",
        },
        { status: 400 }
      );
    }

    // 3. Ambil data akun Paylater pengguna untuk merestorasi limit ke plafon creditLimit
    const paylaterAccounts = await prisma.account.findMany({
      where: {
        userId,
        accountCategory: "PAYLATER",
      },
      select: {
        id: true,
        creditLimit: true,
      },
    });

    const paylaterRestorations = paylaterAccounts.map((account) =>
      prisma.account.update({
        where: { id: account.id },
        data: { balance: account.creditLimit ?? 0 },
      })
    );

    // 4. Jalankan Transaksi Atomik Prisma
    await prisma.$transaction([
      // 1. Hapus transaksi mutasi (pemasukan, pengeluaran, transfer)
      prisma.transaction.deleteMany({
        where: { userId },
      }),
      // 2. Hapus catatan pinjaman / cicilan paylater
      prisma.loan.deleteMany({
        where: { userId },
      }),
      // 3. Hapus tagihan berkala & autodebet
      prisma.bill.deleteMany({
        where: { userId },
      }),
      // 4. Hapus anggaran bulanan
      prisma.budget.deleteMany({
        where: { userId },
      }),
      // 5. Nol-kan saldo seluruh rekening kas & bank regular
      prisma.account.updateMany({
        where: {
          userId,
          accountCategory: { not: "PAYLATER" },
        },
        data: {
          balance: 0,
        },
      }),
      // 6. Pulihkan sisa limit paylater kembali sama dengan plafon creditLimit
      ...paylaterRestorations,
    ]);

    return NextResponse.json({
      success: true,
      message: "Seluruh data keuangan berhasil direset ke awal.",
      resetAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[RESET-DATA] Error saat mereset data keuangan:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat mereset data." },
      { status: 500 }
    );
  }
}
