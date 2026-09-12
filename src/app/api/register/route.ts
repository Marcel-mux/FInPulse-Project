import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { bootstrapUserData } from "@/lib/userBootstrap";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[REGISTER] [${new Date().toISOString()}] Menerima request pendaftaran user baru...`);

  try {
    const body = await request.json();
    const { name, email, password } = body;

    // 1. Validasi Input
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      console.warn("[REGISTER] Validasi gagal: nama tidak valid");
      return NextResponse.json(
        { error: "Nama lengkap minimal 2 karakter" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      console.warn("[REGISTER] Validasi gagal: format email tidak valid");
      return NextResponse.json(
        { error: "Format alamat email tidak valid" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      console.warn("[REGISTER] Validasi gagal: kata sandi minimal 6 karakter");
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[REGISTER] Validasi input berhasil untuk email: ${normalizedEmail}`);

    // 2. Periksa apakah email sudah terdaftar
    console.log(`[REGISTER] Memeriksa keberadaan email di database...`);
    const checkStart = Date.now();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    console.log(`[REGISTER] Cek email selesai (${Date.now() - checkStart}ms). Email ${existingUser ? "sudah ada" : "tersedia"}.`);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk menggunakan akun tersebut." },
        { status: 409 }
      );
    }

    // 3. Hash password dengan bcryptjs (salt round 10)
    console.log(`[REGISTER] Memulai hashing kata sandi dengan bcryptjs (salt: 10)...`);
    const hashStart = Date.now();
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(`[REGISTER] Hashing kata sandi selesai (${Date.now() - hashStart}ms)`);

    // 4. Buat user di database
    console.log(`[REGISTER] Menyimpan entitas user baru ke database...`);
    const dbStart = Date.now();
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
    console.log(`[REGISTER] User baru berhasil disimpan dengan ID: ${newUser.id} (${Date.now() - dbStart}ms)`);

    // 5. Bootstrap dompet awal "Kas Tunai" (saldo Rp 0) dan 11 kategori standar secara batch
    console.log(`[REGISTER] Memulai bootstrap akun awal & kategori...`);
    const bootStart = Date.now();
    try {
      await bootstrapUserData(newUser.id);
      console.log(`[REGISTER] Bootstrap data berhasil (${Date.now() - bootStart}ms)`);
    } catch (bootstrapError) {
      console.error("[REGISTER] Gagal melakukan bootstrap data user:", bootstrapError);
      // Data user tetap tersimpan agar proses pendaftaran tidak gagal total
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[REGISTER] Pendaftaran user ${normalizedEmail} SELESAI SUKSES dalam ${totalDuration}ms. Mengirim respons 201.`);

    return NextResponse.json(
      {
        message: "Akun berhasil didaftarkan",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[REGISTER] Error saat mendaftarkan akun (durasi: ${totalDuration}ms):`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan server saat mendaftarkan akun";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
