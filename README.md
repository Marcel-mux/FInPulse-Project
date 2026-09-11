# FinPulse — Personal Financial Intelligence Platform

FinPulse adalah aplikasi manajemen keuangan pribadi modern dengan antarmuka pengguna yang kaya animasi (*hyper-animated, micro-interactions* halus), performa tinggi, dan kontrol privasi data penuh berbasis SQLite lokal via Prisma ORM.

---

## Fitur Utama

- **Real-Time Net Worth & Account Carousel:**
  - Odometer counter beranimasi spring physics untuk total saldo bersih.
  - Kartu akun 3D tilt interaktif dengan pencahayaan dinamis dan glow sesuai jenis akun (Bank, Kas Tunai, E-Wallet, Investasi, PayLater).
  - Manajemen akun lengkap dengan fitur **Balance Reconciliation** (rekonsiliasi saldo aktual dan pencatatan audit log otomatis).
- **Pencatatan Transaksi Cepat & Atomik:**
  - Mendukung 3 tipe: Pemasukan, Pengeluaran, dan Transfer Antar Akun.
  - Operasi Transfer atomik menggunakan Prisma `$transaction` sehingga saldo kedua akun terjamin sinkron dan aman dari kegagalan parsial.
  - Quick Action Floating Bar untuk akses cepat pencatatan transaksi dari layar mana pun.
  - Pencarian transaksi dan filter tagar interaktif (`#liburan`, `#makan`, `#investasi`).
- **Modul Budgeting & Early Warning System:**
  - Penetapan limit anggaran bulanan per kategori pengeluaran.
  - Progress bar *liquid-fill* dengan perubahan warna dinamis:
    - `< 70%`: Hijau Emerald (Aman)
    - `70% - 90%`: Kuning Amber (Perhatian)
    - `> 90%`: Merah Crimson dengan efek pulsing alert
  - Proyeksi cerdas **Burn Rate**: estimasi sisa hari sampai limit bujet habis berdasarkan rata-rata pengeluaran harian bulan berjalan.
- **Visual Analytics (Recharts):**
  - Bar Chart interaktif Cash Flow (Pemasukan vs Pengeluaran) dengan filter periode (7 Hari, 30 Hari, 3 Bulan, YTD, dan Rentang Kustom).
  - Donut Chart breakdown kategori dengan interaksi *cross-filtering* (klik sektor donut untuk memfilter daftar transaksi terkait).
  - Area Chart tren pengeluaran harian dengan gradient shadow.
- **Export Center Multi-Format:**
  - **Ekspor CSV (.csv)** berstandar RFC 4180 dengan UTF-8 BOM untuk kompatibilitas penuh di Microsoft Excel, Apple Numbers, & Google Sheets.
  - **Ekspor Microsoft Excel (.xlsx)** multi-sheet otomatis (Sheet Ringkasan Eksekutif, Daftar Transaksi, dan Status Saldo Akun).
  - **Cetak Ringkasan Visual ke PDF** beresolusi tinggi dengan stylesheet `@media print` A4 hemat tinta.
- **Mobile-First Experience:**
  - Modal dialog adaptif: slide-in dari bawah (*bottom sheet*) di layar smartphone dengan drag bar dan safe-area inset padding.
  - Target sentuh ergonomis ($\ge 44\text{px}$) untuk kenyamanan pengoperasian satu tangan.
  - Horizontal swipe carousel edge-to-edge.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript Strict Mode)
- **Styling & Design Tokens:** Tailwind CSS, Glassmorphism, Dark Mode Palette
- **Animasi & Interaksi:** Framer Motion, Canvas-Confetti
- **Visualisasi Grafik:** Recharts
- **Database & ORM:** SQLite + Prisma ORM
- **State Management & Caching:** Zustand (Client State), TanStack Query v5 (Server State & Auto-Invalidation)
- **Ekspor Dokumen:** SheetJS (`xlsx`)
- **Icon Pack:** Lucide React

---

## Panduan Instalasi & Menjalankan Aplikasi

### 1. Klon Repositori
```bash
git clone https://github.com/Marcel-mux/FInPulse-Project.git
cd FInPulse-Project
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Setup Database & Migrasi Prisma
```bash
npx prisma db push
npx prisma db seed
```

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 5. Build Produksi
```bash
npm run build
npm run start
```

---

## Lisensi
Proyek ini dibuat untuk keperluan manajemen keuangan pribadi dan bersifat **100% Open Source** (Budget Rp0).
