import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");

    const where: Record<string, unknown> = {};

    if (type && ["income", "expense", "transfer"].includes(type)) {
      where.type = type;
    }

    if (accountId) {
      where.OR = [{ accountId: accountId }, { toAccountId: accountId }];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            colorHex: true,
          },
        },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 }
    );
  }
}
