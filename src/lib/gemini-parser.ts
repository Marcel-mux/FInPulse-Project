import { GoogleGenAI, Type } from "@google/genai";

export interface UserAccountContext {
  id: string;
  name: string;
  type: string;
  accountCategory?: string;
  creditLimit?: number | null;
  balance?: number;
}

export interface UserCategoryContext {
  id: string;
  name: string;
  type: string;
}

export interface ParseTransactionOptions {
  message: string;
  accounts: UserAccountContext[];
  categories: UserCategoryContext[];
}

export type TransactionAction =
  | "TRANSACTION"
  | "SET_PAYLATER_LIMIT"
  | "PAY_BILL_PAYLATER";

export interface ParsedTransactionResult {
  isTransaction: boolean;
  action: TransactionAction;
  type: "EXPENSE" | "INCOME" | "TRANSFER" | null;
  amount: number;
  accountName: string | null;
  categoryName: string | null;
  description: string | null;
  toAccountName?: string | null;
  paylaterProvider?: string | null;
  replyMessage?: string | null;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.warn(
      "[GEMINI] GEMINI_API_KEY belum disetel di environment variable (.env)."
    );
    return null;
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * Fallback parser berbasis aturan sederhana jika GEMINI_API_KEY belum tersedia
 * atau jika API Gemini mengalami gangguan jaringan.
 */
function fallbackRuleBasedParser(
  message: string,
  accounts: UserAccountContext[],
  categories: UserCategoryContext[]
): ParsedTransactionResult {
  const text = message.trim();
  const lower = text.toLowerCase();

  // Deteksi sapaan / non-transaksi
  const greetingKeywords = ["halo", "hai", "p", "assalamualaikum", "menu", "bantuan", "help", "tes", "test"];
  if (greetingKeywords.some((g) => lower === g || lower.startsWith(g + " "))) {
    return {
      isTransaction: false,
      action: "TRANSACTION",
      type: null,
      amount: 0,
      accountName: null,
      categoryName: null,
      description: null,
      toAccountName: null,
      paylaterProvider: null,
      replyMessage:
        "👋 *Halo! Saya Bot Keuangan FinPulse.*\n\n" +
        "Saya dapat mencatat transaksi dan mengelola limit Paylater Anda secara otomatis:\n" +
        "• _Makan siang 25rb pakai Kas_\n" +
        "• _Beli sepatu 300rb pakai SPayLater_\n" +
        "• _Set limit SPayLater 5jt_\n" +
        "• _Bayar tagihan SPayLater 300rb dari BCA_\n" +
        "• _Transfer 200rb dari BCA ke ShopeePay_",
    };
  }

  // Cari pola nominal (misal 50k, 25rb, 1.5jt, 50000)
  const amountRegex = /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i;
  const match = lower.match(amountRegex);

  if (!match) {
    return {
      isTransaction: false,
      action: "TRANSACTION",
      type: null,
      amount: 0,
      accountName: null,
      categoryName: null,
      description: null,
      toAccountName: null,
      paylaterProvider: null,
      replyMessage:
        "🤔 Maaf, saya tidak menemukan nominal dalam pesan Anda.\n\n" +
        "Contoh format yang didukung:\n" +
        "• _Beli sepatu 300rb pakai SPayLater_\n" +
        "• _Set limit SPayLater 5jt_\n" +
        "• _Bayar tagihan SPayLater 300rb dari BCA_\n" +
        "• _Kopi Kenangan 28rb_",
    };
  }

  let rawNum = parseFloat(match[1].replace(",", "."));
  const unit = (match[2] || "").toLowerCase();
  if (unit === "k" || unit === "rb" || unit === "ribu") rawNum *= 1000;
  if (unit === "jt" || unit === "juta") rawNum *= 1000000;
  const parsedAmount = Math.round(rawNum);

  // Daftar provider paylater populer
  const paylaterKeywords = [
    { key: "spaylater", name: "SPayLater" },
    { key: "shopeepaylater", name: "SPayLater" },
    { key: "shopee paylater", name: "SPayLater" },
    { key: "gopaylater", name: "GoPay Later" },
    { key: "gopay later", name: "GoPay Later" },
    { key: "kredivo", name: "Kredivo" },
    { key: "akulaku", name: "Akulaku" },
    { key: "indodana", name: "Indodana" },
    { key: "atome", name: "Atome" },
    { key: "paylater", name: "Paylater" },
  ];

  const detectedPaylater = paylaterKeywords.find((p) => lower.includes(p.key));

  // 1. Intent A: SET_PAYLATER_LIMIT
  if (lower.includes("limit") || lower.includes("plafon")) {
    const providerName = detectedPaylater?.name || "SPayLater";
    return {
      isTransaction: true,
      action: "SET_PAYLATER_LIMIT",
      type: null,
      amount: parsedAmount,
      accountName: providerName,
      categoryName: null,
      description: `Set limit ${providerName}`,
      toAccountName: null,
      paylaterProvider: providerName,
      replyMessage: null,
    };
  }

  // 2. Intent B: PAY_BILL_PAYLATER
  if (
    lower.includes("bayar tagihan") ||
    lower.includes("lunasi") ||
    (lower.includes("bayar") && detectedPaylater && (lower.includes("dari") || lower.includes("pakai") || lower.includes("lewat") || lower.includes("via")))
  ) {
    const providerName = detectedPaylater?.name || "SPayLater";
    // Cari akun non-paylater untuk sumber dana
    const sourceAcc =
      accounts.find(
        (a) =>
          a.accountCategory !== "PAYLATER" &&
          lower.includes(a.name.toLowerCase())
      ) ||
      accounts.find((a) => a.accountCategory !== "PAYLATER") ||
      accounts[0];

    return {
      isTransaction: true,
      action: "PAY_BILL_PAYLATER",
      type: "EXPENSE",
      amount: parsedAmount,
      accountName: sourceAcc?.name || "BCA",
      categoryName: "Tagihan & Utilitas",
      description: `Bayar Tagihan ${providerName}`,
      toAccountName: providerName,
      paylaterProvider: providerName,
      replyMessage: null,
    };
  }

  // 3. Intent C: TRANSACTION
  let txType: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE";
  if (lower.includes("transfer") || lower.includes("trf") || lower.includes("kirim") || lower.includes("topup") || lower.includes("top up")) {
    txType = "TRANSFER";
  } else if (lower.includes("gaji") || lower.includes("dapat") || lower.includes("masuk") || lower.includes("pemasukan") || lower.includes("income") || lower.includes("bonus")) {
    txType = "INCOME";
  }

  // Pilih akun terdekat (utamakan paylater jika cocok)
  let matchedAcc: UserAccountContext | undefined;
  if (detectedPaylater) {
    matchedAcc = accounts.find((a) => a.name.toLowerCase().includes(detectedPaylater.key));
  }
  if (!matchedAcc) {
    matchedAcc = accounts.find((a) => lower.includes(a.name.toLowerCase())) || accounts[0];
  }
  const matchedCat = categories.find((c) => lower.includes(c.name.toLowerCase())) || categories[0];

  return {
    isTransaction: true,
    action: "TRANSACTION",
    type: txType,
    amount: parsedAmount,
    accountName: matchedAcc?.name || "Kas Tunai",
    categoryName: matchedCat?.name || "Lain-lain",
    description: text,
    toAccountName: txType === "TRANSFER" ? (accounts.find((a) => a.id !== matchedAcc?.id)?.name || null) : null,
    paylaterProvider: detectedPaylater?.name || null,
    replyMessage: null,
  };
}

/**
 * Parsing pesan WhatsApp menggunakan model Gemini 2.5 Flash dengan Structured Outputs JSON.
 */
export async function parseWhatsAppTransaction({
  message,
  accounts,
  categories,
}: ParseTransactionOptions): Promise<ParsedTransactionResult> {
  const client = getGeminiClient();

  // Jika GEMINI_API_KEY tidak ada, fallback ke rule-based parser
  if (!client) {
    return fallbackRuleBasedParser(message, accounts, categories);
  }

  const accountListStr = accounts
    .map(
      (a) =>
        `- ${a.name} (tipe: ${a.type}, kategori: ${a.accountCategory || "REGULAR"}${
          a.creditLimit ? `, plafon: Rp ${a.creditLimit}` : ""
        })`
    )
    .join("\n");

  const categoryListStr = categories
    .map((c) => `- ${c.name} (tipe: ${c.type})`)
    .join("\n");

  const systemInstruction = `Anda adalah asisten AI pencatat transaksi keuangan pribadi dan manajemen Paylater untuk FinPulse.
Tugas Anda adalah membaca pesan percakapan singkat dalam bahasa Indonesia yang dikirim pengguna melalui WhatsApp, lalu mengekstrak aksi dan data terstruktur.

Daftar Akun/Dompet pengguna saat ini:
${accountListStr || "(Belum ada akun terdaftar)"}

Daftar Kategori pengguna saat ini:
${categoryListStr || "(Belum ada kategori terdaftar)"}

Aturan Penentuan Aksi (action):
1. "SET_PAYLATER_LIMIT":
   - Jika pengguna ingin menyetel, mendaftarkan, menambah, atau memperbarui limit kredit / paylater (SPayLater, GoPay Later, Kredivo, Akulaku, dll).
   - Contoh: "Set limit SPayLater 5jt", "Tambah paylater GopayLater limit 3 juta", "Update limit Kredivo 10jt", "Plafon Akulaku 4 juta".
   - Set action = "SET_PAYLATER_LIMIT".
   - Set paylaterProvider = Nama provider (contoh: "SPayLater", "GoPay Later", "Kredivo", "Akulaku").
   - Set amount = Angka total plafon limit (contoh: 5000000).
   - Set isTransaction = true.

2. "PAY_BILL_PAYLATER":
   - Jika pengguna membayar / melunasi tagihan paylater menggunakan saldo rekening lain.
   - Contoh: "Bayar tagihan SPayLater 300rb dari BCA", "Lunasi GoPay Later 500rb pakai Jago", "Bayar tagihan Kredivo 200rb via Mandiri".
   - Set action = "PAY_BILL_PAYLATER".
   - Set accountName = Nama akun sumber dana pembayar (contoh: "BCA", "Jago").
   - Set toAccountName atau paylaterProvider = Nama provider paylater yang dibayar (contoh: "SPayLater").
   - Set amount = Angka nominal yang dibayar (contoh: 300000).
   - Set isTransaction = true.

3. "TRANSACTION":
   - Untuk transaksi biasa (EXPENSE, INCOME, atau TRANSFER), termasuk belanja yang menggunakan akun Paylater.
   - Contoh: "Beli sepatu 300rb pakai SPayLater", "Makan siang 35k pakai Kas", "Gaji freelance 2jt masuk BCA", "Transfer 100rb dari BCA ke ShopeePay".
   - Jika belanja menggunakan paylater, accountName adalah nama provider paylater tersebut (contoh: "SPayLater"), dan type = "EXPENSE".
   - Set action = "TRANSACTION".

Aturan Ekstraksi Nominal (amount):
- Ubah singkatan angka bahasa Indonesia menjadi angka murni positif (number):
  * "k", "rb", "ribu" = x 1.000 ("25k" -> 25000, "150rb" -> 150000).
  * "jt", "juta" = x 1.000.000 ("1.5jt" -> 1500000, "5jt" -> 5000000).
- Jika bukan transaksi atau salam belaka, isTransaction = false dan sediakan panduan ramah di 'replyMessage'.`;

  const modelName =
    process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: `Pesan pengguna WhatsApp: "${message}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: {
            isTransaction: {
              type: Type.BOOLEAN,
              description:
                "True jika pesan merupakan transaksi keuangan atau perintah limit paylater yang valid.",
            },
            action: {
              type: Type.STRING,
              description:
                "Aksi: TRANSACTION, SET_PAYLATER_LIMIT, atau PAY_BILL_PAYLATER.",
            },
            type: {
              type: Type.STRING,
              description: "Tipe transaksi: EXPENSE, INCOME, atau TRANSFER.",
            },
            amount: {
              type: Type.NUMBER,
              description: "Nominal angka positif murni.",
            },
            accountName: {
              type: Type.STRING,
              description:
                "Nama akun asal / sumber dana yang dicocokkan dengan daftar akun user.",
            },
            categoryName: {
              type: Type.STRING,
              description:
                "Nama kategori yang dicocokkan dengan daftar kategori user.",
            },
            description: {
              type: Type.STRING,
              description:
                "Deskripsi singkat dan rapi tentang transaksi ini.",
            },
            toAccountName: {
              type: Type.STRING,
              description:
                "Nama akun tujuan khusus jika transaksi bertipe TRANSFER atau PAY_BILL_PAYLATER.",
            },
            paylaterProvider: {
              type: Type.STRING,
              description:
                "Nama provider paylater (misal: SPayLater, GoPay Later, Kredivo, Akulaku).",
            },
            replyMessage: {
              type: Type.STRING,
              description:
                "Pesan balasan ramah jika bukan transaksi atau butuh panduan.",
            },
          },
          required: [
            "isTransaction",
            "action",
            "amount",
            "description",
          ],
        },
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return fallbackRuleBasedParser(message, accounts, categories);
    }

    const parsed = JSON.parse(responseText);

    const validActions = ["TRANSACTION", "SET_PAYLATER_LIMIT", "PAY_BILL_PAYLATER"];
    const normalizedAction = validActions.includes(parsed.action?.toUpperCase())
      ? (parsed.action.toUpperCase() as TransactionAction)
      : "TRANSACTION";

    const validTypes = ["EXPENSE", "INCOME", "TRANSFER"];
    const normalizedType = validTypes.includes(parsed.type?.toUpperCase())
      ? (parsed.type.toUpperCase() as "EXPENSE" | "INCOME" | "TRANSFER")
      : normalizedAction === "PAY_BILL_PAYLATER" ? "EXPENSE" : "EXPENSE";

    const cleanNullable = (val?: string | null) => {
      if (!val) return null;
      const s = String(val).trim();
      if (s === ":null" || s === "null" || s === "undefined" || s === "") return null;
      return s;
    };

    return {
      isTransaction: Boolean(parsed.isTransaction),
      action: normalizedAction,
      type: parsed.isTransaction ? normalizedType : null,
      amount: typeof parsed.amount === "number" ? Math.max(0, parsed.amount) : 0,
      accountName: cleanNullable(parsed.accountName) || accounts[0]?.name || "Kas Tunai",
      categoryName: cleanNullable(parsed.categoryName) || categories[0]?.name || "Lain-lain",
      description: cleanNullable(parsed.description) || message,
      toAccountName: cleanNullable(parsed.toAccountName),
      paylaterProvider: cleanNullable(parsed.paylaterProvider),
      replyMessage: cleanNullable(parsed.replyMessage),
    };
  } catch (error) {
    console.error("[GEMINI PARSER ERROR]", error);
    return fallbackRuleBasedParser(message, accounts, categories);
  }
}
