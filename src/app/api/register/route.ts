import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { bootstrapUserData } from "@/lib/userBootstrap";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // 1. Validasi Input
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nama lengkap minimal 2 karakter" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Format alamat email tidak valid" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Periksa apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk menggunakan akun tersebut." },
        { status: 409 }
      );
    }

    // 3. Hash password dengan bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Buat user di database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 5. Bootstrap dompet awal "Kas Tunai" (saldo Rp 0) dan 11 kategori standar
    try {
      await bootstrapUserData(newUser.id);
    } catch (bootstrapError) {
      console.error("Gagal melakukan bootstrap data user:", bootstrapError);
      // Data user tetap tersimpan
    }

    return NextResponse.json(
      {
        message: "Akun berhasil didaftarkan",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mendaftarkan akun" },
      { status: 500 }
    );
  }
}
