# FinPulse — Personal Financial Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Google_Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Turso_libSQL-4FF8D2?style=for-the-badge&logo=sqlite&logoColor=black" alt="Turso libSQL" />
  <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/NextAuth.js-purple?style=for-the-badge&logo=next.js&logoColor=white" alt="NextAuth" />
</p>

**FinPulse** adalah platform manajemen keuangan pribadi modern dengan antarmuka pengguna berbasis dark glassmorphism (*hyper-animated micro-interactions*), analitik mendalam, performa serverless tinggi, serta dilengkapi **Bot WhatsApp AI (Google Gemini 3.6 Flash)** untuk mencatat transaksi keuangan secara instan hanya melalui pesan teks WhatsApp.

---

## 🚀 Fitur Utama

### 1. 🤖 Bot WhatsApp Berbasis AI (Gemini 3.6 Flash + Fonnte Gateway)
- **Pencatatan Natural Language**: Pengguna cukup mengirim pesan santai/informal via WhatsApp (contoh: *"Makan siang 25rb pakai Kas"*, *"Beli bensin motor 35k dari BCA"*, *"Gaji freelance 1.5jt masuk Jago"*, *"Transfer 100rb dari BCA ke ShopeePay"*).
- **Structured Outputs (JSON Schema)**: Ditenagai model **Gemini 3.6 Flash** melalui SDK resmi `@google/genai` dengan skema output terstruktur yang 100% konsisten.
- **Fuzzy & Semantic Matching**: AI mencocokkan nama dompet/rekening dan kategori secara dinamis dengan data aktif milik pengguna.
- **Dukungan Singkatan Angka Indonesia**: Mengenali format `k`, `rb`, `ribu`, `jt`, `juta`, serta format titik/koma ribuan.
- **Balasan WhatsApp Otomatis**: Terintegrasi aktif dengan API gateway Fonnte (`https://api.fonnte.com/send`) untuk mengirim rincian transaksi dan sisa saldo terupdate ke WhatsApp pengirim.
- **Pesan Panduan Interaktif**: AI mengenali pesan sapaan (*"Halo"*, *"Menu"*, *"Bantuan"*) dan membalas dengan panduan pencatatan ramah.
- **Modal Integrasi WhatsApp di Dashboard**: Pengguna dapat dengan mudah menautkan atau mengganti nomor WhatsApp mereka langsung dari antarmuka FinPulse.

### 2. 💳 Real-Time Net Worth & Account Carousel
- **Odometer Counter Physics**: Tampilan total kekayaan bersih (*Net Worth*) dengan animasi counting spring physics.
- **Kartu Akun 3D Tilt**: Kartu rekening interaktif dengan efek tilt 3D, pencahayaan dinamis, dan aksen glow sesuai tipe akun (Bank, Kas Tunai, E-Wallet, Investasi, Kartu Kredit).
- **Rekonsiliasi Saldo (Balance Reconciliation)**: Fitur penyesuaian saldo aktual dengan pencatatan audit log mutasi otomatis.

### 3. ⚡ Pencatatan Transaksi Cepat & Atomik
- Mendukung 3 jenis mutasi: **Pemasukan**, **Pengeluaran**, dan **Transfer Antar Rekening**.
- **Integritas Transaksi Atomik**: Eksekusi mutasi saldo menggunakan Prisma `$transaction` sehingga saldo akun sumber dan tujuan dijamin 100% sinkron dan aman dari kegagalan parsial.
- **Quick Action Floating Bar**: Akses cepat penambahan transaksi dari halaman mana pun.
- **Pencarian & Tagging**: Filter riwayat transaksi berdasarkan tagar (`#makan`, `#liburan`, `#transfer`) dan kata kunci.

### 4. 📊 Modul Budgeting & Early Warning System
- Penetapan limit anggaran bulanan per kategori pengeluaran.
- **Liquid-Fill Progress Bar Dinamis**:
  - `< 70%`: Hijau Emerald (Aman)
  - `70% - 90%`: Kuning Amber (Perhatian)
  - `> 90%`: Merah Crimson dengan efek pulsing alert
- **Proyeksi Burn Rate Cerdas**: Estimasi sisa hari sampai bujet habis berdasarkan laju pengeluaran rata-rata harian bulan berjalan.

### 5. 📈 Visual Analytics & Cash Flow (Recharts)
- **Bar Chart Cash Flow**: Perbandingan visual Pemasukan vs Pengeluaran dengan rentang filter (7 Hari, 30 Hari, 3 Bulan, Year-To-Date, dan Rentang Kustom).
- **Donut Chart Kategori**: Distribusi pengeluaran per kategori dengan interaksi *cross-filtering* (klik irisan grafik untuk menyaring transaksi terkait).
- **Area Chart Tren Pengeluaran**: Visualisasi kurva pengeluaran harian bergradasi halus.

### 6. 📑 Pusat Ekspor Laporan Multi-Format
- **Ekspor CSV (.csv)**: Standar RFC 4180 dengan UTF-8 BOM untuk kompatibilitas di Microsoft Excel, Apple Numbers, & Google Sheets.
- **Ekspor Excel (.xlsx)**: Multi-sheet otomatis (Ringkasan Eksekutif, Buku Transaksi, dan Rekapitulasi Saldo).
- **Cetak Laporan PDF Vektor**: Tampilan cetak A4 siap print dengan stylesheet `@media print` hemat tinta.

### 7. 🔐 Autentikasi & Keamanan Multi-Tenant (NextAuth.js)
- Pendaftaran akun mandiri dengan enkripsi kata sandi menggunakan `bcryptjs` (salt round 10 dioptimalkan untuk serverless).
- **Data Isolation**: Seluruh transaksi, rekening, anggaran, dan kategori terisolasi per akun pengguna.
- **Auto-Bootstrap**: Akun baru otomatis mendapatkan dompet default *"Kas Tunai"* dan 11 kategori esensial.
- **Middleware Whitelist**: Perlindungan rute Next.js dengan pengecualian otomatis untuk webhook publik WhatsApp (`/api/webhook/whatsapp`).

### 8. 📱 Responsivitas Mobile & Desktop
- **Layout Desktop 12-Kolom**: Pemanfaatan ruang maksimal (`max-w-7xl`) dengan grid multi-kolom yang seimbang.
- **Mobile Navigation Drawer**: Menu navigasi samping slide-in interaktif dengan portal DOM dan backdrop blur.
- **Zero Horizontal Overflow**: Seluruh komponen dikunci simetris (`max-w-full overflow-x-hidden`) bebas dari margin hitam pada layar smartphone.

---

## 🛠️ Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Actions, TypeScript) |
| **Artificial Intelligence** | Google Gemini AI (`gemini-3.6-flash` via `@google/genai`) |
| **WhatsApp Gateway** | Fonnte API (`https://api.fonnte.com/send`) |
| **Styling & UI** | Tailwind CSS, Dark Mode Glassmorphism, Lucide React Icons |
| **Animasi & Interaktivitas** | Framer Motion, Canvas-Confetti |
| **Visualisasi Data** | Recharts |
| **Database & ORM** | Turso Cloud Database (libSQL) + Prisma ORM 5 |
| **Autentikasi** | NextAuth.js v4 + `bcryptjs` |
| **State Management** | Zustand (Client State) & TanStack Query v5 (Server State) |
| **Ekspor Dokumen** | SheetJS (`xlsx`) |

---

## ⚙️ Panduan Instalasi Lokal

### 1. Klon Repositori
```bash
git clone https://github.com/Marcel-mux/FInPulse-Project.git
cd FInPulse-Project
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Isi variabel environment berikut:
```env
# Database Turso (Cloud libSQL)
DATABASE_URL="libsql://your-database.turso.io"
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your_turso_jwt_auth_token"

# Autentikasi NextAuth
NEXTAUTH_SECRET="your_nextauth_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini API Key (Dapatkan gratis di https://aistudio.google.com/)
GEMINI_API_KEY="your_gemini_api_key"

# Token Gateway WhatsApp Fonnte (Dapatkan di https://fonnte.com/)
FONNTE_TOKEN="your_fonnte_token"
```

### 4. Sinkronisasi Database
Terapkan migrasi ke database Turso:
```bash
npm run db:migrate:turso
npx prisma generate
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 📲 Konfigurasi Webhook Bot WhatsApp (Fonnte)

Untuk mengaktifkan pencatatan otomatis via WhatsApp:

1. **Dapatkan Token Fonnte**:
   - Daftarkan akun di [Fonnte](https://fonnte.com/).
   - Sambungkan nomor WhatsApp Anda melalui scan QR Code di dashboard Fonnte.
   - Salin token perangkat dan masukkan ke variabel `FONNTE_TOKEN` di `.env` lokal dan Environment Variables Vercel.

2. **Atur URL Webhook**:
   - Di menu **Webhook** dashboard Fonnte, masukkan URL webhook aplikasi Anda:
     ```
     https://f-in-pulse-project.vercel.app/api/webhook/whatsapp
     ```
   - Pilih metode request: **POST**.

3. **Tautkan Nomor WhatsApp Pengguna di FinPulse**:
   - Buka aplikasi FinPulse, login ke akun Anda.
   - Klik tombol **"Bot WA"** pada header navigasi (atau di drawer menu mobile).
   - Masukkan nomor WhatsApp Anda (contoh: `081234567890`) dan klik **"Tautkan Nomor"**.

4. **Uji Coba Kirim Pesan**:
   Kirim pesan WhatsApp ke nomor bot Fonnte Anda:
   - *"Makan siang 30rb pakai kas"* ➔ Dicatat otomatis sebagai pengeluaran makanan.
   - *"Gaji freelance 2jt masuk BCA"* ➔ Dicatat otomatis sebagai pemasukan gaji.
   - *"Transfer 150rb dari BCA ke ShopeePay"* ➔ Saldo BCA berkurang, ShopeePay bertambah.

---

## 📁 Struktur Direktori Proyek

```
finpulse/
├── prisma/
│   ├── migrations/          # Riwayat migrasi database
│   └── schema.prisma        # Definisi skema Prisma ORM
├── scripts/
│   └── apply-turso-migrations.ts # Runner migrasi otomatis untuk Turso DB
├── src/
│   ├── app/
│   │   ├── analytics/       # Halaman analitik & laporan visual
│   │   ├── api/
│   │   │   ├── accounts/    # CRUD akun rekening & rekonsiliasi
│   │   │   ├── analytics/   # Endpoint data agregasi chart
│   │   │   ├── auth/        # Handler NextAuth.js
│   │   │   ├── budgets/     # CRUD anggaran bulanan
│   │   │   ├── categories/  # CRUD kategori transaksi
│   │   │   ├── register/    # Pendaftaran pengguna baru
│   │   │   ├── transactions/# CRUD transaksi keuangan
│   │   │   ├── user/        # Pengaturan pengguna & WhatsApp
│   │   │   └── webhook/     # Endpoint Webhook WhatsApp (Fonnte)
│   │   ├── login/           # Halaman masuk
│   │   ├── register/        # Halaman daftar
│   │   ├── globals.css      # Styling Tailwind & design tokens
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Dashboard utama FinPulse
│   ├── components/
│   │   ├── analytics/       # Komponen visualisasi grafik (Recharts)
│   │   ├── budget/          # Komponen kartu & progres anggaran
│   │   ├── dashboard/       # Kartu net worth, carousel akun, feed aktivitas
│   │   ├── export/          # Template laporan print PDF
│   │   ├── layout/          # Header, mobile drawer, global modals
│   │   ├── modals/          # Modal transaksi, akun, kategori, export, & Bot WA
│   │   └── ui/              # Modal base, animated counter, badges
│   ├── hooks/               # Custom React Query hooks (useFinance)
│   ├── lib/
│   │   ├── auth.ts          # Konfigurasi NextAuth
│   │   ├── exportUtils.ts   # Utilitas ekspor CSV, Excel, PDF
│   │   ├── fonnte.ts        # Helper pengirim pesan WhatsApp Fonnte
│   │   ├── formatters.ts    # Format mata uang & tanggal Indonesia
│   │   ├── gemini-parser.ts # Parser AI transaksi keuangan (Gemini 3.6 Flash)
│   │   ├── prisma.ts        # Singleton Prisma Client Turso adapter
│   │   └── userBootstrap.ts # Seeder data awal pengguna baru
│   ├── middleware.ts        # Next.js middleware (route guard & webhook whitelist)
│   ├── store/               # Zustand app store
│   └── types/               # TypeScript definitions
├── .env.example             # Template konfigurasi environment
├── package.json
└── tailwind.config.ts
```

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan manajemen keuangan pribadi modern dan bersifat **Open Source** di bawah lisensi [MIT](LICENSE).
