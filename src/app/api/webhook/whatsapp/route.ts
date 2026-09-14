import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWhatsAppTransaction } from "@/lib/gemini-parser";
import { sendWhatsAppMessage } from "@/lib/fonnte";

export const dynamic = "force-dynamic";

/**
 * Normalisasi nomor telepon:
 * 1. Menghapus domain seperti @s.whatsapp.net atau @c.us
 * 2. Menghapus semua spasi, tanda strip, kurung, dan karakter non-digit
 * 3. Mengubah awalan '08' menjadi '628'
 */
function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.split("@")[0].trim();
  cleaned = cleaned.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Format angka ke mata uang Rupiah
 */
function formatRupiah(amount: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(amount);
}

/**
 * Helper verifikasi webhook untuk gateway seperti Meta / Fonnte / Custom
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("hub.challenge") || searchParams.get("challenge");
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({
    status: "online",
    service: "FinPulse WhatsApp AI Webhook",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler utama webhook pesan WhatsApp masuk
 */
export async function POST(request: NextRequest) {
  let senderRaw = "";
  let messageRaw = "";
  let normalizedSender = "";

  try {
    let payload: Record<string, unknown> = {};

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await request.json().catch(() => ({}));
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        payload = Object.fromEntries(formData.entries());
      }
    } else {
      const rawText = await request.text().catch(() => "");
      try {
        payload = JSON.parse(rawText);
      } catch {
        const params = new URLSearchParams(rawText);
        payload = Object.fromEntries(params.entries());
      }
    }

    // [DEBUG LOG] Log seluruh payload yang diterima dari Fonnte / Gateway
    console.log("[DEBUG WEBHOOK INCOMING PAYLOAD]", JSON.stringify(payload, null, 2));

    // Ekstraksi nomor pengirim dan isi pesan dari berbagai format gateway
    senderRaw = (payload.sender ||
      payload.from ||
      payload.phone ||
      payload.waNumber ||
      payload.number ||
      payload.member ||
      "") as string;

    messageRaw = (payload.message ||
      payload.text ||
      payload.body ||
      payload.caption ||
      "") as string;

    normalizedSender = normalizePhoneNumber(senderRaw);

    // [DEBUG LOG] Log nomor dan pesan yang telah diekstrak
    console.log("[DEBUG WEBHOOK EXTRACTED]", {
      senderRaw,
      normalizedSender,
      messageRaw,
    });

    if (!senderRaw || !messageRaw) {
      console.warn("[DEBUG WEBHOOK REJECTED] Field 'sender' atau 'message' kosong.");
      return NextResponse.json(
        {
          error: "Format payload tidak valid: membutuhkan field 'sender' dan 'message'",
          receivedPayload: payload,
        },
        { status: 400 }
      );
    }

    const messageText = messageRaw.trim();
    if (!messageText) {
      console.warn("[DEBUG WEBHOOK REJECTED] Isi pesan kosong setelah di-trim.");
      return NextResponse.json({
        reply: "Pesan tidak boleh kosong.",
        status: "empty_message",
      });
    }

    // 1. Cari Pengguna Berdasarkan Nomor WhatsApp
    const phoneVariants = [
      normalizedSender,
      "0" + (normalizedSender.startsWith("62") ? normalizedSender.slice(2) : normalizedSender),
      "+" + normalizedSender,
      normalizedSender.startsWith("62") ? normalizedSender.slice(2) : normalizedSender,
    ];

    console.log("[DEBUG WEBHOOK SEARCH VARIANTS]", phoneVariants);

    let user = await prisma.user.findFirst({
      where: {
        whatsappNumber: { in: phoneVariants },
      },
      include: {
        accounts: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        categories: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Fallback: Jika tidak cocok langsung dengan 'in', cocokkan nomor semua user setelah dinormalisasi
    if (!user) {
      const allUsersWithWa = await prisma.user.findMany({
        where: { whatsappNumber: { not: null } },
        include: {
          accounts: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          },
          categories: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      user =
        allUsersWithWa.find((u) => {
          if (!u.whatsappNumber) return false;
          return normalizePhoneNumber(u.whatsappNumber) === normalizedSender;
        }) || null;
    }

    // [DEBUG LOG] Hasil pencarian user
    if (user) {
      console.log(
        `[DEBUG WEBHOOK USER FOUND] Nama: ${user.name}, Email: ${user.email}, ID: ${user.id}, Akun: ${user.accounts.length}, Kategori: ${user.categories.length}`
      );
    } else {
      console.log(`[DEBUG WEBHOOK USER NOT FOUND] Tidak ada user untuk nomor: ${normalizedSender}`);
    }

    // 2. Jika Nomor Belum Terdaftar di FinPulse
    if (!user) {
      const unregisteredReply =
        "❌ *Nomor Anda belum terdaftar di FinPulse.*\n\n" +
        `Nomor terdeteksi: *+${normalizedSender}*\n\n` +
        "Silakan masuk ke Dashboard FinPulse dan tautkan nomor WhatsApp Anda pada menu *Bot WhatsApp AI* untuk mulai mencatat transaksi otomatis.";

      console.log("[DEBUG WEBHOOK DISPATCHING UNREGISTERED REPLY TO FONNTE]");
      await sendWhatsAppMessage({
        target: normalizedSender,
        message: unregisteredReply,
      });

      return NextResponse.json({
        status: "unregistered",
        reply: unregisteredReply,
        message: unregisteredReply,
      });
    }

    // Jika pengguna belum memiliki akun/dompet aktif sama sekali
    if (user.accounts.length === 0) {
      const noAccountReply =
        "⚠️ *Anda belum memiliki dompet/rekening aktif di FinPulse.*\n\n" +
        "Silakan buat minimal satu dompet (misal: Kas Tunai atau Bank) di dashboard FinPulse terlebih dahulu.";

      console.log("[DEBUG WEBHOOK DISPATCHING NO ACCOUNT REPLY TO FONNTE]");
      await sendWhatsAppMessage({
        target: normalizedSender,
        message: noAccountReply,
      });

      return NextResponse.json({
        status: "no_accounts",
        reply: noAccountReply,
        message: noAccountReply,
      });
    }

    // 3. Analisis Pesan Menggunakan Gemini / AI Parser
    console.log("[DEBUG WEBHOOK CALLING GEMINI PARSER] Input message:", messageText);
    const parsed = await parseWhatsAppTransaction({
      message: messageText,
      accounts: user.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        accountCategory: a.accountCategory,
        creditLimit: a.creditLimit,
        balance: a.balance,
      })),
      categories: user.categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      })),
    });

    // [DEBUG LOG] Log hasil respons Gemini
    console.log("[DEBUG WEBHOOK GEMINI RESULT]", JSON.stringify(parsed, null, 2));

    // 4. Jika Pesan Bukan Transaksi (Obrolan / Pertanyaan / Sapaan)
    if (!parsed.isTransaction || !parsed.amount || parsed.amount <= 0) {
      const nonTxReply =
        parsed.replyMessage ||
        "👋 *Halo! Saya Bot AI FinPulse.*\n\n" +
        "Kirimkan pesan pencatatan keuangan Anda, contohnya:\n" +
        "• _Makan siang 25rb pakai Kas_\n" +
        "• _Beli sepatu 300rb pakai SPayLater_\n" +
        "• _Set limit SPayLater 5jt_\n" +
        "• _Bayar tagihan SPayLater 300rb dari BCA_\n" +
        "• _Transfer 100rb dari BCA ke ShopeePay_";

      console.log("[DEBUG WEBHOOK DISPATCHING NON-TRANSACTION REPLY TO FONNTE]");
      await sendWhatsAppMessage({
        target: normalizedSender,
        message: nonTxReply,
      });

      return NextResponse.json({
        status: "non_transaction",
        reply: nonTxReply,
        message: nonTxReply,
      });
    }

    const txType = parsed.type?.toLowerCase() || "expense";
    const amount = parsed.amount;

    // Helper pencocokan akun paylater
    const matchPaylaterAccount = (providerName?: string | null) => {
      const paylaters = user!.accounts.filter((a) => a.accountCategory === "PAYLATER");
      if (!providerName) return paylaters[0] || null;
      const clean = providerName.toLowerCase().trim();
      const exact = paylaters.find((a) => a.name.toLowerCase() === clean);
      if (exact) return exact;
      const sub = paylaters.find(
        (a) =>
          a.name.toLowerCase().includes(clean) || clean.includes(a.name.toLowerCase())
      );
      if (sub) return sub;
      return null;
    };

    // Helper pencocokan akun terbaik
    const matchAccount = (targetName?: string | null, excludeId?: string) => {
      const candidates = excludeId
        ? user!.accounts.filter((a) => a.id !== excludeId)
        : user!.accounts;

      if (!targetName) return candidates[0];

      const cleanTarget = targetName.toLowerCase().trim();

      // 1. Exact match
      const exact = candidates.find((a) => a.name.toLowerCase() === cleanTarget);
      if (exact) return exact;

      // 2. Substring match
      const sub = candidates.find(
        (a) =>
          a.name.toLowerCase().includes(cleanTarget) ||
          cleanTarget.includes(a.name.toLowerCase())
      );
      if (sub) return sub;

      // 3. Fallback type-based (jika disebut "cash" atau "tunai")
      if (cleanTarget.includes("cash") || cleanTarget.includes("tunai")) {
        const cashAcc = candidates.find((a) => a.type === "cash");
        if (cashAcc) return cashAcc;
      }

      return candidates[0];
    };

    // Helper pencocokan kategori terbaik
    const matchCategory = (targetName: string | null | undefined, type: string) => {
      const targetType = type === "income" ? "income" : "expense";
      const candidates = user!.categories.filter((c) => c.type === targetType);

      if (!targetName) return candidates[0] || null;

      const cleanTarget = targetName.toLowerCase().trim();

      const exact = candidates.find((c) => c.name.toLowerCase() === cleanTarget);
      if (exact) return exact;

      const sub = candidates.find(
        (c) =>
          c.name.toLowerCase().includes(cleanTarget) ||
          cleanTarget.includes(c.name.toLowerCase())
      );
      if (sub) return sub;

      return candidates[0] || null;
    };

    // 5. Eksekusi Database Menggunakan Prisma $transaction
    const executionResult = await prisma.$transaction(async (tx) => {
      // Skenario 1: SET_PAYLATER_LIMIT
      if (parsed.action === "SET_PAYLATER_LIMIT") {
        const provider = parsed.paylaterProvider || parsed.accountName || "SPayLater";
        const cleanProvider = provider.trim();
        const existing = matchPaylaterAccount(cleanProvider);

        let targetAccount;
        if (existing) {
          const previousLimit = existing.creditLimit || existing.balance || amount;
          const usedLimit = Math.max(0, previousLimit - existing.balance);
          const newBalance = Math.max(0, amount - usedLimit);

          targetAccount = await tx.account.update({
            where: { id: existing.id },
            data: {
              creditLimit: amount,
              balance: newBalance,
            },
          });
        } else {
          targetAccount = await tx.account.create({
            data: {
              userId: user!.id,
              name: cleanProvider,
              type: "credit",
              accountCategory: "PAYLATER",
              creditLimit: amount,
              balance: amount,
              currency: "IDR",
              colorHex: "#f97316",
              icon: "credit-card",
              isActive: true,
            },
          });
        }

        const reply =
          `💳 *Plafon Paylater Berhasil Disetel!*\n\n` +
          `• *Provider*: ${targetAccount.name}\n` +
          `• *Total Plafon*: ${formatRupiah(targetAccount.creditLimit || amount)}\n` +
          `• *Sisa Limit*: ${formatRupiah(targetAccount.balance)}\n` +
          `• *Status*: Siap digunakan untuk transaksi!`;

        return { reply, account: targetAccount };
      }

      // Skenario 2: PAY_BILL_PAYLATER (Bayar / Lunasi Tagihan Paylater)
      if (parsed.action === "PAY_BILL_PAYLATER") {
        const paylaterName = parsed.paylaterProvider || parsed.toAccountName || "SPayLater";
        let paylaterAccount = matchPaylaterAccount(paylaterName);

        if (!paylaterAccount) {
          const generalMatch = matchAccount(paylaterName);
          if (
            generalMatch &&
            (generalMatch.type === "credit" ||
              generalMatch.accountCategory === "PAYLATER" ||
              generalMatch.name.toLowerCase().includes("later"))
          ) {
            paylaterAccount = generalMatch;
          } else {
            throw new Error(
              `Akun Paylater "${paylaterName}" belum ditemukan. Silakan set limit terlebih dahulu dengan pesan:\n_Set limit ${paylaterName} 5jt_`
            );
          }
        }

        const regularAccounts = user!.accounts.filter(
          (a) => a.accountCategory !== "PAYLATER" && a.id !== paylaterAccount!.id
        );
        const sourceCandidate = parsed.accountName;
        const sourceAccount =
          regularAccounts.find(
            (a) =>
              sourceCandidate &&
              (a.name.toLowerCase() === sourceCandidate.toLowerCase() ||
                a.name.toLowerCase().includes(sourceCandidate.toLowerCase()))
          ) || regularAccounts[0];

        if (!sourceAccount) {
          throw new Error("Tidak ada rekening reguler aktif untuk sumber pembayaran.");
        }

        if (sourceAccount.balance < amount) {
          throw new Error(
            `Saldo *${sourceAccount.name}* tidak mencukupi untuk bayar tagihan.\n` +
            `Tersedia: ${formatRupiah(sourceAccount.balance)}, dibutuhkan: ${formatRupiah(amount)}`
          );
        }

        // Potong saldo rekening sumber
        const updatedSource = await tx.account.update({
          where: { id: sourceAccount.id },
          data: { balance: { decrement: amount } },
        });

        // Pulihkan limit paylater
        const maxLimit = paylaterAccount.creditLimit ?? (paylaterAccount.balance + amount);
        const newPaylaterBalance = Math.min(maxLimit, paylaterAccount.balance + amount);

        const updatedPaylater = await tx.account.update({
          where: { id: paylaterAccount.id },
          data: { balance: newPaylaterBalance },
        });

        // Catat mutasi pengeluaran
        const category =
          matchCategory("Tagihan & Utilitas", "expense") ||
          matchCategory("Tagihan", "expense");

        const createdTx = await tx.transaction.create({
          data: {
            userId: user!.id,
            type: "expense",
            amount,
            date: new Date(),
            accountId: sourceAccount.id,
            toAccountId: paylaterAccount.id,
            categoryId: category?.id || null,
            description: `Bayar Tagihan ${paylaterAccount.name}`,
            tags: "#whatsapp #paylater #bill",
          },
        });

        const reply =
          `🎉 *Pembayaran Tagihan Paylater Berhasil!*\n\n` +
          `• *Provider*: ${paylaterAccount.name}\n` +
          `• *Nominal Dibayar*: ${formatRupiah(amount)}\n` +
          `• *Sumber Dana*: ${sourceAccount.name}\n` +
          `• *Sisa Saldo ${sourceAccount.name}*: ${formatRupiah(updatedSource.balance)}\n` +
          `• *Sisa Limit ${paylaterAccount.name} Kini*: ${formatRupiah(updatedPaylater.balance)}${
            updatedPaylater.creditLimit ? ` / ${formatRupiah(updatedPaylater.creditLimit)}` : ""
          }`;

        return { reply, transaction: createdTx };
      }

      // Skenario 3: TRANSFER
      if (txType === "transfer") {
        const sourceAccount = matchAccount(parsed.accountName);
        if (!sourceAccount) {
          throw new Error("Akun asal tidak ditemukan");
        }

        const destAccount = matchAccount(parsed.toAccountName, sourceAccount.id);
        if (!destAccount || destAccount.id === sourceAccount.id) {
          throw new Error(
            "Untuk transfer, dibutuhkan minimal 2 akun/dompet yang berbeda. Tambahkan akun tujuan di dashboard FinPulse."
          );
        }

        // Cek saldo akun asal
        if (sourceAccount.type !== "credit" && sourceAccount.balance < amount) {
          throw new Error(
            `Saldo *${sourceAccount.name}* tidak mencukupi.\n` +
            `Tersedia: ${formatRupiah(sourceAccount.balance)}, dibutuhkan: ${formatRupiah(amount)}`
          );
        }

        // Update saldo kedua akun
        const updatedSource = await tx.account.update({
          where: { id: sourceAccount.id },
          data: { balance: { decrement: amount } },
        });

        const updatedDest = await tx.account.update({
          where: { id: destAccount.id },
          data: { balance: { increment: amount } },
        });

        // Buat record transaksi transfer
        const createdTx = await tx.transaction.create({
          data: {
            userId: user!.id,
            type: "transfer",
            amount,
            date: new Date(),
            accountId: sourceAccount.id,
            toAccountId: destAccount.id,
            description: parsed.description || `Transfer ke ${destAccount.name}`,
            tags: "#whatsapp #transfer",
          },
        });

        const reply =
          `✅ *Transfer Berhasil Dicatat!*\n\n` +
          `• *Tipe*: Transfer Antar Rekening\n` +
          `• *Nominal*: ${formatRupiah(amount)}\n` +
          `• *Dari*: ${sourceAccount.name} (Sisa: ${formatRupiah(updatedSource.balance)})\n` +
          `• *Ke*: ${destAccount.name} (Saldo: ${formatRupiah(updatedDest.balance)})\n` +
          `• *Keterangan*: ${createdTx.description}`;

        return { reply, transaction: createdTx };
      }

      // Skenario 4: PENGELUARAN (EXPENSE)
      if (txType === "expense") {
        const sourceAccount = matchAccount(parsed.accountName);
        if (!sourceAccount) {
          throw new Error("Akun pengeluaran tidak ditemukan");
        }

        const isPaylater = sourceAccount.accountCategory === "PAYLATER";

        if (sourceAccount.balance < amount) {
          if (isPaylater) {
            throw new Error(
              `Sisa limit *${sourceAccount.name}* tidak mencukupi untuk transaksi ini.\n` +
              `Tersedia: ${formatRupiah(sourceAccount.balance)}, dibutuhkan: ${formatRupiah(amount)}`
            );
          } else if (sourceAccount.type !== "credit") {
            throw new Error(
              `Saldo *${sourceAccount.name}* tidak mencukupi untuk pengeluaran ini.\n` +
              `Tersedia: ${formatRupiah(sourceAccount.balance)}, dibutuhkan: ${formatRupiah(amount)}`
            );
          }
        }

        const category = matchCategory(parsed.categoryName, "expense");

        const updatedAccount = await tx.account.update({
          where: { id: sourceAccount.id },
          data: { balance: { decrement: amount } },
        });

        const createdTx = await tx.transaction.create({
          data: {
            userId: user!.id,
            type: "expense",
            amount,
            date: new Date(),
            accountId: sourceAccount.id,
            categoryId: category?.id || null,
            description: parsed.description || "Pengeluaran via WhatsApp",
            tags: isPaylater ? "#whatsapp #paylater" : "#whatsapp",
          },
        });

        const reply = isPaylater
          ? `✅ *Pengeluaran Paylater Berhasil Dicatat!*\n\n` +
            `• *Keperluan*: ${createdTx.description}\n` +
            `• *Nominal*: ${formatRupiah(amount)}\n` +
            `• *Metode*: ${sourceAccount.name}\n` +
            `• *Kategori*: ${category?.name || "Lain-lain"}\n` +
            `• *Sisa Limit*: ${formatRupiah(updatedAccount.balance)}${
              sourceAccount.creditLimit ? ` (dari Plafon ${formatRupiah(sourceAccount.creditLimit)})` : ""
            }`
          : `✅ *Pengeluaran Berhasil Dicatat!*\n\n` +
            `• *Tipe*: Pengeluaran\n` +
            `• *Nominal*: ${formatRupiah(amount)}\n` +
            `• *Akun*: ${sourceAccount.name}\n` +
            `• *Kategori*: ${category?.name || "Lain-lain"}\n` +
            `• *Keterangan*: ${createdTx.description}\n` +
            `• *Sisa Saldo*: ${formatRupiah(updatedAccount.balance)}`;

        return { reply, transaction: createdTx };
      }

      // Skenario C: PEMASUKAN (INCOME)
      const targetAccount = matchAccount(parsed.accountName);
      if (!targetAccount) {
        throw new Error("Akun tujuan pemasukan tidak ditemukan");
      }

      const category = matchCategory(parsed.categoryName, "income");

      const updatedAccount = await tx.account.update({
        where: { id: targetAccount.id },
        data: { balance: { increment: amount } },
      });

      const createdTx = await tx.transaction.create({
        data: {
          userId: user!.id,
          type: "income",
          amount,
          date: new Date(),
          accountId: targetAccount.id,
          categoryId: category?.id || null,
          description: parsed.description || "Pemasukan via WhatsApp",
          tags: "#whatsapp",
        },
      });

      const reply =
        `✅ *Pemasukan Berhasil Dicatat!*\n\n` +
        `• *Tipe*: Pemasukan\n` +
        `• *Nominal*: ${formatRupiah(amount)}\n` +
        `• *Akun*: ${targetAccount.name}\n` +
        `• *Kategori*: ${category?.name || "Lain-lain"}\n` +
        `• *Keterangan*: ${createdTx.description}\n` +
        `• *Saldo Akhir*: ${formatRupiah(updatedAccount.balance)}`;

      return { reply, transaction: createdTx };
    });

    // [DEBUG LOG & SEND MESSAGE VIA FONNTE] Kirim balasan transaksi sukses ke WhatsApp
    console.log("[DEBUG WEBHOOK DISPATCHING SUCCESS REPLY TO FONNTE]");
    const fonnteRes = await sendWhatsAppMessage({
      target: normalizedSender,
      message: executionResult.reply,
    });
    console.log("[DEBUG WEBHOOK FONNTE SEND RESULT]", JSON.stringify(fonnteRes));

    return NextResponse.json({
      status: "success",
      reply: executionResult.reply,
      message: executionResult.reply,
      fonnte: fonnteRes,
      data: executionResult.transaction,
    });
  } catch (error) {
    console.error("[WHATSAPP WEBHOOK ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan saat memproses transaksi.";

    const friendlyReply = `⚠️ *Gagal Mencatat Transaksi*\n\n${errorMessage}`;

    // Kirim pesan error kembali ke WhatsApp pengirim jika nomor valid
    if (normalizedSender) {
      console.log("[DEBUG WEBHOOK DISPATCHING ERROR REPLY TO FONNTE]");
      await sendWhatsAppMessage({
        target: normalizedSender,
        message: friendlyReply,
      });
    }

    return NextResponse.json({
      status: "error",
      reply: friendlyReply,
      message: friendlyReply,
    });
  }
}
