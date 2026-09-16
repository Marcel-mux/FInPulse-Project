import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/fonnte";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/broadcast-update
 * Menyimpan AppRelease baru ke database dan menyiarkan pembaruan sistem ke seluruh nomor WhatsApp user aktif
 */
export async function POST(req: Request) {
  try {
    // 1. Validasi Akses Admin
    let isAuthorized = false;

    // A. Cek sesi NextAuth login
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email?.toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "marcelturangan2@gmail.com").toLowerCase().trim();

    if (sessionEmail && sessionEmail === adminEmail) {
      isAuthorized = true;
    }

    // B. Cek Header Admin Key / Bearer token (untuk script, curl, atau background job)
    const adminKeyHeader = req.headers.get("x-admin-key");
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const providedKey = adminKeyHeader || bearerToken;

    const validKeys = [
      process.env.ADMIN_SECRET_KEY,
      process.env.CRON_SECRET,
      process.env.NEXTAUTH_SECRET,
    ].filter(Boolean) as string[];

    if (providedKey && validKeys.includes(providedKey)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden", message: "Hanya admin yang memiliki izin menyiarkan pembaruan." },
        { status: 403 }
      );
    }

    // 2. Validasi Payload
    const body = await req.json().catch(() => ({}));
    const version = body?.version?.trim();
    const title = body?.title?.trim();
    const message = body?.message?.trim();

    if (!version || !title || !message) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Field 'version', 'title', dan 'message' wajib diisi.",
        },
        { status: 400 }
      );
    }

    // 3. Simpan atau Update Data Rilis ke Database
    const release = await prisma.appRelease.upsert({
      where: { version },
      update: {
        title,
        notes: message,
        releasedAt: new Date(),
      },
      create: {
        version,
        title,
        notes: message,
        releasedAt: new Date(),
      },
    });

    console.log(`[BROADCAST-UPDATE] Rilis ${version} berhasil disimpan ke database.`);

    // 4. Ambil Semua User yang Memiliki Nomor WhatsApp
    const users = await prisma.user.findMany({
      where: {
        whatsappNumber: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        whatsappNumber: true,
      },
    });

    const validUsers = users.filter(
      (u) => u.whatsappNumber && u.whatsappNumber.replace(/\D/g, "").length >= 8
    );

    console.log(
      `[BROADCAST-UPDATE] Ditemukan ${validUsers.length} pengguna aktif dengan nomor WhatsApp.`
    );

    // 5. Susun Format Pesan WhatsApp
    const broadcastText = `🚀 *Pembaruan Sistem FinPulse Baru (${version})*\n\n*${title}*\n\n${message}\n\n🌐 Buka web untuk melihat detailnya:\nhttps://f-in-pulse-project.vercel.app`;

    let sentCount = 0;
    let failedCount = 0;
    const details: Array<{ name: string; number: string; success: boolean; error?: string }> = [];

    // 6. Siarkan Pesan Secara Bertahap (Jeda 750ms antar pesan)
    for (let i = 0; i < validUsers.length; i++) {
      const u = validUsers[i];
      const target = u.whatsappNumber!.trim();

      try {
        console.log(`[BROADCAST-UPDATE] Mengirim pesan ke ${u.name} (${target})...`);
        const res = await sendWhatsAppMessage({
          target,
          message: broadcastText,
        });

        if (res.success) {
          sentCount++;
          details.push({ name: u.name, number: target, success: true });
        } else {
          failedCount++;
          details.push({
            name: u.name,
            number: target,
            success: false,
            error: res.error || "Gagal mengirim via Fonnte",
          });
        }
      } catch (err: unknown) {
        failedCount++;
        details.push({
          name: u.name,
          number: target,
          success: false,
          error: err instanceof Error ? err.message : "Kesalahan jaringan",
        });
      }

      // Jeda 750ms sebelum pesan berikutnya untuk menghindari rate limit Fonnte
      if (i < validUsers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
    }

    console.log(
      `[BROADCAST-UPDATE] Selesai: ${sentCount} terkirim, ${failedCount} gagal dari total ${validUsers.length}.`
    );

    return NextResponse.json({
      success: true,
      message: `Siaran pembaruan berhasil diproses. Berhasil: ${sentCount}, Gagal: ${failedCount}.`,
      version,
      release,
      totalTarget: validUsers.length,
      totalSent: sentCount,
      totalFailed: failedCount,
      details,
    });
  } catch (error: unknown) {
    console.error("[BROADCAST-UPDATE-ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 }
    );
  }
}
