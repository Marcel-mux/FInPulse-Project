import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/fonnte";
import { formatCurrency } from "@/lib/formatters";
import { payLoanInstallment } from "@/lib/loanService";

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
            `[CRON BILLS] Menjalankan Autodebet untuk "${bill.name}" sejumlah ${bill.amount} dari ${bill.account.name}`
          );

          const isPaylater = bill.account.accountCategory === "PAYLATER";

          // 1. Validasi kecukupan limit paylater atau saldo kas
          if (isPaylater) {
            if (bill.account.balance < bill.amount) {
              console.warn(
                `[CRON BILLS] Gagal autodebet "${bill.name}": Limit Paylater ${bill.account.name} tidak mencukupi. Status OVERDUE.`
              );

              results.errors.push({
                billId: bill.id,
                name: bill.name,
                error: `Sisa limit Paylater ${bill.account.name} tidak mencukupi (${formatCurrency(bill.account.balance)})`,
              });

              // Kirim notifikasi WA peringatan limit tidak mencukupi
              if (bill.user?.whatsappNumber) {
                const waMessage =
                  `⚠️ *Autodebet Paylater Gagal: ${bill.name}*\n\n` +
                  `Autodebet tagihan bulanan Anda tidak dapat diproses karena sisa limit *${bill.account.name}* tidak mencukupi.\n\n` +
                  `• *Tagihan*: ${bill.name}\n` +
                  `• *Nominal*: ${formatCurrency(bill.amount)}\n` +
                  `• *Metode*: ${bill.account.name} (Paylater)\n` +
                  `• *Sisa Limit*: ${formatCurrency(bill.account.balance)}\n` +
                  `• *Kekurangan Limit*: ${formatCurrency(bill.amount - bill.account.balance)}\n` +
                  `• *Jatuh Tempo*: ${todayFormatted}\n\n` +
                  `_Status: Tagihan Tertunggak (OVERDUE)._\n` +
                  `Silakan lunasi limit paylater Anda atau bayar manual melalui dashboard FinPulse:\n` +
                  `👉 https://f-in-pulse-project.vercel.app/`;

                await sendWhatsAppMessage({
                  target: bill.user.whatsappNumber,
                  message: waMessage,
                }).catch((err) => {
                  console.error(
                    `[CRON BILLS] Gagal kirim WA peringatan paylater ke ${bill.user.whatsappNumber}:`,
                    err
                  );
                });
              }

              // Lewati autodebet agar status tetap OVERDUE
              continue;
            }
          } else if (bill.account.type !== "credit" && bill.account.balance < bill.amount) {
            console.warn(
              `[CRON BILLS] Gagal autodebet "${bill.name}": Saldo ${bill.account.name} tidak mencukupi. Status OVERDUE.`
            );

            results.errors.push({
              billId: bill.id,
              name: bill.name,
              error: `Saldo ${bill.account.name} tidak mencukupi (${formatCurrency(bill.account.balance)})`,
            });

            if (bill.user?.whatsappNumber) {
              const waMessage =
                `⚠️ *Autodebet Gagal: ${bill.name}*\n\n` +
                `Autodebet tagihan bulanan Anda tidak dapat diproses karena saldo rekening *${bill.account.name}* tidak mencukupi.\n\n` +
                `• *Tagihan*: ${bill.name}\n` +
                `• *Nominal*: ${formatCurrency(bill.amount)}\n` +
                `• *Rekening*: ${bill.account.name}\n` +
                `• *Saldo Tersedia*: ${formatCurrency(bill.account.balance)}\n` +
                `• *Jatuh Tempo*: ${todayFormatted}\n\n` +
                `_Status: Tagihan Tertunggak (OVERDUE)._\n` +
                `Silakan isi saldo rekening Anda atau bayar manual di dashboard FinPulse:\n` +
                `👉 https://f-in-pulse-project.vercel.app/`;

              await sendWhatsAppMessage({
                target: bill.user.whatsappNumber,
                message: waMessage,
              }).catch((err) => {
                console.error(
                  `[CRON BILLS] Gagal kirim WA peringatan ke ${bill.user.whatsappNumber}:`,
                  err
                );
              });
            }

            continue;
          }

          // 2. Eksekusi pemotongan saldo / limit
          const { updatedAccount } = await prisma.$transaction(async (tx) => {
            // a. Kurangi saldo rekening / sisa limit paylater
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
                description: `Autodebet Tagihan: ${bill.name}${isPaylater ? ` (${bill.account.name})` : ""}`,
                date: new Date(),
                tags: isPaylater
                  ? "#whatsapp #paylater #bill #autodebet"
                  : "#whatsapp #bill #autodebet",
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
            const waMessage = isPaylater
              ? `🔔 *Autodebet Paylater Berhasil: ${bill.name}*\n\n` +
                `Tagihan bulanan Anda telah berhasil dipotong otomatis dari limit ${bill.account.name}.\n\n` +
                `• *Nominal*: ${formatCurrency(bill.amount)}\n` +
                `• *Provider*: ${bill.account.name} (Paylater)\n` +
                `• *Kategori*: ${bill.category.name}\n` +
                `• *Tanggal*: ${todayFormatted}\n` +
                `• *Sisa Limit ${bill.account.name}*: ${formatCurrency(updatedAccount.balance)}${
                  bill.account.creditLimit ? ` (dari Plafon ${formatCurrency(bill.account.creditLimit)})` : ""
                }\n\n` +
                `_Status: Lunas untuk periode ini._`
              : `🔔 *Autodebet Berhasil: ${bill.name}*\n\n` +
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

    // 5. Ambil semua cicilan pinjaman yang jatuh tempo hari ini dan masih aktif
    const candidateLoans = await prisma.loan.findMany({
      where: {
        dueDay: todayDay,
        status: "ACTIVE",
        remainingMonths: { gt: 0 },
      },
      include: {
        paylaterAccount: true,
        sourceAccount: true,
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
      `[CRON LOANS] Ditemukan ${candidateLoans.length} pinjaman aktif dengan dueDay = ${todayDay}`
    );

    const loanResults = {
      totalFound: candidateLoans.length,
      paid: 0,
      skippedAlreadyPaid: 0,
      errors: [] as { loanId: string; name: string; error: string }[],
    };

    for (const loan of candidateLoans) {
      try {
        // Cek apakah cicilan bulan ini sudah dibayar
        if (loan.lastPaid) {
          const lastP = new Date(loan.lastPaid);
          const lastPWib = new Date(lastP.getTime() + 7 * 3600 * 1000);
          if (
            lastPWib.getUTCMonth() === currentMonth &&
            lastPWib.getUTCFullYear() === currentYear
          ) {
            console.log(
              `[CRON LOANS] Pinjaman "${loan.name}" (${loan.id}) sudah dibayar bulan ini. Dilewati.`
            );
            loanResults.skippedAlreadyPaid++;
            continue;
          }
        }

        // Cek apakah saldo rekening pembayar mencukupi
        if (
          loan.sourceAccount.type !== "credit" &&
          loan.sourceAccount.balance < loan.monthlyTotal
        ) {
          console.warn(
            `[CRON LOANS] Saldo ${loan.sourceAccount.name} tidak cukup untuk bayar cicilan "${loan.name}".`
          );
          loanResults.errors.push({
            loanId: loan.id,
            name: loan.name,
            error: `Saldo ${loan.sourceAccount.name} tidak mencukupi (${formatCurrency(loan.sourceAccount.balance)})`,
          });

          if (loan.user?.whatsappNumber) {
            const waWarning =
              `⚠️ *Gagal Autodebet Cicilan: ${loan.name}*\n\n` +
              `Pembayaran cicilan bulan ini tidak dapat diproses karena saldo rekening *${loan.sourceAccount.name}* tidak mencukupi.\n\n` +
              `• *Pinjaman*: ${loan.name}\n` +
              `• *Nominal Cicilan*: ${formatCurrency(loan.monthlyTotal)}\n` +
              `• *Rekening Pembayar*: ${loan.sourceAccount.name}\n` +
              `• *Saldo Tersedia*: ${formatCurrency(loan.sourceAccount.balance)}\n` +
              `• *Kekurangan*: ${formatCurrency(loan.monthlyTotal - loan.sourceAccount.balance)}\n` +
              `• *Jatuh Tempo*: Hari ini (${todayFormatted})\n\n` +
              `Silakan isi saldo rekening Anda atau lakukan pembayaran manual di FinPulse:\n` +
              `👉 https://f-in-pulse-project.vercel.app/`;

            await sendWhatsAppMessage({
              target: loan.user.whatsappNumber,
              message: waWarning,
            }).catch((err) => {
              console.error(
                `[CRON LOANS] Gagal kirim WA peringatan ke ${loan.user.whatsappNumber}:`,
                err
              );
            });
          }

          continue;
        }

        // Eksekusi pembayaran cicilan via payLoanInstallment
        await payLoanInstallment(loan.id, { sendWaNotification: true });
        loanResults.paid++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Gagal memproses cicilan";
        console.error(`[CRON LOANS] Error saat memproses cicilan "${loan.name}":`, errorMsg);
        loanResults.errors.push({
          loanId: loan.id,
          name: loan.name,
          error: errorMsg,
        });
      }
    }

    console.log("[CRON BILLS] Hasil eksekusi cron bills:", JSON.stringify(results));
    console.log("[CRON LOANS] Hasil eksekusi cron loans:", JSON.stringify(loanResults));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      wibDate: `${todayDay}/${currentMonth + 1}/${currentYear}`,
      billsSummary: results,
      loansSummary: loanResults,
    });
  } catch (error) {
    console.error("[CRON BILLS FATAL ERROR]:", error);
    return NextResponse.json(
      { error: "Fatal error pada eksekusi cron bills" },
      { status: 500 }
    );
  }
}
