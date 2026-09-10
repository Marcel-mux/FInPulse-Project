import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, balance, colorHex, icon } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama akun wajib diisi" },
        { status: 400 }
      );
    }

    const validTypes = ["cash", "bank", "ewallet", "investment", "credit"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipe akun tidak valid" },
        { status: 400 }
      );
    }

    const initialBalance = typeof balance === "number" ? balance : parseFloat(balance) || 0;

    const newAccount = await prisma.account.create({
      data: {
        name: name.trim(),
        type,
        balance: initialBalance,
        colorHex: colorHex || null,
        icon: icon || null,
        isActive: true,
      },
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Gagal membuat akun baru" },
      { status: 500 }
    );
  }
}
