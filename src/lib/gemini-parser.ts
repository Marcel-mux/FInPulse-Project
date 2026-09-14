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
  | "PAY_BILL_PAYLATER"
  | "CREATE_BILL"
  | "CREATE_LOAN";

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
  dueDay?: number | null;
  tenor?: number | null;
  monthlyTotal?: number | null;
  monthlyPrincipal?: number | null;
  monthlyInterest?: number | null;
  isRecurring?: boolean;
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
    { key: "shopeepay paylater", name: "ShopeePay" },
    { key: "shopeepaylater", name: "ShopeePay" },
    { key: "shopee paylater", name: "ShopeePay" },
    { key: "shopeepay", name: "ShopeePay" },
    { key: "spaylater", name: "SPayLater" },
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

  // 2. Intent B: PAY_BILL_PAYLATER (Pelunasan / Bayar Tagihan Paylater)
  if (
    lower.includes("bayar tagihan paylater") ||
    lower.includes("lunasi") ||
    (lower.includes("bayar") && detectedPaylater && (lower.includes("dari") || lower.includes("pakai") || lower.includes("lewat") || lower.includes("via")))
  ) {
    const providerName = detectedPaylater?.name || "SPayLater";
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

  // Cari akun yang paling cocok (utamakan Paylater jika terdeteksi)
  let matchedAcc: UserAccountContext | undefined;
  if (detectedPaylater) {
    matchedAcc = accounts.find(
      (a) =>
        a.name.toLowerCase().includes(detectedPaylater.key) ||
        detectedPaylater.key.includes(a.name.toLowerCase()) ||
        (a.accountCategory === "PAYLATER" &&
          (a.name.toLowerCase().includes(detectedPaylater.name.toLowerCase()) ||
            detectedPaylater.name.toLowerCase().includes(a.name.toLowerCase())))
    );
    if (!matchedAcc && (detectedPaylater.key.includes("shopee") || detectedPaylater.key.includes("spay"))) {
      matchedAcc = accounts.find(
        (a) =>
          a.accountCategory === "PAYLATER" ||
          a.name.toLowerCase().includes("shopee") ||
          a.name.toLowerCase().includes("spay")
      );
    }
  }
  if (!matchedAcc) {
    matchedAcc = accounts.find((a) => lower.includes(a.name.toLowerCase())) || accounts[0];
  }

  // 3. Intent C: CREATE_LOAN (Pencatatan Pinjaman Tunai / Cicilan Paylater)
  const isLoanIntent =
    lower.includes("pinjam") ||
    lower.includes("pinjaman") ||
    (lower.includes("cicil") && (lower.includes("tenor") || lower.includes("cair")));

  if (isLoanIntent) {
    const providerName = detectedPaylater?.name || "Akulaku";

    // Tenor ekstraksi: misal "tenor 3 bulan", "tenor 3", "3 bulan", "3x"
    const tenorMatch =
      lower.match(/tenor\s*(\d+)/i) ||
      lower.match(/(\d+)\s*(?:bulan|bln)/i) ||
      lower.match(/(\d+)x/i);
    const tenor = tenorMatch ? parseInt(tenorMatch[1], 10) : 3;

    // Target pencairan: misal "cair ke BCA", "masuk BCA", "ke BCA", "cair BCA"
    const cairMatch = lower.match(/(?:cair\s*(?:ke)?|masuk\s*(?:ke)?)\s*([a-zA-Z0-9]+)/i);
    const targetCandidate = cairMatch ? cairMatch[1].toLowerCase() : "";
    const targetAcc =
      accounts.find(
        (a) =>
          a.accountCategory !== "PAYLATER" &&
          (a.name.toLowerCase().includes(targetCandidate) ||
            targetCandidate.includes(a.name.toLowerCase()))
      ) ||
      accounts.find((a) => a.accountCategory !== "PAYLATER") ||
      accounts[0];

    // Cicilan ekstraksi: misal "cicilan 383rb", "cicilan 383k", "angsuran 383000"
    const cicilanMatch = lower.match(
      /(?:cicilan|angsuran)\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i
    );
    let monthlyTotal = Math.round(parsedAmount / tenor);
    if (cicilanMatch) {
      let cNum = parseFloat(cicilanMatch[1].replace(",", "."));
      const cUnit = (cicilanMatch[2] || "").toLowerCase();
      if (cUnit === "k" || cUnit === "rb" || cUnit === "ribu") cNum *= 1000;
      if (cUnit === "jt" || cUnit === "juta") cNum *= 1000000;
      monthlyTotal = Math.round(cNum);
    }

    const dueDayMatch = lower.match(/(?:tiap|setiap)?\s*(?:tanggal|tgl)\s*(\d+)/i);
    const parsedDueDay = dueDayMatch ? parseInt(dueDayMatch[1], 10) : 20;

    const monthlyPrincipal = Math.round(parsedAmount / tenor);
    const monthlyInterest = Math.max(0, monthlyTotal - monthlyPrincipal);

    return {
      isTransaction: true,
      action: "CREATE_LOAN",
      type: "TRANSFER",
      amount: parsedAmount,
      accountName: providerName,
      categoryName: "Bunga / Biaya Pinjaman",
      description: `Pinjaman Tunai ${providerName}`,
      toAccountName: targetAcc?.name || "BCA",
      paylaterProvider: providerName,
      tenor,
      monthlyTotal,
      monthlyPrincipal,
      monthlyInterest,
      dueDay: parsedDueDay,
      isRecurring: true,
      replyMessage: null,
    };
  }

  // 4. Intent D: CREATE_BILL (Pendaftaran Tagihan Berulang)
  const isBillRegistration =
    lower.includes("tiap tanggal") ||
    lower.includes("setiap tanggal") ||
    lower.includes("tiap tgl") ||
    lower.includes("setiap tgl") ||
    (lower.includes("tagihan") && (lower.includes("tanggal") || lower.includes("tgl")));

  const dueDayMatch = lower.match(/(?:tiap|setiap)?\s*(?:tanggal|tgl)\s*(\d+)/i);
  const parsedDueDay = dueDayMatch ? parseInt(dueDayMatch[1], 10) : null;

  if (isBillRegistration && parsedDueDay) {
    const billAccountName = matchedAcc?.name || detectedPaylater?.name || "SPayLater";
    let billCat = categories.find((c) => lower.includes(c.name.toLowerCase()));
    if (!billCat) {
      if (lower.includes("spotify") || lower.includes("netflix") || lower.includes("youtube")) {
        billCat = categories.find((c) => c.name.toLowerCase().includes("hiburan")) || categories[0];
      } else {
        billCat = categories.find((c) => c.name.toLowerCase().includes("tagihan")) || categories[0];
      }
    }

    return {
      isTransaction: true,
      action: "CREATE_BILL",
      type: "EXPENSE",
      amount: parsedAmount,
      accountName: billAccountName,
      categoryName: billCat?.name || "Tagihan & Utilitas",
      description: text,
      toAccountName: null,
      paylaterProvider: detectedPaylater?.name || null,
      dueDay: parsedDueDay,
      isRecurring: true,
      replyMessage: null,
    };
  }

  // 4. Intent D: TRANSACTION (Transaksi Normal)
  let txType: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE";
  if (lower.includes("transfer") || lower.includes("trf") || lower.includes("kirim") || lower.includes("topup") || lower.includes("top up")) {
    txType = "TRANSFER";
  } else if (lower.includes("gaji") || lower.includes("dapat") || lower.includes("masuk") || lower.includes("pemasukan") || lower.includes("income") || lower.includes("bonus")) {
    txType = "INCOME";
  }

  const matchedCat = categories.find((c) => lower.includes(c.name.toLowerCase())) || categories[0];

  return {
    isTransaction: true,
    action: "TRANSACTION",
    type: txType,
    amount: parsedAmount,
    accountName: matchedAcc?.name || detectedPaylater?.name || "Kas Tunai",
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

  const systemInstruction = `Anda adalah asisten AI pencatat transaksi keuangan pribadi, tagihan berulang, dan manajemen Paylater untuk FinPulse.
Tugas Anda adalah membaca pesan percakapan singkat dalam bahasa Indonesia yang dikirim pengguna melalui WhatsApp, lalu mengekstrak aksi dan data terstruktur.

Daftar Akun/Dompet pengguna saat ini:
${accountListStr || "(Belum ada akun terdaftar)"}

Daftar Kategori pengguna saat ini:
${categoryListStr || "(Belum ada kategori terdaftar)"}

Aturan Penentuan Aksi (action):
1. "CREATE_BILL":
   - Jika pengguna mendaftarkan atau mencatat jadwal tagihan rutin bulanan / autodebet.
   - Contoh: "Tagihan Spotify 55rb tiap tanggal 10 potong ShopeePay Paylater", "Langganan Netflix 186rb autodebet GoPay Later", "Tagihan WiFi 350k tiap tgl 20 potong BCA".
   - Set action = "CREATE_BILL".
   - Set accountName = Nama akun/provider pemotong yang disebutkan.
     * PENTING: Jika pengguna menyebutkan Paylater (misal: "ShopeePay Paylater", "ShopeePay", "SPayLater", "GoPay Later", "Kredivo", "Akulaku"), ARAHKAN 'accountName' ke nama akun Paylater terkait yang cocok pada daftar akun pengguna (contoh: "ShopeePay" atau "SPayLater"). JANGAN PERNAH mengarahkan ke akun kas tunai jika pengguna sudah menyebutkan nama akun/paylater.
   - Set dueDay = Tanggal jatuh tempo bulanan berupa angka 1 - 31 (contoh: "tiap tanggal 10" -> 10).
   - Set amount = Angka nominal tagihan murni (contoh: 55000).
   - Set description = Keterangan tagihan (contoh: "Tagihan Spotify", "Langganan Netflix").
   - Set categoryName = Kategori yang sesuai (contoh: "Hiburan" atau "Tagihan & Utilitas").
   - Set isTransaction = true.

2. "SET_PAYLATER_LIMIT":
   - Jika pengguna ingin menyetel, mendaftarkan, menambah, atau memperbarui limit kredit / paylater (SPayLater, GoPay Later, Kredivo, Akulaku, dll).
   - Contoh: "Set limit SPayLater 5jt", "Tambah paylater GopayLater limit 3 juta", "Update limit Kredivo 10jt", "Plafon Akulaku 4 juta".
   - Set action = "SET_PAYLATER_LIMIT".
   - Set paylaterProvider = Nama provider (contoh: "SPayLater", "GoPay Later", "Kredivo", "Akulaku").
   - Set amount = Angka total plafon limit (contoh: 5000000).
   - Set isTransaction = true.

3. "PAY_BILL_PAYLATER":
   - Jika pengguna membayar / melunasi tagihan paylater menggunakan saldo rekening lain.
   - Contoh: "Bayar tagihan SPayLater 300rb dari BCA", "Lunasi GoPay Later 500rb pakai Jago", "Bayar tagihan Kredivo 200rb via Mandiri".
   - Set action = "PAY_BILL_PAYLATER".
   - Set accountName = Nama akun sumber dana pembayar (contoh: "BCA", "Jago").
   - Set toAccountName atau paylaterProvider = Nama provider paylater yang dibayar (contoh: "SPayLater").
   - Set amount = Angka nominal yang dibayar (contoh: 300000).
   - Set isTransaction = true.

4. "CREATE_LOAN":
   - Jika pengguna mencatat, meminjam, atau mencairkan pinjaman tunai / cicilan Paylater (Akulaku, Kredivo, SPayLater, GoPay Later, dll).
   - Contoh: "Pinjam di Akulaku 1jt tenor 3 bulan cair ke BCA, cicilan 383rb tiap tanggal 20", "Pinjaman tunai Kredivo 2 juta tenor 6 bulan masuk Mandiri angsuran 390rb tgl 15".
   - Set action = "CREATE_LOAN".
   - Set paylaterProvider = Nama provider pemberi pinjaman (contoh: "Akulaku", "Kredivo", "SPayLater").
   - Set amount = Angka total pokok pinjaman murni (contoh: 1000000).
   - Set tenor = Jumlah bulan tenor cicilan berupa angka (contoh: 3).
   - Set toAccountName = Nama rekening pencairan dana (contoh: "BCA").
   - Set monthlyTotal = Angka nominal angsuran/cicilan per bulan jika disebutkan (contoh: 383000).
   - Set dueDay = Tanggal jatuh tempo bulanan berupa angka 1 - 31 (contoh: 20).
   - Set description = Keterangan pinjaman (contoh: "Pinjaman Tunai Akulaku").
   - Set isTransaction = true.

5. "TRANSACTION":
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
                "True jika pesan merupakan transaksi keuangan, pendaftaran tagihan, atau perintah limit paylater yang valid.",
            },
            action: {
              type: Type.STRING,
              description:
                "Aksi: TRANSACTION, SET_PAYLATER_LIMIT, PAY_BILL_PAYLATER, atau CREATE_BILL.",
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
                "Nama akun asal / sumber dana / paylater yang dicocokkan dengan daftar akun user.",
            },
            categoryName: {
              type: Type.STRING,
              description:
                "Nama kategori yang dicocokkan dengan daftar kategori user.",
            },
            description: {
              type: Type.STRING,
              description:
                "Deskripsi singkat dan rapi tentang transaksi atau tagihan ini.",
            },
            dueDay: {
              type: Type.NUMBER,
              description:
                "Tanggal jatuh tempo bulanan (1-31) jika merupakan pendaftaran tagihan rutin atau cicilan.",
            },
            tenor: {
              type: Type.NUMBER,
              description:
                "Jumlah bulan tenor pinjaman / cicilan (contoh: 3, 6, 12).",
            },
            monthlyTotal: {
              type: Type.NUMBER,
              description:
                "Nominal cicilan atau angsuran per bulan (pokok + bunga).",
            },
            toAccountName: {
              type: Type.STRING,
              description:
                "Nama akun tujuan khusus jika transaksi bertipe TRANSFER, PAY_BILL_PAYLATER, atau pencairan CREATE_LOAN.",
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

    const validActions = [
      "TRANSACTION",
      "SET_PAYLATER_LIMIT",
      "PAY_BILL_PAYLATER",
      "CREATE_BILL",
      "CREATE_LOAN",
    ];
    const normalizedAction = validActions.includes(parsed.action?.toUpperCase())
      ? (parsed.action.toUpperCase() as TransactionAction)
      : "TRANSACTION";

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

    const parsedDueDay =
      typeof parsed.dueDay === "number" && parsed.dueDay >= 1 && parsed.dueDay <= 31
        ? Math.round(parsed.dueDay)
        : null;

    const parsedAmount =
      typeof parsed.amount === "number" ? Math.max(0, parsed.amount) : 0;

    const parsedTenor =
      typeof parsed.tenor === "number" && parsed.tenor >= 1
        ? Math.round(parsed.tenor)
        : null;

    const parsedMonthlyTotal =
      typeof parsed.monthlyTotal === "number" && parsed.monthlyTotal > 0
        ? Math.round(parsed.monthlyTotal)
        : parsedTenor && parsedAmount > 0
        ? Math.round(parsedAmount / parsedTenor)
        : null;

    const parsedMonthlyPrincipal =
      parsedTenor && parsedAmount > 0
        ? Math.round(parsedAmount / parsedTenor)
        : null;

    const parsedMonthlyInterest =
      parsedMonthlyTotal && parsedMonthlyPrincipal
        ? Math.max(0, parsedMonthlyTotal - parsedMonthlyPrincipal)
        : null;

    return {
      isTransaction: Boolean(parsed.isTransaction),
      action: normalizedAction,
      type: parsed.isTransaction ? normalizedType : null,
      amount: parsedAmount,
      accountName: cleanNullable(parsed.accountName) || accounts[0]?.name || "Kas Tunai",
      categoryName: cleanNullable(parsed.categoryName) || categories[0]?.name || "Lain-lain",
      description: cleanNullable(parsed.description) || message,
      toAccountName: cleanNullable(parsed.toAccountName),
      paylaterProvider: cleanNullable(parsed.paylaterProvider),
      dueDay: parsedDueDay,
      tenor: parsedTenor,
      monthlyTotal: parsedMonthlyTotal,
      monthlyPrincipal: parsedMonthlyPrincipal,
      monthlyInterest: parsedMonthlyInterest,
      isRecurring:
        normalizedAction === "CREATE_BILL" ||
        normalizedAction === "CREATE_LOAN" ||
        Boolean(parsedDueDay),
      replyMessage: cleanNullable(parsed.replyMessage),
    };
  } catch (error) {
    console.error("[GEMINI PARSER ERROR]", error);
    return fallbackRuleBasedParser(message, accounts, categories);
  }
}
