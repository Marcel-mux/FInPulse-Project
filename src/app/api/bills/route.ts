import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserId } from "@/lib/userBootstrap";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthUserId(request);

    const rawBills = await prisma.bill.findMany({
      where: { userId },
      orderBy: [{ dueDay: "asc" }, { createdAt: "desc" }],
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
            balance: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
      },
    });

    // Zona Waktu WIB (UTC+7)
    const wibNow = new Date(Date.now() + 7 * 3600 * 1000);
    const currentDay = wibNow.getUTCDate();
    const currentMonth = wibNow.getUTCMonth();
    const currentYear = wibNow.getUTCFullYear();

    let totalMonthlyBills = 0;
    let paidCount = 0;
    let upcomingCount = 0;
    let totalPaidAmount = 0;
    let totalPendingAmount = 0;

    const bills = rawBills.map((bill) => {
      totalMonthlyBills += bill.amount;

      // Cek apakah sudah terbayar/terpotong di bulan & tahun berjalan
      const isPaidThisMonth =
        Boolean(bill.lastDeducted) &&
        (() => {
          const d = new Date(bill.lastDeducted!);
          const dWib = new Date(d.getTime() + 7 * 3600 * 1000);
          return (
            dWib.getUTCMonth() === currentMonth &&
            dWib.getUTCFullYear() === currentYear
          );
        })();

      let status: "paid" | "due_today" | "upcoming" | "overdue";
      let daysUntilDue = 0;

      if (isPaidThisMonth) {
        status = "paid";
        paidCount++;
        totalPaidAmount += bill.amount;
      } else {
        totalPendingAmount += bill.amount;
        if (bill.dueDay === currentDay) {
          status = "due_today";
          daysUntilDue = 0;
          upcomingCount++;
        } else if (bill.dueDay > currentDay) {
          status = "upcoming";
          daysUntilDue = bill.dueDay - currentDay;
          upcomingCount++;
        } else {
          status = "overdue";
          daysUntilDue = bill.dueDay - currentDay;
          upcomingCount++;
        }
      }

      return {
        ...bill,
        createdAt: bill.createdAt.toISOString(),
        updatedAt: bill.updatedAt.toISOString(),
        lastDeducted: bill.lastDeducted ? bill.lastDeducted.toISOString() : null,
        isPaidThisMonth,
        daysUntilDue,
        status,
      };
    });

    return NextResponse.json({
      bills,
      totalMonthlyBills,
      paidCount,
      upcomingCount,
      totalPaidAmount,
      totalPendingAmount,
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data tagihan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await requireAuthUserId(request, body);

    const { name, amount, dueDay, accountId, categoryId, autoDeduct } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Nama tagihan wajib diisi." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal tagihan harus lebih besar dari 0." },
        { status: 400 }
      );
    }

    const parsedDueDay = parseInt(dueDay, 10);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      return NextResponse.json(
        { error: "Tanggal jatuh tempo harus antara 1 sampai 31." },
        { status: 400 }
      );
    }

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json(
        { error: "Rekening sumber wajib dipilih." },
        { status: 400 }
      );
    }

    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { error: "Kategori pengeluaran wajib dipilih." },
        { status: 400 }
      );
    }

    // Pastikan rekening dan kategori milik user ini
    const [account, category] = await Promise.all([
      prisma.account.findFirst({
        where: { id: accountId, userId },
      }),
      prisma.category.findFirst({
        where: { id: categoryId, userId },
      }),
    ]);

    if (!account) {
      return NextResponse.json(
        { error: "Rekening sumber tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    const newBill = await prisma.bill.create({
      data: {
        userId,
        name: name.trim(),
        amount: parsedAmount,
        dueDay: parsedDueDay,
        autoDeduct: autoDeduct !== false,
        accountId,
        categoryId,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
            balance: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            colorHex: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json({ bill: newBill }, { status: 201 });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { error: "Gagal membuat tagihan baru" },
      { status: 500 }
    );
  }
}
