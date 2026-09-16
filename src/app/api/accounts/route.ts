import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { getAuthUserId } = await import("@/lib/userBootstrap");
    const userId = await getAuthUserId(request);

    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const regularAccounts = accounts.filter((a) => a.accountCategory !== "PAYLATER" && a.type !== "credit");
    const paylaterAccounts = accounts.filter((a) => a.accountCategory === "PAYLATER" || a.type === "credit");

    const totalActualBalance = regularAccounts.reduce((acc, account) => acc + account.balance, 0);

    const totalPaylaterLimit = paylaterAccounts.reduce((acc, a) => acc + (a.creditLimit || 0), 0);
    const totalPaylaterAvailable = paylaterAccounts.reduce((acc, a) => acc + a.balance, 0);
    const totalPaylaterUsed = Math.max(0, totalPaylaterLimit - totalPaylaterAvailable);

    // Kekayaan Bersih = Total Saldo Aktual Likuid - Total Limit Terpakai (Utang Paylater)
    const totalNetWorth = totalActualBalance - totalPaylaterUsed;

    return NextResponse.json({
      accounts: regularAccounts,
      paylaterAccounts,
      allAccounts: accounts,
      totalActualBalance,
      totalNetWorth,
      activeAccountsCount: regularAccounts.length,
      totalPaylaterLimit,
      totalPaylaterUsed,
      totalPaylaterAvailable,
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
    const { name, type, balance, colorHex, icon, accountCategory, creditLimit } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama akun wajib diisi" },
        { status: 400 }
      );
    }

    const initialCategory = accountCategory === "PAYLATER" ? "PAYLATER" : "REGULAR";
    const resolvedType = initialCategory === "PAYLATER" ? (type || "credit") : type;

    const validTypes = ["cash", "bank", "ewallet", "investment", "credit"];
    if (!resolvedType || !validTypes.includes(resolvedType)) {
      return NextResponse.json(
        { error: "Tipe akun tidak valid" },
        { status: 400 }
      );
    }

    const initialBalance = typeof balance === "number" ? balance : parseFloat(balance) || 0;
    const parsedCreditLimit =
      creditLimit !== undefined && creditLimit !== null && creditLimit !== ""
        ? typeof creditLimit === "number"
          ? creditLimit
          : parseFloat(creditLimit) || null
        : null;

    const { getAuthUserId } = await import("@/lib/userBootstrap");
    const userId = await getAuthUserId(request, body);

    const newAccount = await prisma.account.create({
      data: {
        userId,
        name: name.trim(),
        type: resolvedType,
        accountCategory: initialCategory,
        creditLimit: parsedCreditLimit,
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
