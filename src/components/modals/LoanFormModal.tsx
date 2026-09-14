"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Landmark,
  Percent,
  Plus,
  ShoppingBag,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useAppStore } from "@/store/useAppStore";
import {
  useAccounts,
  useCreateLoan,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateTransaction,
} from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";
import confetti from "canvas-confetti";

const POPULAR_PAYLATER_PROVIDERS = [
  { name: "SPayLater", colorHex: "#EE4D2D", defaultLimit: 5_000_000 },
  { name: "GoPay Later", colorHex: "#00AA13", defaultLimit: 3_000_000 },
  { name: "Kredivo", colorHex: "#0077C8", defaultLimit: 10_000_000 },
  { name: "Akulaku", colorHex: "#E60012", defaultLimit: 6_000_000 },
  { name: "Indodana", colorHex: "#00B4D8", defaultLimit: 5_000_000 },
  { name: "Lainnya", colorHex: "#8B5CF6", defaultLimit: 3_000_000 },
];

const LOAN_QUICK_AMOUNTS = [
  { label: "+500rb", val: 500_000 },
  { label: "+1 Jt", val: 1_000_000 },
  { label: "+2 Jt", val: 2_000_000 },
  { label: "+5 Jt", val: 5_000_000 },
  { label: "+10 Jt", val: 10_000_000 },
];

const PAYLATER_QUICK_LIMITS = [
  { label: "+1 Jt", val: 1_000_000 },
  { label: "+2 Jt", val: 2_000_000 },
  { label: "+5 Jt", val: 5_000_000 },
  { label: "+10 Jt", val: 10_000_000 },
];

const COMMON_TENORS = [1, 2, 3, 6, 9, 12];

export function LoanFormModal() {
  const {
    isLoanModalOpen,
    closeLoanModal,
    loanModalTab,
    setLoanModalTab,
    editingPaylaterAccount,
  } = useAppStore();

  const { data: accountsData } = useAccounts();
  const createLoanMutation = useCreateLoan();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();
  const createTxMutation = useCreateTransaction();

  // Active tab state ("loan" vs "paylater")
  const [activeTab, setActiveTab] = useState<"loan" | "paylater">("loan");

  // Accounts list
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

  // Common error state
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // TAB 1: KREDIT PINJAMAN STATE
  // ==========================================
  const [loanName, setLoanName] = useState("");
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [tenor, setTenor] = useState(3);
  const [paylaterAccountId, setPaylaterAccountId] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [loanDueDay, setLoanDueDay] = useState("20");

  // Defaults for loan accounts
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

  // ==========================================
  // TAB 2: PAYLATER STATE
  // ==========================================
  const [paylaterName, setPaylaterName] = useState("SPayLater");
  const [creditLimit, setCreditLimit] = useState<number>(5_000_000);
  const [balance, setBalance] = useState<number>(5_000_000);
  const [paylaterColorHex, setPaylaterColorHex] = useState("#EE4D2D");
  const [paylaterDueDay, setPaylaterDueDay] = useState("25");
  const [paylaterSubMode, setPaylaterSubMode] = useState<"manage" | "pay">(
    "manage"
  );
  const [paySourceAccountId, setPaySourceAccountId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const isEditingPaylater = !!editingPaylaterAccount;
  const currentPaylaterLimit =
    editingPaylaterAccount?.creditLimit ?? editingPaylaterAccount?.balance ?? 0;
  const currentPaylaterBalance = editingPaylaterAccount?.balance ?? 0;
  const currentPaylaterUsed = Math.max(
    0,
    currentPaylaterLimit - currentPaylaterBalance
  );

  // Sync state when modal opens or editingPaylaterAccount changes
  useEffect(() => {
    if (isLoanModalOpen) {
      setError(null);
      if (editingPaylaterAccount) {
        setActiveTab("paylater");
        setLoanModalTab("paylater");
        setPaylaterName(editingPaylaterAccount.name);
        setCreditLimit(currentPaylaterLimit);
        setBalance(currentPaylaterBalance);
        setPaylaterColorHex(editingPaylaterAccount.colorHex || "#EE4D2D");
        setPaymentAmount(currentPaylaterUsed);
        if (currentPaylaterUsed > 0) {
          setPaylaterSubMode("pay");
        } else {
          setPaylaterSubMode("manage");
        }
        if (regularAccounts.length > 0) {
          setPaySourceAccountId(regularAccounts[0].id);
        }
      } else {
        setActiveTab(loanModalTab || "loan");
        if (!paylaterAccountId && paylaterAccounts.length > 0) {
          setPaylaterAccountId(paylaterAccounts[0].id);
        }
        if (!sourceAccountId && regularAccounts.length > 0) {
          setSourceAccountId(regularAccounts[0].id);
        }
        if (!paySourceAccountId && regularAccounts.length > 0) {
          setPaySourceAccountId(regularAccounts[0].id);
        }
      }
    }
  }, [
    isLoanModalOpen,
    loanModalTab,
    editingPaylaterAccount,
    currentPaylaterLimit,
    currentPaylaterBalance,
    currentPaylaterUsed,
    paylaterAccounts,
    regularAccounts,
    setLoanModalTab,
    paySourceAccountId,
    paylaterAccountId,
    sourceAccountId,
  ]);

  const handleTabSwitch = (tab: "loan" | "paylater") => {
    setActiveTab(tab);
    setLoanModalTab(tab);
    setError(null);
  };

  // Paylater preset selection
  const handleSelectPaylaterPreset = (
    preset: (typeof POPULAR_PAYLATER_PROVIDERS)[number]
  ) => {
    if (preset.name === "Lainnya") {
      setPaylaterName("");
    } else {
      setPaylaterName(preset.name);
    }
    setPaylaterColorHex(preset.colorHex);
    if (!isEditingPaylater) {
      setCreditLimit(preset.defaultLimit);
      setBalance(preset.defaultLimit);
    }
  };

  // ==========================================
  // SUBMIT HANDLERS
  // ==========================================

  // Submit Kredit Pinjaman
  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loanName.trim()) {
      setError("Nama pinjaman / cicilan wajib diisi");
      return;
    }

    if (loanAmount <= 0) {
      setError("Nominal pinjaman pokok harus lebih dari 0");
      return;
    }

    if (!selectedPaylaterId) {
      setError("Pilih provider Paylater / sumber pinjaman");
      return;
    }

    if (!selectedSourceId) {
      setError("Pilih rekening bank/dompet penerima pencairan");
      return;
    }

    const dayNum = parseInt(loanDueDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError("Tanggal jatuh tempo harus antara 1 sampai 31");
      return;
    }

    try {
      await createLoanMutation.mutateAsync({
        name: loanName.trim(),
        totalAmount: loanAmount,
        tenor: parsedTenor,
        dueDay: dayNum,
        paylaterAccountId: selectedPaylaterId,
        sourceAccountId: selectedSourceId,
        monthlyTotal: effectiveMonthlyTotal,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });

      // Reset form
      setLoanName("");
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

  // Submit Paylater Account (Create / Update)
  const handlePaylaterAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = paylaterName.trim();
    if (!cleanName) {
      setError("Nama Provider Paylater wajib diisi.");
      return;
    }

    if (creditLimit <= 0) {
      setError("Total Plafon Limit Kredit harus lebih dari 0.");
      return;
    }

    if (balance > creditLimit) {
      setError("Sisa limit tidak boleh melebihi total plafon limit kredit.");
      return;
    }

    try {
      if (isEditingPaylater && editingPaylaterAccount) {
        await updateAccountMutation.mutateAsync({
          id: editingPaylaterAccount.id,
          name: cleanName,
          type: "credit",
          accountCategory: "PAYLATER",
          creditLimit,
          balance,
          colorHex: paylaterColorHex,
          icon: "credit-card",
        });
      } else {
        await createAccountMutation.mutateAsync({
          name: cleanName,
          type: "credit",
          accountCategory: "PAYLATER",
          creditLimit,
          balance,
          colorHex: paylaterColorHex,
          icon: "credit-card",
        });
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      closeLoanModal();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan akun paylater."
      );
    }
  };

  // Submit Bayar Tagihan Paylater
  const handlePaylaterBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingPaylaterAccount) {
      setError("Pilih akun Paylater yang akan dibayar tagihannya.");
      return;
    }

    if (paymentAmount <= 0) {
      setError("Nominal pembayaran harus lebih dari 0.");
      return;
    }

    const selectedSource = regularAccounts.find(
      (a) => a.id === paySourceAccountId
    );
    if (!selectedSource) {
      setError("Pilih rekening sumber dana untuk pembayaran.");
      return;
    }

    if (selectedSource.balance < paymentAmount) {
      setError(
        `Saldo ${selectedSource.name} tidak mencukupi (${formatCurrency(
          selectedSource.balance
        )}).`
      );
      return;
    }

    try {
      // Catat transaksi pengeluaran
      await createTxMutation.mutateAsync({
        type: "expense",
        amount: paymentAmount,
        accountId: selectedSource.id,
        toAccountId: editingPaylaterAccount.id,
        description: `Bayar Tagihan ${editingPaylaterAccount.name}`,
        tags: "#paylater #bill",
        date: new Date().toISOString(),
      });

      // Update saldo akun paylater secara langsung
      const newBalance = Math.min(
        currentPaylaterLimit,
        currentPaylaterBalance + paymentAmount
      );
      await updateAccountMutation.mutateAsync({
        id: editingPaylaterAccount.id,
        balance: newBalance,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      closeLoanModal();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memproses pembayaran tagihan."
      );
    }
  };

  // Delete Paylater Account
  const handleDeletePaylater = async () => {
    if (!editingPaylaterAccount) return;
    if (
      confirm(
        `Yakin ingin menghapus fasilitas Paylater "${editingPaylaterAccount.name}"?`
      )
    ) {
      try {
        await deleteAccountMutation.mutateAsync(editingPaylaterAccount.id);
        closeLoanModal();
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Gagal menghapus akun paylater."
        );
      }
    }
  };

  return (
    <Modal
      isOpen={isLoanModalOpen}
      onClose={closeLoanModal}
      title={
        isEditingPaylater
          ? `Kelola ${editingPaylaterAccount.name}`
          : "Pinjaman & Fasilitas Kredit"
      }
      description="Kelola pinjaman tunai pencairan rekening atau plafon limit belanja Paylater"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-3 mt-1">
        {/* ======================================================== */}
        {/* 1. SEGMENTED SWITCH / TAB BAR */}
        {/* ======================================================== */}
        <div className="flex p-1 rounded-xl bg-charcoal-950/80 border border-white/10 relative">
          {/* Tab 1: Kredit Pinjaman */}
          <button
            type="button"
            onClick={() => handleTabSwitch("loan")}
            className={`relative flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer z-10 select-none ${
              activeTab === "loan"
                ? "text-orange-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Landmark className="w-4 h-4 shrink-0" />
            <span className="truncate">💳 Kredit Pinjaman</span>
            {activeTab === "loan" && (
              <motion.div
                layoutId="loanModalSegmentPill"
                className="absolute inset-0 rounded-lg bg-orange-500/15 border border-orange-500/30 -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>

          {/* Tab 2: Paylater */}
          <button
            type="button"
            onClick={() => handleTabSwitch("paylater")}
            className={`relative flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer z-10 select-none ${
              activeTab === "paylater"
                ? "text-cyan-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="truncate">🛍️ Paylater</span>
            {activeTab === "paylater" && (
              <motion.div
                layoutId="loanModalSegmentPill"
                className="absolute inset-0 rounded-lg bg-cyan-500/15 border border-cyan-500/30 -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. SUB-MENU CONTENTS (ANIMATED TRANSITION) */}
        {/* ======================================================== */}
        <AnimatePresence mode="wait">
          {activeTab === "loan" ? (
            /* ===================================================== */
            /* TAB 1: KREDIT PINJAMAN FORM                           */
            /* ===================================================== */
            <motion.form
              key="tab-kredit-pinjaman"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.16 }}
              onSubmit={handleLoanSubmit}
              className="flex flex-col gap-3.5 text-sm"
            >
              {/* Nama Pinjaman */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Nama Pinjaman / Cicilan
                </label>
                <input
                  type="text"
                  required
                  value={loanName}
                  onChange={(e) => setLoanName(e.target.value)}
                  placeholder="Contoh: Pinjaman Tunai Akulaku, KTA Kilat, Dana Siaga"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white placeholder:text-gray-500 text-xs focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>

              {/* Akun Paylater & Rekening Pencairan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Provider Paylater Pemberi Pinjaman */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                    <span>Sumber / Provider Paylater</span>
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

                {/* Rekening Pencairan & Pembayar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rekening Pencairan & Bayar</span>
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
                label="Nominal Pinjaman Pokok (Dana Cair Masuk)"
                value={loanAmount}
                onChange={(val) => setLoanAmount(val)}
                placeholder="0"
                accentColor="orange"
                quickAmounts={LOAN_QUICK_AMOUNTS}
                helperText="Dana pokok yang dicairkan ke rekening bank/dompet Anda."
                required
              />

              {/* Tenor & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tenor */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Tenor Pembayaran (Bulan)
                  </label>
                  <div className="flex items-center gap-1">
                    {COMMON_TENORS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTenor(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          tenor === t
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-sm"
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
                    value={loanDueDay}
                    onChange={(e) => setLoanDueDay(e.target.value)}
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
                subLabel={`Pokok murni: ${formatCurrency(
                  calculatedPrincipal
                )}/bln`}
                value={monthlyTotal}
                onChange={(val) => setMonthlyTotal(val)}
                placeholder={String(calculatedPrincipal || 0)}
                accentColor="rose"
                helperText="Masukkan nominal tagihan bulanan dari provider jika terdapat beban bunga/biaya."
              />

              {/* Live Simulation Card */}
              {loanAmount > 0 && (
                <div className="p-3.5 rounded-xl bg-charcoal-950/80 border border-orange-500/25 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                      Simulasi Pemisahan Pokok & Bunga
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Tenor {parsedTenor} Bulan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">
                        Pokok Bulanan
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(calculatedPrincipal)}
                      </span>
                      <span className="text-[9px] text-emerald-500/80">
                        Pulihkan limit
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">
                        Bunga Bulanan
                      </span>
                      <span className="font-mono font-bold text-rose-400">
                        {formatCurrency(calculatedInterest)}
                      </span>
                      <span className="text-[9px] text-rose-500/80">
                        Beban pengeluaran
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">
                        Tagihan/Bulan
                      </span>
                      <span className="font-mono font-black text-white">
                        {formatCurrency(effectiveMonthlyTotal)}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        Potong rekening
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">
                        Total Bunga
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatCurrency(totalInterestCost)}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        Total {parsedTenor} bln
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
            </motion.form>
          ) : (
            /* ===================================================== */
            /* TAB 2: PAYLATER FORM                                  */
            /* ===================================================== */
            <motion.div
              key="tab-paylater"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16 }}
              className="flex flex-col gap-3.5 text-sm"
            >
              {/* If editing or debt exists: Sub-switch for Kelola Plafon vs Bayar Tagihan */}
              {isEditingPaylater && (
                <div className="flex p-1 rounded-xl bg-charcoal-950 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPaylaterSubMode("manage")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      paylaterSubMode === "manage"
                        ? "bg-white/10 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Plafon & Limit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaylaterSubMode("pay")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      paylaterSubMode === "pay"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Bayar Tagihan
                  </button>
                </div>
              )}

              {/* Paylater Mode 1: Kelola Plafon Limit */}
              {paylaterSubMode === "manage" ? (
                <form
                  onSubmit={handlePaylaterAccountSubmit}
                  className="flex flex-col gap-3.5"
                >
                  {/* Preset Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Pilihan Cepat Provider:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {POPULAR_PAYLATER_PROVIDERS.map((preset) => {
                        const isSelected = paylaterName === preset.name;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleSelectPaylaterPreset(preset)}
                            className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-sm"
                                : "bg-charcoal-900/70 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: preset.colorHex }}
                            />
                            <span className="truncate">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nama Provider Paylater */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      Nama Provider Paylater
                    </label>
                    <input
                      type="text"
                      required
                      value={paylaterName}
                      onChange={(e) => setPaylaterName(e.target.value)}
                      placeholder="Contoh: SPayLater, GoPay Later, Kredivo"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white placeholder:text-gray-500 text-xs focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>

                  {/* Total Plafon Limit Kredit (Free typing CurrencyInput) */}
                  <CurrencyInput
                    label="Total Plafon Limit Kredit (Pemberian Provider)"
                    value={creditLimit}
                    onChange={(val) => {
                      setCreditLimit(val);
                      if (!isEditingPaylater) setBalance(val);
                    }}
                    placeholder="Contoh: 5.000.000"
                    accentColor="cyan"
                    quickAmounts={PAYLATER_QUICK_LIMITS}
                    helperText="Plafon limit kredit maksimal yang disetujui oleh penyedia Paylater."
                    required
                  />

                  {/* Sisa Limit Saat Ini (Free typing CurrencyInput) */}
                  <CurrencyInput
                    label="Sisa Limit Saat Ini (Belum Digunakan)"
                    value={balance}
                    onChange={(val) => setBalance(val)}
                    placeholder="Contoh: 3.500.000"
                    accentColor="emerald"
                    helperText="Sisa saldo kredit yang masih tersedia untuk transaksi belanja."
                    required
                  />

                  {/* Tanggal Jatuh Tempo Tagihan */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tanggal Jatuh Tempo Tagihan Bulanan (1-31)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paylaterDueDay}
                      onChange={(e) => setPaylaterDueDay(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-charcoal-900/80 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <span className="text-[10px] text-gray-400">
                      Tanggal rutin penagihan tagihan bulanan dari provider.
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    {isEditingPaylater ? (
                      <button
                        type="button"
                        onClick={handleDeletePaylater}
                        disabled={deleteAccountMutation.isPending}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={closeLoanModal}
                        className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={
                          createAccountMutation.isPending ||
                          updateAccountMutation.isPending
                        }
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-charcoal-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {createAccountMutation.isPending ||
                        updateAccountMutation.isPending
                          ? "Menyimpan..."
                          : isEditingPaylater
                          ? "Simpan Perubahan"
                          : "Daftarkan Paylater"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Paylater Mode 2: Bayar Tagihan Paylater */
                <form
                  onSubmit={handlePaylaterBillSubmit}
                  className="flex flex-col gap-3.5"
                >
                  {/* Status Hutang Berjalan */}
                  <div className="p-3.5 rounded-xl bg-charcoal-950 border border-white/10 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Total Tagihan (Limit Terpakai)
                      </span>
                      <span className="text-rose-400 font-mono font-black text-sm">
                        {formatCurrency(currentPaylaterUsed)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Sisa Limit Saat Ini</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatCurrency(currentPaylaterBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Pilih Rekening Sumber Pembayaran */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bayar Menggunakan Rekening:</span>
                    </label>
                    <select
                      value={paySourceAccountId}
                      onChange={(e) => setPaySourceAccountId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                      required
                    >
                      <option value="" disabled>
                        Pilih Rekening Sumber
                      </option>
                      {regularAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatCurrency(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nominal Pembayaran dengan Free-Typing CurrencyInput */}
                  <CurrencyInput
                    label="Nominal Pembayaran (Rp)"
                    subLabel={
                      currentPaylaterUsed > 0 ? (
                        <button
                          type="button"
                          onClick={() => setPaymentAmount(currentPaylaterUsed)}
                          className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                        >
                          Bayar Penuh ({formatCurrency(currentPaylaterUsed)})
                        </button>
                      ) : null
                    }
                    value={paymentAmount}
                    onChange={(val) => setPaymentAmount(val)}
                    placeholder="0"
                    accentColor="emerald"
                    helperText="Saldo rekening sumber akan terpotong dan sisa limit paylater akan bertambah pulih."
                    required
                  />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={closeLoanModal}
                      className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={
                        createTxMutation.isPending ||
                        updateAccountMutation.isPending
                      }
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {createTxMutation.isPending ||
                        updateAccountMutation.isPending
                          ? "Memproses..."
                          : "Konfirmasi Pembayaran"}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
