import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWhatsAppTransaction } from "@/lib/gemini-parser";

export const dynamic = "force-dynamic";

/**
 * Normalisasi nomor telepon:
 * Mengubah 08xx atau +628xx menjadi 628xx murni hanya angka.
 */
function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/@.*$/, "").replace(/\D/g, "");
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

    // Ekstraksi nomor pengirim dan isi pesan dari berbagai format gateway (Fonnte, Wablas, Baileys, Meta, dll)
    const senderRaw = (payload.sender ||
      payload.from ||
      payload.phone ||
      payload.waNumber ||
      payload.number ||
      "") as string;

    const messageRaw = (payload.message ||
      payload.text ||
      payload.body ||
      payload.caption ||
      "") as string;

    if (!senderRaw || !messageRaw) {
      return NextResponse.json(
        {
          error: "Format payload tidak valid: membutuhkan field 'sender' dan 'message'",
        },
        { status: 400 }
      );
    }

    const normalizedSender = normalizePhoneNumber(senderRaw);
    const messageText = messageRaw.trim();

    if (!messageText) {
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
    ];

    const user = await prisma.user.findFirst({
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

    // 2. Jika Nomor Belum Terdaftar di FinPulse
    if (!user) {
      const unregisteredReply =
        "❌ *Nomor Anda belum terdaftar di FinPulse.*\n\n" +
        `Nomor terdeteksi: *+${normalizedSender}*\n\n` +
        "Silakan masuk ke Dashboard FinPulse dan tautkan nomor WhatsApp Anda pada menu *Bot WhatsApp AI* untuk mulai mencatat transaksi otomatis.";

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

      return NextResponse.json({
        status: "no_accounts",
        reply: noAccountReply,
        message: noAccountReply,
      });
    }

    // 3. Analisis Pesan Menggunakan Gemini 2.5 Flash
    const parsed = await parseWhatsAppTransaction({
      message: messageText,
      accounts: user.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance,
      })),
      categories: user.categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      })),
    });

    // 4. Jika Pesan Bukan Transaksi (Obrolan / Pertanyaan / Sapaan)
    if (!parsed.isTransaction || !parsed.amount || parsed.amount <= 0) {
      const reply =
        parsed.replyMessage ||
        "👋 *Halo! Saya Bot AI FinPulse.*\n\n" +
        "Kirimkan pesan pencatatan keuangan Anda, contohnya:\n" +
        "• _Makan siang 25rb pakai Kas_\n" +
        "• _Bensin motor 35k via BCA_\n" +
        "• _Gaji freelance 1.5jt ke Jago_\n" +
        "• _Transfer 100rb dari BCA ke ShopeePay_";

      return NextResponse.json({
        status: "non_transaction",
        reply,
        message: reply,
      });
    }

    const txType = parsed.type?.toLowerCase() || "expense";
    const amount = parsed.amount;

    // Helper pencocokan akun terbaik
    const matchAccount = (targetName?: string | null, excludeId?: string) => {
      const candidates = excludeId
        ? user.accounts.filter((a) => a.id !== excludeId)
        : user.accounts;

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
      const candidates = user.categories.filter((c) => c.type === targetType);

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
      // Skenario A: TRANSFER
      if (txType === "transfer") {
        const sourceAccount = matchAccount(parsed.accountName);
        if (!sourceAccount) {
          throw new Error("Akun asal tidak ditemukan");
        }

        const destAccount = matchAccount(parsed.toAccountName, sourceAccount.id);
        if (!destAccount || destAccount.id === sourceAccount.id) {
          throw new Error(
            "Untuk transfer, dibutuhkan minimal 2 akun/dompet yang berbeda. Tambahkan akun tujuan di dashboard."
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
            userId: user.id,
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

      // Skenario B: PENGELUARAN (EXPENSE)
      if (txType === "expense") {
        const sourceAccount = matchAccount(parsed.accountName);
        if (!sourceAccount) {
          throw new Error("Akun pengeluaran tidak ditemukan");
        }

        if (sourceAccount.type !== "credit" && sourceAccount.balance < amount) {
          throw new Error(
            `Saldo *${sourceAccount.name}* tidak mencukupi untuk pengeluaran ini.\n` +
            `Tersedia: ${formatRupiah(sourceAccount.balance)}, dibutuhkan: ${formatRupiah(amount)}`
          );
        }

        const category = matchCategory(parsed.categoryName, "expense");

        const updatedAccount = await tx.account.update({
          where: { id: sourceAccount.id },
          data: { balance: { decrement: amount } },
        });

        const createdTx = await tx.transaction.create({
          data: {
            userId: user.id,
            type: "expense",
            amount,
            date: new Date(),
            accountId: sourceAccount.id,
            categoryId: category?.id || null,
            description: parsed.description || "Pengeluaran via WhatsApp",
            tags: "#whatsapp",
          },
        });

        const reply =
          `✅ *Pengeluaran Berhasil Dicatat!*\n\n` +
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
          userId: user.id,
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

    return NextResponse.json({
      status: "success",
      reply: executionResult.reply,
      message: executionResult.reply,
      data: executionResult.transaction,
    });
  } catch (error) {
    console.error("[WHATSAPP WEBHOOK ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan saat memproses transaksi.";

    const friendlyReply = `⚠️ *Gagal Mencatat Transaksi*\n\n${errorMessage}`;

    return NextResponse.json({
      status: "error",
      reply: friendlyReply,
      message: friendlyReply,
    });
  }
}
