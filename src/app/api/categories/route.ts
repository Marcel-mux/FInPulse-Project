import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where: Record<string, string> = {};
    if (type && (type === "income" || type === "expense")) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, icon, colorHex } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama kategori wajib diisi" },
        { status: 400 }
      );
    }

    if (!type || (type !== "income" && type !== "expense")) {
      return NextResponse.json(
        { error: "Tipe kategori harus 'income' atau 'expense'" },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        type,
        icon: icon || null,
        colorHex: colorHex || null,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Gagal membuat kategori baru" },
      { status: 500 }
    );
  }
}
