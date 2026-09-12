import { GoogleGenAI, Type } from "@google/genai";

export interface UserAccountContext {
  id: string;
  name: string;
  type: string;
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

export interface ParsedTransactionResult {
  isTransaction: boolean;
  type: "EXPENSE" | "INCOME" | "TRANSFER" | null;
  amount: number;
  accountName: string | null;
  categoryName: string | null;
  description: string | null;
  toAccountName?: string | null;
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
      type: null,
      amount: 0,
      accountName: null,
      categoryName: null,
      description: null,
      toAccountName: null,
      replyMessage:
        "👋 *Halo! Saya Bot Keuangan FinPulse.*\n\n" +
        "Saya dapat mencatat transaksi keuangan Anda secara otomatis. Kirimkan pesan dengan format bebas, contoh:\n" +
        "• _Makan siang 25rb pakai Kas_\n" +
        "• _Beli bensin 50k lewat BCA_\n" +
        "• _Gaji freelance 1.5jt masuk Jago_\n" +
        "• _Transfer 200rb dari BCA ke ShopeePay_",
    };
  }

  // Cari pola nominal (misal 50k, 25rb, 1.5jt, 50000)
  const amountRegex = /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i;
  const match = lower.match(amountRegex);

  if (!match) {
    return {
      isTransaction: false,
      type: null,
      amount: 0,
      accountName: null,
      categoryName: null,
      description: null,
      toAccountName: null,
      replyMessage:
        "🤔 Maaf, saya tidak menemukan nominal transaksi dalam pesan Anda.\n\n" +
        "Contoh pesan yang valid:\n" +
        "• _Kopi Kenangan 28rb_\n" +
        "• _Bensin 50k pakai BCA_\n" +
        "• _Transfer 100rb dari BCA ke Kas_",
    };
  }

  let rawNum = parseFloat(match[1].replace(",", "."));
  const unit = (match[2] || "").toLowerCase();
  if (unit === "k" || unit === "rb" || unit === "ribu") rawNum *= 1000;
  if (unit === "jt" || unit === "juta") rawNum *= 1000000;

  // Deteksi tipe
  let txType: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE";
  if (lower.includes("transfer") || lower.includes("trf") || lower.includes("kirim") || lower.includes("topup") || lower.includes("top up")) {
    txType = "TRANSFER";
  } else if (lower.includes("gaji") || lower.includes("dapat") || lower.includes("masuk") || lower.includes("pemasukan") || lower.includes("income") || lower.includes("bonus")) {
    txType = "INCOME";
  }

  // Pilih akun terdekat
  const matchedAcc = accounts.find((a) => lower.includes(a.name.toLowerCase())) || accounts[0];
  const matchedCat = categories.find((c) => lower.includes(c.name.toLowerCase())) || categories[0];

  return {
    isTransaction: true,
    type: txType,
    amount: Math.round(rawNum),
    accountName: matchedAcc?.name || "Kas Tunai",
    categoryName: matchedCat?.name || "Lain-lain",
    description: text,
    toAccountName: txType === "TRANSFER" ? (accounts.find((a) => a.id !== matchedAcc?.id)?.name || null) : null,
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
    .map((a) => `- ${a.name} (tipe: ${a.type})`)
    .join("\n");

  const categoryListStr = categories
    .map((c) => `- ${c.name} (tipe: ${c.type})`)
    .join("\n");

  const systemInstruction = `Anda adalah asisten AI pencatat transaksi keuangan pribadi untuk FinPulse.
Tugas Anda adalah membaca dan menganalisis pesan percakapan singkat dalam bahasa Indonesia yang dikirim pengguna melalui WhatsApp, lalu mengekstrak data transaksi terstruktur.

Daftar Akun/Dompet yang dimiliki pengguna saat ini:
${accountListStr || "(Belum ada akun terdaftar)"}

Daftar Kategori yang dimiliki pengguna saat ini:
${categoryListStr || "(Belum ada kategori terdaftar)"}

Aturan Pemrosesan:
1. Validasi Transaksi (isTransaction):
   - Bernilai TRUE jika pesan berisi aktivitas keuangan nyata seperti pengeluaran (beli makanan, bayar tagihan, belanja, bensin), pemasukan (gaji, freelance, transfer masuk, hadiah, investasi), atau transfer antar rekening/e-wallet.
   - Bernilai FALSE jika pesan HANYA salam (halo, p, assalamualaikum, tes), pertanyaan cara pakai, atau obrolan umum tanpa nominal transaksi.
   - Jika isTransaction FALSE, buat pesan ramah di 'replyMessage' yang membimbing pengguna dengan memberikan contoh pesan yang dapat dicatat.

2. Penentuan Tipe Transaksi (type):
   - "EXPENSE": Untuk pengeluaran, belanja, makan, pembelian barang/jasa.
   - "INCOME": Untuk pemasukan, penerimaan gaji, cashback, dividen, freelance.
   - "TRANSFER": Untuk transfer antar rekening pengguna, atau top-up dompet digital (misal: "Top up GoPay 100rb dari BCA", "Transfer 500rb ke Mandiri").

3. Ekstraksi Nominal (amount):
   - Ubah singkatan angka bahasa Indonesia menjadi angka murni positif (number):
     * "k", "rb", "ribu" = dikalikan 1.000 (contoh: "25k" -> 25000, "150rb" -> 150000).
     * "jt", "juta" = dikalikan 1.000.000 (contoh: "1.5jt" -> 1500000, "2jt" -> 2000000).
     * Format ribuan: "50.000" -> 50000.
   - Isi 0 jika isTransaction FALSE.

4. Pencocokan Akun (accountName & toAccountName):
   - Cocokkan 'accountName' dengan nama akun dari daftar akun pengguna yang paling mendekati (fuzzy/semantic matching).
   - Jika pengguna tidak menyebutkan akun secara jelas, gunakan akun bertipe 'cash' (seperti "Kas Tunai") atau akun pertama dalam daftar akun.
   - Khusus jika bertipe "TRANSFER":
     * 'accountName' adalah akun sumber dana asal.
     * 'toAccountName' adalah akun tujuan penerima dana.

5. Pencocokan Kategori (categoryName):
   - Cocokkan dengan salah satu kategori yang ada pada daftar kategori pengguna secara semantik:
     * Makanan, kopi, camilan, sarapan, resto -> Kategori Makanan/Minuman
     * Bensin, parkir, ojol, grab, gojek, tol -> Kategori Transportasi
     * Nonton, bioskop, game, netflix -> Kategori Hiburan
     * Baju, belanja online, marketplace -> Kategori Belanja
     * Listrik, air, wifi, pulsa, tagihan -> Kategori Tagihan & Utilitas
     * Gaji, bonus, freelance -> Kategori pemasukan yang sesuai
   - Jika bertipe "TRANSFER", categoryName bisa diisi "Transfer" atau nama kategori umum.

6. Deskripsi (description):
   - Buat judul/keterangan transaksi yang ringkas, jelas, dan rapi dalam Bahasa Indonesia (contoh: "Beli Nasi Padang", "Bensin Motor Pertalite", "Gaji Bulanan", "Top Up ShopeePay").`;

  const modelName =
    process.env.GEMINI_MODEL || "gemini-3.6-flash";

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
                "True jika pesan merupakan transaksi keuangan yang valid, false jika hanya obrolan/pertanyaan.",
            },
            type: {
              type: Type.STRING,
              description: "Tipe transaksi: EXPENSE, INCOME, atau TRANSFER.",
            },
            amount: {
              type: Type.NUMBER,
              description: "Nominal transaksi dalam angka positif murni.",
            },
            accountName: {
              type: Type.STRING,
              description:
                "Nama akun asal yang dicocokkan dengan daftar akun user.",
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
                "Nama akun tujuan khusus jika transaksi bertipe TRANSFER.",
            },
            replyMessage: {
              type: Type.STRING,
              description:
                "Pesan balasan ramah jika bukan transaksi atau butuh panduan.",
            },
          },
          required: [
            "isTransaction",
            "type",
            "amount",
            "accountName",
            "categoryName",
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

    const validTypes = ["EXPENSE", "INCOME", "TRANSFER"];
    const normalizedType = validTypes.includes(parsed.type?.toUpperCase())
      ? (parsed.type.toUpperCase() as "EXPENSE" | "INCOME" | "TRANSFER")
      : "EXPENSE";

    const cleanNullable = (val?: string | null) => {
      if (!val) return null;
      const s = String(val).trim();
      if (s === ":null" || s === "null" || s === "undefined" || s === "") return null;
      return s;
    };

    return {
      isTransaction: Boolean(parsed.isTransaction),
      type: parsed.isTransaction ? normalizedType : null,
      amount: typeof parsed.amount === "number" ? Math.max(0, parsed.amount) : 0,
      accountName: parsed.accountName || accounts[0]?.name || "Kas Tunai",
      categoryName: parsed.categoryName || categories[0]?.name || "Lain-lain",
      description: parsed.description || message,
      toAccountName: cleanNullable(parsed.toAccountName),
      replyMessage: cleanNullable(parsed.replyMessage),
    };
  } catch (error) {
    console.error("[GEMINI PARSER ERROR]", error);
    return fallbackRuleBasedParser(message, accounts, categories);
  }
}
