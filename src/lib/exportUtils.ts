import * as XLSX from "xlsx";
import { Account, TransactionWithRelations } from "@/types";

/**
 * Format helper untuk nilai sel CSV sesuai RFC 4180
 */
function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Ekspor daftar transaksi ke file CSV dengan UTF-8 Byte Order Mark (\uFEFF)
 */
export function exportToCSV(
  transactions: TransactionWithRelations[],
  filenamePrefix: string = "FinPulse_Laporan_Transaksi"
): void {
  const headers = [
    "ID Transaksi",
    "Tanggal",
    "Waktu",
    "Tipe",
    "Deskripsi / Catatan",
    "Kategori",
    "Akun Asal",
    "Akun Tujuan",
    "Nominal (IDR)",
    "Tagar",
  ];

  const rows = transactions.map((tx) => {
    const txDate = new Date(tx.date);
    const dateStr = txDate.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const timeStr = txDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const typeLabel =
      tx.type === "income"
        ? "Pemasukan"
        : tx.type === "expense"
        ? "Pengeluaran"
        : "Transfer";

    return [
      escapeCSV(tx.id),
      escapeCSV(dateStr),
      escapeCSV(timeStr),
      escapeCSV(typeLabel),
      escapeCSV(tx.description || "-"),
      escapeCSV(tx.category?.name || (tx.type === "transfer" ? "Transfer Antar Akun" : "Tanpa Kategori")),
      escapeCSV(tx.account.name),
      escapeCSV(tx.toAccount?.name || "-"),
      escapeCSV(tx.amount),
      escapeCSV(tx.tags || "-"),
    ].join(",");
  });

  // UTF-8 BOM (\uFEFF) agar Microsoft Excel membuka karakter UTF-8 secara otomatis
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${today}.csv`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface XLSXExportData {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  summary?: {
    totalNetWorth: number;
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    savingsRate?: number;
  };
  periodLabel?: string;
}

/**
 * Ekspor laporan komprehensif ke format Microsoft Excel (.xlsx) dengan 3 Sheet:
 * 1. Ringkasan Eksekutif
 * 2. Rincian Transaksi
 * 3. Status Rekening & Dompet
 */
export function exportToXLSX(
  data: XLSXExportData,
  filenamePrefix: string = "FinPulse_Laporan_Keuangan"
): void {
  const { transactions, accounts, summary, periodLabel } = data;
  const wb = XLSX.utils.book_new();

  const exportDate = new Date().toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

  // -------------------------------------------------------------
  // Sheet 1: Ringkasan Eksekutif
  // -------------------------------------------------------------
  const summaryRows: (string | number)[][] = [
    ["FINPULSE - LAPORAN KEUANGAN PRIBADI"],
    ["Waktu Cetak:", exportDate],
    ["Periode Laporan:", periodLabel || "Semua Waktu"],
    [],
    ["METRIK KEUANGAN", "NILAI (IDR) / PERSENTASE"],
    ["Total Kekayaan Bersih (Net Worth)", summary?.totalNetWorth ?? 0],
    ["Total Pemasukan", summary?.totalIncome ?? 0],
    ["Total Pengeluaran", summary?.totalExpense ?? 0],
    ["Arus Kas Bersih (Net Cash Flow)", summary?.netCashFlow ?? 0],
    ["Tingkat Tabungan (Savings Rate)", `${summary?.savingsRate ?? 0}%`],
    ["Jumlah Transaksi", transactions.length],
    ["Jumlah Akun Aktif", accounts.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 35 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Eksekutif");

  // -------------------------------------------------------------
  // Sheet 2: Daftar Transaksi
  // -------------------------------------------------------------
  const txData = transactions.map((tx, idx) => {
    const txDate = new Date(tx.date);
    const dateStr = txDate.toLocaleDateString("id-ID");
    const timeStr = txDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const typeLabel =
      tx.type === "income"
        ? "Pemasukan"
        : tx.type === "expense"
        ? "Pengeluaran"
        : "Transfer";

    return {
      No: idx + 1,
      "ID Transaksi": tx.id,
      Tanggal: dateStr,
      Waktu: timeStr,
      Tipe: typeLabel,
      "Deskripsi / Catatan": tx.description || "-",
      Kategori:
        tx.category?.name ||
        (tx.type === "transfer" ? "Transfer Antar Akun" : "Tanpa Kategori"),
      "Akun Asal": tx.account.name,
      "Akun Tujuan": tx.toAccount?.name || "-",
      "Nominal (IDR)": tx.amount,
      Tagar: tx.tags || "-",
    };
  });

  const wsTransactions = XLSX.utils.json_to_sheet(txData);
  wsTransactions["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 30 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, "Daftar Transaksi");

  // -------------------------------------------------------------
  // Sheet 3: Status Akun & Dompet
  // -------------------------------------------------------------
  const accountsData = accounts.map((acc, idx) => {
    const typeLabelMap: Record<string, string> = {
      bank: "Bank Account",
      cash: "Kas Tunai",
      ewallet: "E-Wallet",
      investment: "Investasi",
      credit: "Kredit / PayLater",
    };

    return {
      No: idx + 1,
      "Nama Akun / Dompet": acc.name,
      Tipe: typeLabelMap[acc.type] || acc.type,
      "Saldo Saat Ini (IDR)": acc.balance,
      "Mata Uang": acc.currency,
      Status: acc.isActive ? "Aktif" : "Nonaktif",
    };
  });

  const wsAccounts = XLSX.utils.json_to_sheet(accountsData);
  wsAccounts["!cols"] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAccounts, "Status Akun");

  // Unduh workbook .xlsx
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${today}.xlsx`);
}

/**
 * Pemicu cetak browser / Simpan ke PDF
 */
export function triggerPrintReport(): void {
  if (typeof window !== "undefined") {
    window.print();
  }
}
