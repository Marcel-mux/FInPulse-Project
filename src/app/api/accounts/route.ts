import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalNetWorth = accounts.reduce((acc, account) => {
      // Akun kredit mengurangi net worth jika bernilai pinjaman/utang, akun lainnya menambah
      if (account.type === "credit") {
        return acc - account.balance;
      }
      return acc + account.balance;
    }, 0);

    return NextResponse.json({
      accounts,
      totalNetWorth,
      activeAccountsCount: accounts.length,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data akun" },
      { status: 500 }
    );
  }
}
