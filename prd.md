# Product Requirement Document (PRD)
**Project Name:** FinPulse (Personal Financial Intelligence & Wealth Tracker)
**Version:** 1.1.0 (revisi)
**Document Status:** Ready for Development
**Target Platform:** Web App responsif, mobile-first, siap PWA

---

## 1. Executive Summary & Vision
FinPulse adalah aplikasi manajemen keuangan pribadi dengan UI kaya animasi (hyper-animated, micro-interactions halus). Mencatat arus kas harian secara presisi, mengelola multi-dompet & anggaran, dan menyajikan visualisasi data mendalam. Arsitektur future-proof: siap dikembangkan ke multi-user, integrasi mutasi bank, OCR struk, dan modul bisnis.

---

## 2. Target Persona & Core Needs
* **Primary Persona:** Profesional/solopreneur yang mengelola banyak rekening, e-wallet, dan instrumen tabungan, dan ingin visibilitas real-time terhadap arus kasnya.
* **Core Pain Points:**
  * Pencatatan keuangan manual membosankan dan cepat ditinggalkan jika UI kaku.
  * Sulit melihat ringkasan bersih dari akumulasi saldo antar dompet/bank.
  * Kurangnya insight prediktif terhadap laju pengeluaran bulanan.

---

## 3. Product Architecture & Tech Stack

### 3.1 Tech Stack (final, jangan diganti di tengah jalan)
| Layer | Pilihan |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript strict |
| Styling | Tailwind CSS |
| Animasi | Framer Motion, canvas-confetti |
| Ikon | lucide-react |
| Grafik | Recharts |
| Backend | Next.js Server Actions & Route Handlers |
| Database | SQLite via Prisma ORM (siap migrasi ke PostgreSQL/Supabase) |
| State/Data | Zustand (state lokal) + TanStack Query (fetching/cache) |

### 3.2 MVP Scope vs Fase Depan
**Masuk MVP:**
- Dashboard & Net Worth Overview
- Pencatatan transaksi (income/expense/transfer)
- Multi-account management + reconciliation
- Budgeting & burn rate
- Analytics & export laporan

**Ditunda ke Fase 2 (future roadmap):**
- AI Receipt Scanner (OCR via Gemini Vision)
- AI Financial Advisor Chatbot
- Multi-currency & exchange rate
- Modul pembukuan bisnis UMKM
- Recurring transaction engine otomatis & smart quick-tags (boleh disederhanakan jadi manual template di MVP kalau sempat)

---

## 4. Feature Specifications

### 4.1 Modul 1: Dashboard & Net Worth Overview
* Net Worth counter dengan animasi count-up
* Account Cards horizontal carousel, hover 3D tilt, warna/glow sesuai tipe akun
* Quick Action Floating Bar (Tambah Pemasukan / Pengeluaran / Transfer)
* Recent Activity Feed dengan ikon kategori beranimasi + badge status dinamis

### 4.2 Modul 2: Pencatatan Transaksi Komprehensif
* **Multi-type Ledger:** Expense, Income, Transfer (dengan validasi biaya admin opsional)
* **Metadata Input:** nominal, tanggal & waktu, kategori/subkategori, akun asal & tujuan, tagar kustom (`#liburan`, `#projectA`), catatan, lampiran struk (placeholder untuk OCR nanti)
* **Smart Quick-Tags & Recurring Engine:** template transaksi cepat (mis. "Kopi Pagi - 25k") dan pencatatan transaksi berulang

### 4.3 Modul 3: Multi-Account / Multi-Wallet Management
* Kategori dompet: Kas & Bank Operasional, E-Wallet & PayLater, Investasi & Tabungan Dingin
* Balance Reconciliation manual dengan logging selisih otomatis

### 4.4 Modul 4: Budgeting & Visual Threshold Warning
* Limit bujet dinamis per kategori (bulanan)
* Progress bar liquid-fill: <70% Emerald (aman), 70–90% Amber (perhatian), >90% Crimson + pulsing alert (kritis)
* Proyeksi Burn Rate (estimasi hari sampai bujet habis)

### 4.5 Modul 5: Financial Analytics & Interactive Reports
* Bar chart Cash Flow In vs Out, filter rentang waktu (7 hari/30 hari/3 bulan/YTD/custom)
* Donut chart breakdown kategori — klik sektor untuk filter daftar transaksi
* Area chart tren pengeluaran dengan gradient shadow
* Export Engine: CSV, XLSX, cetak ringkasan ke PDF

---

## 5. UI/UX & Motion Design Guidelines ("Modern, Elegant & Hyper-Animated")

| Area Visual | Spesifikasi Desain | Efek Animasi |
|---|---|---|
| **Color Palette** | Deep Charcoal (`#0B0F19`), glassmorphism surface, Emerald accent (`#10B981`), Indigo-Violet glow | Gradient border shifting, ambient background blur |
| **Micro-interactions** | Hover states pada kartu dan tombol | Scale spring (`whileHover={{ scale: 1.02 }}`), click ripple, haptic bounce |
| **Number Transitions** | Semua angka nominal uang | Odometer/smooth spring counter |
| **Modal & Form** | Pop-up dialog input transaksi | Slide-in dari bawah (mobile), spring fade/scale (desktop) |
| **Empty States** | Ilustrasi saat belum ada transaksi | Floating subtle icon looping animation |

---

## 6. Database Schema (Entity Relationship Diagram - ERD)

```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'cash','bank','ewallet','investment','credit'
  balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  color_hex TEXT,
  icon TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income','expense'
  icon TEXT,
  color_hex TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'income','expense','transfer'
  amount REAL NOT NULL,
  date DATETIME NOT NULL,
  account_id TEXT NOT NULL,
  to_account_id TEXT,
  category_id TEXT,
  description TEXT,
  tags TEXT,
  receipt_url TEXT,
  is_recurring INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  amount_limit REAL NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

---

## 7. Non-Functional Requirements
- **Responsif & mobile-first**: semua komponen wajib dites di lebar layar ponsel dulu, baru desktop.
- **TypeScript strict**: hindari `any`, semua props/komponen bertipe jelas.
- **Data integrity**: transaksi Transfer harus atomic (pakai `$transaction` Prisma) supaya saldo dua akun tidak pernah "nyangkut" di tengah.
- **Validasi input**: nominal tidak boleh negatif/kosong, akun asal ≠ akun tujuan saat transfer.
- **Tidak ada data hardcode** di komponen — semua dari database.

---

## 8. Future Scalability Roadmap (Potential Extensions)
1. **AI Receipt Scanner (OCR):** ambil foto struk, otomatis ekstrak nominal/tanggal/kategori via Gemini Vision API.
2. **AI Financial Advisor Chatbot:** chat interface LLM untuk menanyakan kondisi keuangan.
3. **Multi-Currency & Exchange Rates:** konversi otomatis kurs valuta asing.
4. **Modul Pembukuan Bisnis Sederhana:** pemisahan ledger personal vs operasional UMKM/toko.
