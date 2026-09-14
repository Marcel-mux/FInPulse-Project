import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/fonnte";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    // 1. Validasi Token / Secret Vercel Cron jika dikonfigurasi
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET?.trim();
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON BILLS] Percobaan akses tanpa CRON_SECRET yang valid.");
      return NextResponse.json(
        { error: "Unauthorized cron request" },
        { status: 401 }
      );
    }

    // 2. Tentukan tanggal & waktu hari ini dalam zona waktu WIB (UTC+7)
    const wibNow = new Date(Date.now() + 7 * 3600 * 1000);
    const todayDay = wibNow.getUTCDate();
    const currentMonth = wibNow.getUTCMonth();
    const currentYear = wibNow.getUTCFullYear();

    console.log(
      `[CRON BILLS] Memulai cron job harian pada tanggal WIB: ${todayDay}/${currentMonth + 1}/${currentYear}`
    );

    // 3. Ambil semua tagihan yang jatuh tempo hari ini
    const candidateBills = await prisma.bill.findMany({
      where: {
        dueDay: todayDay,
      },
      include: {
        account: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            whatsappNumber: true,
          },
        },
      },
    });

    console.log(
      `[CRON BILLS] Ditemukan ${candidateBills.length} tagihan dengan dueDay = ${todayDay}`
    );

    const results = {
      totalFound: candidateBills.length,
      autoDeducted: 0,
      remindersSent: 0,
      skippedAlreadyDeducted: 0,
      errors: [] as { billId: string; name: string; error: string }[],
    };

    const todayFormatted = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 4. Proses setiap tagihan
    for (const bill of candidateBills) {
      try {
        // Periksa apakah tagihan sudah pernah dieksekusi di bulan & tahun berjalan
        if (bill.lastDeducted) {
          const lastD = new Date(bill.lastDeducted);
          const lastDWib = new Date(lastD.getTime() + 7 * 3600 * 1000);
          if (
            lastDWib.getUTCMonth() === currentMonth &&
            lastDWib.getUTCFullYear() === currentYear
          ) {
            console.log(
              `[CRON BILLS] Tagihan "${bill.name}" (${bill.id}) sudah didebet bulan ini. Dilewati.`
            );
            results.skippedAlreadyDeducted++;
            continue;
          }
        }

        // Skenario A: AUTODEBET AKTIF (autoDeduct == true)
        if (bill.autoDeduct) {
          console.log(
            `[CRON BILLS] Menjalankan Autodebet untuk "${bill.name}" sejumlah ${bill.amount}`
          );

          const { updatedAccount } = await prisma.$transaction(async (tx) => {
            // a. Kurangi saldo rekening
            const acc = await tx.account.update({
              where: { id: bill.accountId },
              data: {
                balance: {
                  decrement: bill.amount,
                },
              },
            });

            // b. Buat transaksi pengeluaran
            await tx.transaction.create({
              data: {
                userId: bill.userId,
                type: "expense",
                amount: bill.amount,
                accountId: bill.accountId,
                categoryId: bill.categoryId,
                description: `Autodebet Tagihan: ${bill.name}`,
                date: new Date(),
                isRecurring: true,
              },
            });

            // c. Update lastDeducted
            await tx.bill.update({
              where: { id: bill.id },
              data: {
                lastDeducted: new Date(),
              },
            });

            return { updatedAccount: acc };
          });

          results.autoDeducted++;

          // d. Kirim WhatsApp notifikasi sukses autodebet
          if (bill.user?.whatsappNumber) {
            const waMessage =
              `🔔 *Autodebet Berhasil: ${bill.name}*\n\n` +
              `Tagihan bulanan Anda telah dipotong secara otomatis oleh FinPulse.\n\n` +
              `• *Nominal*: ${formatCurrency(bill.amount)}\n` +
              `• *Rekening*: ${bill.account.name}\n` +
              `• *Kategori*: ${bill.category.name}\n` +
              `• *Tanggal*: ${todayFormatted}\n` +
              `• *Sisa Saldo*: ${formatCurrency(updatedAccount.balance)}\n\n` +
              `_Status: Lunas untuk periode ini._`;

            await sendWhatsAppMessage({
              target: bill.user.whatsappNumber,
              message: waMessage,
            }).catch((err) => {
              console.error(
                `[CRON BILLS] Gagal kirim WA autodebet ke ${bill.user.whatsappNumber}:`,
                err
              );
            });
          }
        }
        // Skenario B: PENGINGAT MANUAL (autoDeduct == false)
        else {
          console.log(
            `[CRON BILLS] Mengirim pengingat jatuh tempo untuk "${bill.name}"`
          );
          results.remindersSent++;

          if (bill.user?.whatsappNumber) {
            const waMessage =
              `⏰ *Pengingat Jatuh Tempo Tagihan: ${bill.name}*\n\n` +
              `Halo, tagihan Anda jatuh tempo hari ini!\n\n` +
              `• *Nominal*: ${formatCurrency(bill.amount)}\n` +
              `• *Jatuh Tempo*: Hari ini (${todayFormatted})\n` +
              `• *Rekening Disarankan*: ${bill.account.name}\n` +
              `• *Kategori*: ${bill.category.name}\n\n` +
              `Silakan buka dashboard FinPulse untuk menandai lunas atau membayar tagihan ini.\n` +
              `👉 https://f-in-pulse-project.vercel.app/`;

            await sendWhatsAppMessage({
              target: bill.user.whatsappNumber,
              message: waMessage,
            }).catch((err) => {
              console.error(
                `[CRON BILLS] Gagal kirim WA pengingat ke ${bill.user.whatsappNumber}:`,
                err
              );
            });
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Gagal memproses";
        console.error(
          `[CRON BILLS] Error saat memproses tagihan "${bill.name}":`,
          errorMsg
        );
        results.errors.push({
          billId: bill.id,
          name: bill.name,
          error: errorMsg,
        });
      }
    }

    console.log("[CRON BILLS] Hasil eksekusi cron:", JSON.stringify(results));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      wibDate: `${todayDay}/${currentMonth + 1}/${currentYear}`,
      summary: results,
    });
  } catch (error) {
    console.error("[CRON BILLS FATAL ERROR]:", error);
    return NextResponse.json(
      { error: "Fatal error pada eksekusi cron bills" },
      { status: 500 }
    );
  }
}
