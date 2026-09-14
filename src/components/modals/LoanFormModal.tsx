"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Landmark,
  Percent,
  Plus,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useAppStore } from "@/store/useAppStore";
import { useAccounts, useCreateLoan } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";
import confetti from "canvas-confetti";

const LOAN_QUICK_AMOUNTS = [
  { label: "+500rb", val: 500_000 },
  { label: "+1 Jt", val: 1_000_000 },
  { label: "+2 Jt", val: 2_000_000 },
  { label: "+5 Jt", val: 5_000_000 },
  { label: "+10 Jt", val: 10_000_000 },
];

const COMMON_TENORS = [1, 2, 3, 6, 9, 12];

export function LoanFormModal() {
  const { isLoanModalOpen, closeLoanModal } = useAppStore();
  const { data: accountsData } = useAccounts();
  const createLoanMutation = useCreateLoan();

  const paylaterAccounts = useMemo(
    () => accountsData?.paylaterAccounts || [],
    [accountsData]
  );
  const regularAccounts = useMemo(
    () =>
      (accountsData?.allAccounts || accountsData?.accounts || []).filter(
        (a) => a.accountCategory !== "PAYLATER"
      ),
    [accountsData]
  );

  const [name, setName] = useState("");
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [tenor, setTenor] = useState(3);
  const [paylaterAccountId, setPaylaterAccountId] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [dueDay, setDueDay] = useState("20");
  const [error, setError] = useState<string | null>(null);

  // Default values saat akun tersedia
  const defaultPaylater = paylaterAccounts[0]?.id || "";
  const defaultSource = regularAccounts[0]?.id || "";

  const selectedPaylaterId = paylaterAccountId || defaultPaylater;
  const selectedSourceId = sourceAccountId || defaultSource;

  const parsedTenor = Math.max(1, tenor);
  const calculatedPrincipal =
    loanAmount > 0 ? Math.round(loanAmount / parsedTenor) : 0;

  const effectiveMonthlyTotal =
    monthlyTotal > 0 ? monthlyTotal : calculatedPrincipal;
  const calculatedInterest = Math.max(
    0,
    effectiveMonthlyTotal - calculatedPrincipal
  );
  const totalInterestCost = calculatedInterest * parsedTenor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama pinjaman / cicilan wajib diisi");
      return;
    }

    if (loanAmount <= 0) {
      setError("Nominal pinjaman harus lebih dari 0");
      return;
    }

    if (!selectedPaylaterId) {
      setError("Pilih provider Paylater pemberi pinjaman");
      return;
    }

    if (!selectedSourceId) {
      setError("Pilih rekening bank/dompet untuk pencairan & pembayaran");
      return;
    }

    const dayNum = parseInt(dueDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError("Tanggal jatuh tempo harus antara 1 sampai 31");
      return;
    }

    try {
      await createLoanMutation.mutateAsync({
        name: name.trim(),
        totalAmount: loanAmount,
        tenor: parsedTenor,
        dueDay: dayNum,
        paylaterAccountId: selectedPaylaterId,
        sourceAccountId: selectedSourceId,
        monthlyTotal: effectiveMonthlyTotal,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      // Reset form
      setName("");
      setLoanAmount(0);
      setTenor(3);
      setMonthlyTotal(0);
      closeLoanModal();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal menyimpan pinjaman";
      setError(msg);
    }
  };

  return (
    <Modal
      isOpen={isLoanModalOpen}
      onClose={closeLoanModal}
      title="Catat Pinjaman & Cicilan Paylater"
      description="Kelola pinjaman tunai atau cicilan dengan pemisahan pokok pemulih limit dan beban bunga"
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5 text-sm mt-1"
      >
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Nama Pinjaman */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-300">
            Nama Pinjaman / Cicilan
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Pinjaman Tunai Akulaku, Cicilan Gadget"
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white placeholder:text-gray-500 text-xs focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        {/* Akun Paylater & Rekening Pencairan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Provider Paylater */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-orange-400" />
              <span>Provider Paylater</span>
            </label>
            <select
              value={selectedPaylaterId}
              onChange={(e) => setPaylaterAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              {paylaterAccounts.length === 0 ? (
                <option value="">Belum ada akun Paylater</option>
              ) : (
                paylaterAccounts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Sisa: {formatCurrency(p.balance)})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Rekening Pembayar / Pencairan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rekening Pembayar</span>
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              {regularAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nominal Pinjaman Pokok (Free typing CurrencyInput) */}
        <CurrencyInput
          label="Nominal Pinjaman Pokok (Cair)"
          value={loanAmount}
          onChange={(val) => setLoanAmount(val)}
          placeholder="0"
          accentColor="orange"
          quickAmounts={LOAN_QUICK_AMOUNTS}
          helperText="Nominal dana pokok pinjaman yang dicairkan ke rekening Anda."
          required
        />

        {/* Tenor & Jatuh Tempo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tenor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300">
              Tenor (Bulan)
            </label>
            <div className="flex items-center gap-1">
              {COMMON_TENORS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTenor(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    tenor === t
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                      : "bg-charcoal-900/60 text-gray-400 border-white/10 hover:text-white"
                  }`}
                >
                  {t}x
                </button>
              ))}
            </div>
          </div>

          {/* Tanggal Jatuh Tempo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tanggal Jatuh Tempo (1-31)</span>
            </label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-charcoal-900/80 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Total Cicilan per Bulan (Custom / Interest simulator) */}
        <CurrencyInput
          label={
            <span className="flex items-center gap-1 text-gray-300">
              <Percent className="w-3.5 h-3.5 text-rose-400" />
              <span>Total Tagihan per Bulan (Pokok + Bunga)</span>
            </span>
          }
          subLabel={`Pokok murni: ${formatCurrency(calculatedPrincipal)}/bln`}
          value={monthlyTotal}
          onChange={(val) => setMonthlyTotal(val)}
          placeholder={String(calculatedPrincipal || 0)}
          accentColor="rose"
          helperText="Jika ada bunga dari provider, masukkan total cicilan bulanan yang harus dibayar."
        />

        {/* Live Simulation Card */}
        {loanAmount > 0 && (
          <div className="p-3.5 rounded-xl bg-charcoal-950/80 border border-orange-500/25 flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
              Simulasi Pemisahan Pokok & Bunga
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400">Pokok Bulanan</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(calculatedPrincipal)}
                </span>
                <span className="text-[9px] text-emerald-500/80">
                  Pulihkan limit
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400">Bunga Bulanan</span>
                <span className="font-mono font-bold text-rose-400">
                  {formatCurrency(calculatedInterest)}
                </span>
                <span className="text-[9px] text-rose-500/80">
                  Beban pengeluaran
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400">Tagihan/Bulan</span>
                <span className="font-mono font-black text-white">
                  {formatCurrency(effectiveMonthlyTotal)}
                </span>
                <span className="text-[9px] text-gray-400">
                  Potong rekening
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400">Total Bunga</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(totalInterestCost)}
                </span>
                <span className="text-[9px] text-gray-400">
                  Selama {parsedTenor} bln
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={closeLoanModal}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createLoanMutation.isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-charcoal-950 text-xs font-bold transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>
              {createLoanMutation.isPending
                ? "Memproses..."
                : "Simpan & Cairkan Pinjaman"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
