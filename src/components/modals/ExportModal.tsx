"use client";

import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useAccounts, useRecentTransactions } from "@/hooks/useFinance";
import {
  exportToCSV,
  exportToXLSX,
  triggerPrintReport,
} from "@/lib/exportUtils";
import { formatCurrency } from "@/lib/formatters";
import { TransactionType, TransactionWithRelations } from "@/types";

export function ExportModal() {
  const { isExportModalOpen, setExportModalOpen } = useAppStore();
  const { data: accountsData } = useAccounts();
  const { data: transactionsData } = useRecentTransactions(200);

  const accounts = useMemo(() => accountsData?.accounts || [], [accountsData]);
  const transactions: TransactionWithRelations[] = useMemo(
    () => transactionsData?.transactions || [],
    [transactionsData]
  );
  const totalNetWorth = accountsData?.totalNetWorth || 0;

  // Filter States
  const [period, setPeriod] = useState<"all" | "month" | "30d" | "custom">("month");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Compute filtered transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === "30d") {
      start = new Date(now.getTime() - 30 * 86400000);
      start.setHours(0, 0, 0, 0);
    } else if (period === "custom") {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
    }

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      if (start && txDate < start) return false;
      if (end && txDate > end) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (
        accountFilter !== "all" &&
        tx.accountId !== accountFilter &&
        tx.toAccountId !== accountFilter
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, period, customStart, customEnd, typeFilter, accountFilter]);

  // Aggregate stats for preview
  const { totalIncome, totalExpense, netCashFlow } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === "income") inc += tx.amount;
      if (tx.type === "expense") exp += tx.amount;
    }
    return { totalIncome: inc, totalExpense: exp, netCashFlow: inc - exp };
  }, [filteredTransactions]);

  const periodLabel = useMemo(() => {
    if (period === "month") {
      return `Bulan ${new Date().toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })}`;
    }
    if (period === "30d") return "30 Hari Terakhir";
    if (period === "custom") {
      return `${customStart || "Awal"} s/d ${customEnd || "Hari Ini"}`;
    }
    return "Semua Waktu";
  }, [period, customStart, customEnd]);

  // Handler: CSV
  const handleExportCSV = () => {
    exportToCSV(filteredTransactions, `FinPulse_Laporan_${period}`);
  };

  // Handler: XLSX
  const handleExportXLSX = () => {
    exportToXLSX({
      transactions: filteredTransactions,
      accounts,
      summary: {
        totalNetWorth,
        totalIncome,
        totalExpense,
        netCashFlow,
        savingsRate:
          totalIncome > 0
            ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100 * 10) / 10
            : 0,
      },
      periodLabel,
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#10B981", "#6366F1", "#38BDF8"],
    });
  };

  // Handler: Print PDF
  const handlePrintPDF = () => {
    triggerPrintReport();
  };

  return (
    <Modal
      isOpen={isExportModalOpen}
      onClose={() => setExportModalOpen(false)}
      title="Ekspor & Cetak Laporan"
      description="Unduh pembukuan keuangan dalam format CSV, Excel (XLSX), atau Cetak Ringkasan ke PDF."
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4 mt-1">
        {/* Filters Section */}
        <div className="p-4 rounded-2xl bg-charcoal-900/90 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kustomisasi Data Ekspor</span>
          </div>

          {/* Period selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-charcoal-950 border border-white/[0.06]">
            {(
              [
                { id: "month", label: "Bulan Ini" },
                { id: "30d", label: "30 Hari" },
                { id: "all", label: "Semua" },
                { id: "custom", label: "Kustom" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold min-h-[38px] transition-all ${
                  period === opt.id
                    ? "bg-emerald-500 text-charcoal-950 font-bold shadow-glow-emerald"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if custom is selected */}
          {period === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Dari Tanggal:
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 min-h-[40px] rounded-xl bg-charcoal-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Sampai Tanggal:
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 min-h-[40px] rounded-xl bg-charcoal-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Type & Account Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-medium">
                Tipe Transaksi:
              </label>
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "all" | TransactionType)
                }
                className="w-full px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Tipe</option>
                <option value="income">Pemasukan Saja</option>
                <option value="expense">Pengeluaran Saja</option>
                <option value="transfer">Transfer Saja</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-medium">
                Akun / Dompet:
              </label>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Akun</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {filteredTransactions.length} Transaksi Terpilih
              </span>
              <span className="text-[11px] text-gray-400 block">
                Periode: {periodLabel}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-emerald-400 tabular-nums block">
              {formatCurrency(netCashFlow)}
            </span>
            <span className="text-[10px] text-gray-400 block">
              Arus Kas Bersih
            </span>
          </div>
        </div>

        {/* Action Buttons: 3 Options */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Option 1: CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-charcoal-900/80 hover:bg-charcoal-800 border border-white/10 hover:border-emerald-500/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block group-hover:text-emerald-400 transition-colors">
                  Unduh Format CSV (.csv)
                </span>
                <span className="text-[11px] text-gray-400 block">
                  Kompatibel universal dengan Google Sheets, Numbers, & Database.
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 ml-2 whitespace-nowrap">
              CSV
            </span>
          </button>

          {/* Option 2: XLSX */}
          <button
            type="button"
            onClick={handleExportXLSX}
            className="flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-charcoal-900/80 hover:bg-charcoal-800 border border-white/10 hover:border-blue-500/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block group-hover:text-blue-400 transition-colors">
                  Unduh Microsoft Excel (.xlsx)
                </span>
                <span className="text-[11px] text-gray-400 block">
                  Workbook 3 sheet rapi: Ringkasan Eksekutif, Transaksi, & Dompet.
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-400 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 ml-2 whitespace-nowrap">
              Excel
            </span>
          </button>

          {/* Option 3: Print / PDF */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-charcoal-900/80 hover:bg-charcoal-800 border border-white/10 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block group-hover:text-indigo-300 transition-colors">
                  Cetak Ringkasan Visual ke PDF
                </span>
                <span className="text-[11px] text-gray-400 block">
                  Format A4 siap cetak atau langsung &quot;Simpan sebagai PDF&quot; di browser.
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-400 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 ml-2 whitespace-nowrap">
              PDF / Print
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
