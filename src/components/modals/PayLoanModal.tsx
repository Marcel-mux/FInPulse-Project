"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useAccounts, usePayLoan } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PayLoanModal() {
  const { isPayLoanModalOpen, payingLoan, closePayLoanModal } = useAppStore();
  const { data: accountsData } = useAccounts();
  const payLoanMutation = usePayLoan();

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter akun kas / bank yang sah digunakan untuk membayar
  const eligibleAccounts = useMemo(() => {
    const all = accountsData?.accounts || [];
    return all.filter(
      (a) => a.accountCategory !== "PAYLATER" && a.type !== "credit" && a.isActive
    );
  }, [accountsData]);

  // Set default rekening pembayar saat modal dibuka
  useEffect(() => {
    if (payingLoan && isPayLoanModalOpen) {
      setErrorMessage(null);
      setSuccessToast(null);

      // 1. Coba pilih sourceAccountId bawaan pinjaman jika saldonya cukup
      const defaultAcc = eligibleAccounts.find(
        (a) => a.id === payingLoan.sourceAccountId
      );
      if (defaultAcc && defaultAcc.balance >= payingLoan.monthlyTotal) {
        setSelectedAccountId(defaultAcc.id);
        return;
      }

      // 2. Cari akun lain yang memiliki saldo mencukupi
      const sufficientAcc = eligibleAccounts.find(
        (a) => a.balance >= payingLoan.monthlyTotal
      );
      if (sufficientAcc) {
        setSelectedAccountId(sufficientAcc.id);
        return;
      }

      // 3. Fallback ke akun default bawaan atau akun pertama
      setSelectedAccountId(
        defaultAcc?.id || eligibleAccounts[0]?.id || ""
      );
    }
  }, [payingLoan, isPayLoanModalOpen, eligibleAccounts]);

  if (!payingLoan) return null;

  const selectedAccount = eligibleAccounts.find(
    (a) => a.id === selectedAccountId
  );
  const currentBalance = selectedAccount?.balance || 0;
  const totalAmount = payingLoan.monthlyTotal;
  const hasSufficientBalance = currentBalance >= totalAmount;
  const balanceDifference = currentBalance - totalAmount;

  const currentInstallment =
    payingLoan.tenor - payingLoan.remainingMonths + 1;

  const handleConfirmPay = async () => {
    if (!selectedAccountId || !hasSufficientBalance || payLoanMutation.isPending) {
      return;
    }

    setErrorMessage(null);
    try {
      await payLoanMutation.mutateAsync({
        id: payingLoan.id,
        sourceAccountId: selectedAccountId,
        amount: totalAmount,
      });

      setSuccessToast(
        "Pembayaran cicilan berhasil! Limit paylater Anda telah dipulihkan."
      );

      // Tutup modal setelah delay feedback singkat
      setTimeout(() => {
        closePayLoanModal();
        setSuccessToast(null);
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal membayar cicilan";
      setErrorMessage(msg);
    }
  };

  return (
    <Modal
      isOpen={isPayLoanModalOpen}
      onClose={() => {
        if (!payLoanMutation.isPending) {
          closePayLoanModal();
        }
      }}
      maxWidth="max-w-lg"
    >
      <div className="relative p-6 flex flex-col gap-5 overflow-hidden">
        {/* Ambient Glow Gradient */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Pelunasan Cicilan
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Bulan {currentInstallment}/{payingLoan.tenor}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
              Bayar Tagihan Paylater
            </h3>
          </div>
        </div>

        {/* Success Toast / Notification */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold leading-relaxed">
                {successToast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Rincian Tagihan Card */}
        <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/10 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Tagihan / Barang
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {payingLoan.name}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Penyedia Paylater
              </span>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/20 text-xs font-bold mt-0.5">
                <CreditCard className="w-3 h-3" />
                <span>{payingLoan.paylaterAccount.name}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
            <div className="p-2.5 rounded-xl bg-charcoal-950/60 border border-white/5">
              <span className="text-[10px] text-zinc-400 block mb-0.5">
                Pokok (Pulihkan Limit)
              </span>
              <span className="font-bold font-mono text-emerald-400 text-sm">
                {formatCurrency(payingLoan.monthlyPrincipal)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-charcoal-950/60 border border-white/5">
              <span className="text-[10px] text-zinc-400 block mb-0.5">
                Beban Bunga Pinjaman
              </span>
              <span className="font-bold font-mono text-rose-400 text-sm">
                {formatCurrency(payingLoan.monthlyInterest)}
              </span>
            </div>
          </div>

          {/* Total Tagihan Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-zinc-800/60 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">
              Total Nominal Harus Dibayar
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        {/* Rekening Pembayar Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>Pilih Rekening Kas / Dompet Pembayar</span>
            {selectedAccount && (
              <span className="text-[11px] text-zinc-400 font-normal">
                Saldo:{" "}
                <strong className="font-mono text-white">
                  {formatCurrency(currentBalance)}
                </strong>
              </span>
            )}
          </label>

          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={payLoanMutation.isPending || Boolean(successToast)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
            >
              {eligibleAccounts.length === 0 ? (
                <option value="">Tidak ada akun kas/bank tersedia</option>
              ) : (
                eligibleAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type.toUpperCase()}) — Saldo: {formatCurrency(acc.balance)}
                  </option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          {/* Saldo Validation Alert */}
          {!hasSufficientBalance ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-start gap-2 mt-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Saldo Tidak Mencukupi!</span>
                <span>
                  Saldo rekening ini kurang{" "}
                  <strong className="font-mono">
                    {formatCurrency(Math.abs(balanceDifference))}
                  </strong>{" "}
                  untuk membayar cicilan {formatCurrency(totalAmount)}. Silakan
                  pilih rekening lain atau isi saldo terlebih dahulu.
                </span>
              </div>
            </div>
          ) : selectedAccount ? (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between mt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Saldo Mencukupi</span>
              </span>
              <span className="font-mono font-semibold">
                Sisa saldo: {formatCurrency(balanceDifference)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-1">
          <button
            type="button"
            onClick={closePayLoanModal}
            disabled={payLoanMutation.isPending}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirmPay}
            disabled={
              !hasSufficientBalance ||
              !selectedAccountId ||
              payLoanMutation.isPending ||
              Boolean(successToast)
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {payLoanMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Pembayaran...</span>
              </>
            ) : (
              <>
                <span>Konfirmasi & Bayar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
