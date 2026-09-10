"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Scale,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useReconcileAccount } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";

export function ReconciliationModal() {
  const { isReconciliationOpen, reconcilingAccount, closeReconciliation } =
    useAppStore();

  const [actualBalanceInput, setActualBalanceInput] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reconcileMutation = useReconcileAccount();

  useEffect(() => {
    if (reconcilingAccount) {
      setActualBalanceInput(String(reconcilingAccount.balance));
      setNote("");
    }
    setError(null);
  }, [reconcilingAccount, isReconciliationOpen]);

  if (!reconcilingAccount) return null;

  const currentRecordedBalance = reconcilingAccount.balance;
  const actualBalanceNum = parseFloat(actualBalanceInput) || 0;
  const difference = actualBalanceNum - currentRecordedBalance;
  const isSurplus = difference > 0;
  const isDeficit = difference < 0;
  const isBalanced = Math.abs(difference) < 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(actualBalanceNum)) {
      setError("Saldo aktual harus berupa angka valid");
      return;
    }

    try {
      await reconcileMutation.mutateAsync({
        id: reconcilingAccount.id,
        actualBalance: actualBalanceNum,
        note: note.trim() || undefined,
      });
      closeReconciliation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal rekonsiliasi");
    }
  };

  return (
    <Modal
      isOpen={isReconciliationOpen}
      onClose={closeReconciliation}
      title="Rekonsiliasi Saldo (Balance Reconciliation)"
      description={`Sesuaikan saldo sistem dengan saldo fisik aktual untuk akun ${reconcilingAccount.name}.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {error && (
          <div className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-xs text-crimson-400">
            {error}
          </div>
        )}

        {/* Current Recorded Balance Info */}
        <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium">
              Saldo Tercatat di Sistem
            </span>
            <div className="text-xl font-bold text-white tracking-tight">
              {formatCurrency(currentRecordedBalance)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-gray-400">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Input Actual Physical Balance */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Saldo Fisik Aktual (Di Bank / Dompet Asli)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">
              Rp
            </span>
            <input
              type="number"
              step="any"
              value={actualBalanceInput}
              onChange={(e) => setActualBalanceInput(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Dynamic Difference Calculation Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isBalanced
              ? "bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-400"
              : isSurplus
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-crimson-500/10 border-crimson-500/30 text-crimson-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : isSurplus ? (
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-crimson-400" />
              )}
              <span className="text-xs font-semibold">
                {isBalanced
                  ? "Saldo Sudah Sesuai (Seimbang)"
                  : isSurplus
                  ? "Selisih Lebih (Surplus)"
                  : "Selisih Kurang (Defisit)"}
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums">
              {isSurplus ? "+" : isDeficit ? "-" : ""}
              {formatCurrency(Math.abs(difference))}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
            {isBalanced
              ? "Tidak ada penyesuaian yang perlu dicatat."
              : isSurplus
              ? "Sistem akan secara otomatis mencatat transaksi Pemasukan Penyesuaian agar saldo akun bertambah sesuai nilai aktual."
              : "Sistem akan secara otomatis mencatat transaksi Pengeluaran Penyesuaian agar saldo akun berkurang sesuai nilai aktual."}
          </p>
        </div>

        {/* Note / Reason */}
        {!isBalanced && (
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Alasan Penyesuaian (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Biaya admin kartu bulanan, selisih kembalian kasir"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08] mt-2">
          <button
            type="button"
            onClick={closeReconciliation}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={reconcileMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-charcoal-950 text-xs font-bold shadow-glow-emerald hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            {reconcileMutation.isPending
              ? "Menyinkronkan..."
              : isBalanced
              ? "Tutup (Sudah Sesuai)"
              : "Sesuaikan Saldo Sekarang"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
