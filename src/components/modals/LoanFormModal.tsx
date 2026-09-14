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
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useAppStore } from "@/store/useAppStore";
import { useAccounts, useCreateLoan } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";
import confetti from "canvas-confetti";

const QUICK_AMOUNTS = [
  { label: "+500rb", val: 500_000 },
  { label: "+1 Jt", val: 1_000_000 },
  { label: "+2 Jt", val: 2_000_000 },
  { label: "+5 Jt", val: 5_000_000 },
  { label: "+10 Jt", val: 10_000_000 },
];

const COMMON_TENORS = [1, 2, 3, 6, 9, 12];
const PAYLATER_TENORS = [1, 3, 6, 12];

export function LoanFormModal() {
  const { isLoanModalOpen, closeLoanModal, loanModalTab, setLoanModalTab } =
    useAppStore();
  const { data: accountsData } = useAccounts();
  const createLoanMutation = useCreateLoan();

  // Active sub-menu tab ("loan" | "paylater")
  const [activeTab, setActiveTab] = useState<"loan" | "paylater">("loan");

  // Sync with initial store tab if provided
  useEffect(() => {
    if (isLoanModalOpen) {
      setActiveTab(loanModalTab || "loan");
      setError(null);
    }
  }, [isLoanModalOpen, loanModalTab]);

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

  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // TAB 1: KREDIT PINJAMAN TUNAI STATE
  // ==========================================
  const [loanName, setLoanName] = useState("");
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanTenor, setLoanTenor] = useState(3);
  const [loanPaylaterAccountId, setLoanPaylaterAccountId] = useState("");
  const [loanSourceAccountId, setLoanSourceAccountId] = useState("");
  const [loanMonthlyTotal, setLoanMonthlyTotal] = useState<number>(0);
  const [loanDueDay, setLoanDueDay] = useState("20");

  // Defaults for Tab 1
  const defaultPaylater = paylaterAccounts[0]?.id || "";
  const defaultSource = regularAccounts[0]?.id || "";

  const selectedLoanPaylaterId = loanPaylaterAccountId || defaultPaylater;
  const selectedLoanSourceId = loanSourceAccountId || defaultSource;

  const parsedLoanTenor = Math.max(1, loanTenor);
  const calculatedLoanPrincipal =
    loanAmount > 0 ? Math.round(loanAmount / parsedLoanTenor) : 0;
  const effectiveLoanMonthlyTotal =
    loanMonthlyTotal > 0 ? loanMonthlyTotal : calculatedLoanPrincipal;
  const calculatedLoanInterest = Math.max(
    0,
    effectiveLoanMonthlyTotal - calculatedLoanPrincipal
  );
  const totalLoanInterestCost = calculatedLoanInterest * parsedLoanTenor;

  // ==========================================
  // TAB 2: CICILAN BELANJA PAYLATER STATE
  // ==========================================
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState<number>(0);
  const [itemTenor, setItemTenor] = useState(3);
  const [itemPaylaterAccountId, setItemPaylaterAccountId] = useState("");
  const [itemSourceAccountId, setItemSourceAccountId] = useState("");
  const [itemMonthlyTotal, setItemMonthlyTotal] = useState<number>(0);
  const [itemDueDay, setItemDueDay] = useState("25");

  const selectedItemPaylaterId = itemPaylaterAccountId || defaultPaylater;
  const selectedItemSourceId = itemSourceAccountId || defaultSource;

  const parsedItemTenor = Math.max(1, itemTenor);
  const calculatedItemPrincipal =
    itemAmount > 0 ? Math.round(itemAmount / parsedItemTenor) : 0;
  const effectiveItemMonthlyTotal =
    itemMonthlyTotal > 0 ? itemMonthlyTotal : calculatedItemPrincipal;
  const calculatedItemInterest = Math.max(
    0,
    effectiveItemMonthlyTotal - calculatedItemPrincipal
  );
  const totalItemInterestCost = calculatedItemInterest * parsedItemTenor;

  const selectedPaylaterAccount = paylaterAccounts.find(
    (p) => p.id === (activeTab === "loan" ? selectedLoanPaylaterId : selectedItemPaylaterId)
  );

  const handleTabSwitch = (tab: "loan" | "paylater") => {
    setActiveTab(tab);
    setLoanModalTab(tab);
    setError(null);
  };

  // Submit Tab 1: Kredit Pinjaman Tunai
  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loanName.trim()) {
      setError("Nama pinjaman / cicilan wajib diisi");
      return;
    }

    if (loanAmount <= 0) {
      setError("Nominal pinjaman harus lebih dari 0");
      return;
    }

    if (!selectedLoanPaylaterId) {
      setError("Pilih provider Paylater pemberi pinjaman");
      return;
    }

    if (!selectedLoanSourceId) {
      setError("Pilih rekening bank/dompet untuk pencairan & pembayaran");
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
        tenor: parsedLoanTenor,
        dueDay: dayNum,
        paylaterAccountId: selectedLoanPaylaterId,
        sourceAccountId: selectedLoanSourceId,
        monthlyTotal: effectiveLoanMonthlyTotal,
        loanType: "CASH_LOAN",
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      setLoanName("");
      setLoanAmount(0);
      setLoanTenor(3);
      setLoanMonthlyTotal(0);
      closeLoanModal();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan pinjaman"
      );
    }
  };

  // Submit Tab 2: Cicilan Belanja Paylater
  const handlePaylaterPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!itemName.trim()) {
      setError("Nama barang wajib diisi (contoh: Sepatu Compass, iPhone 13)");
      return;
    }

    if (itemAmount <= 0) {
      setError("Nominal paylater (harga barang) harus lebih dari 0");
      return;
    }

    if (!selectedItemPaylaterId) {
      setError("Pilih provider Paylater yang digunakan");
      return;
    }

    if (
      selectedPaylaterAccount &&
      selectedPaylaterAccount.balance < itemAmount
    ) {
      setError(
        `Sisa limit ${selectedPaylaterAccount.name} tidak mencukupi (${formatCurrency(
          selectedPaylaterAccount.balance
        )} tersisa)`
      );
      return;
    }

    if (!selectedItemSourceId) {
      setError("Pilih rekening sumber untuk pembayaran cicilan bulanan");
      return;
    }

    const dayNum = parseInt(itemDueDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError("Tanggal jatuh tempo harus antara 1 sampai 31");
      return;
    }

    try {
      await createLoanMutation.mutateAsync({
        name: itemName.trim(),
        totalAmount: itemAmount,
        tenor: parsedItemTenor,
        dueDay: dayNum,
        paylaterAccountId: selectedItemPaylaterId,
        sourceAccountId: selectedItemSourceId,
        monthlyTotal: effectiveItemMonthlyTotal,
        loanType: "PAYLATER_PURCHASE",
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });

      setItemName("");
      setItemAmount(0);
      setItemTenor(3);
      setItemMonthlyTotal(0);
      closeLoanModal();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal mencatat cicilan paylater"
      );
    }
  };

  return (
    <Modal
      isOpen={isLoanModalOpen}
      onClose={closeLoanModal}
      title="Catatan Pinjaman & Cicilan Paylater"
      description="Kelola pinjaman tunai atau cicilan belanja barang dengan pemisahan pokok pemulih limit dan beban bunga"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-3 mt-1">
        {/* ======================================================== */}
        {/* SUB-MENU TABS: [ 💳 Kredit Pinjaman ] [ 🛍️ Paylater ]     */}
        {/* ======================================================== */}
        <div className="flex p-1 rounded-xl bg-charcoal-950/80 border border-white/10 relative">
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
                layoutId="loanFormSubMenuPill"
                className="absolute inset-0 rounded-lg bg-orange-500/15 border border-orange-500/30 -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>

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
                layoutId="loanFormSubMenuPill"
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
        {/* SUB-MENU FORMS (ANIMATED TRANSITION)                     */}
        {/* ======================================================== */}
        <AnimatePresence mode="wait">
          {activeTab === "loan" ? (
            /* ===================================================== */
            /* TAB 1: KREDIT PINJAMAN FORM                           */
            /* ===================================================== */
            <motion.form
              key="sub-tab-loan"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
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
                  placeholder="Contoh: Pinjaman Tunai Akulaku, Dana Siaga Kredivo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white placeholder:text-gray-500 text-xs focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>

              {/* Provider Paylater & Rekening Pencairan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                    <span>Provider Paylater</span>
                  </label>
                  <select
                    value={selectedLoanPaylaterId}
                    onChange={(e) => setLoanPaylaterAccountId(e.target.value)}
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rekening Pencairan & Bayar</span>
                  </label>
                  <select
                    value={selectedLoanSourceId}
                    onChange={(e) => setLoanSourceAccountId(e.target.value)}
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

              {/* Nominal Pinjaman Pokok */}
              <CurrencyInput
                label="Nominal Pinjaman Pokok (Cair ke Rekening)"
                value={loanAmount}
                onChange={(val) => setLoanAmount(val)}
                placeholder="0"
                accentColor="orange"
                quickAmounts={QUICK_AMOUNTS}
                helperText="Dana pokok pinjaman yang akan dicairkan ke rekening bank/dompet Anda."
                required
              />

              {/* Tenor & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Tenor (Bulan)
                  </label>
                  <div className="flex items-center gap-1">
                    {COMMON_TENORS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLoanTenor(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          loanTenor === t
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                            : "bg-charcoal-900/60 text-gray-400 border-white/10 hover:text-white"
                        }`}
                      >
                        {t}x
                      </button>
                    ))}
                  </div>
                </div>

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

              {/* Total Cicilan per Bulan */}
              <CurrencyInput
                label={
                  <span className="flex items-center gap-1 text-gray-300">
                    <Percent className="w-3.5 h-3.5 text-rose-400" />
                    <span>Total Tagihan per Bulan (Pokok + Bunga)</span>
                  </span>
                }
                subLabel={`Pokok murni: ${formatCurrency(
                  calculatedLoanPrincipal
                )}/bln`}
                value={loanMonthlyTotal}
                onChange={(val) => setLoanMonthlyTotal(val)}
                placeholder={String(calculatedLoanPrincipal || 0)}
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
                      <span className="text-[10px] text-gray-400">
                        Pokok Bulanan
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(calculatedLoanPrincipal)}
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
                        {formatCurrency(calculatedLoanInterest)}
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
                        {formatCurrency(effectiveLoanMonthlyTotal)}
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
                        {formatCurrency(totalLoanInterestCost)}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        Selama {parsedLoanTenor} bln
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
            /* TAB 2: CICILAN BELANJA PAYLATER FORM                  */
            /* ===================================================== */
            <motion.form
              key="sub-tab-paylater"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handlePaylaterPurchaseSubmit}
              className="flex flex-col gap-3.5 text-sm"
            >
              {/* 1. Nama Barang */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Nama Barang
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Contoh: Sepatu Compass, iPhone 13, Kulkas 2 Pintu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white placeholder:text-gray-500 text-xs focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* 2. Provider Paylater & 3. Rekening Sumber */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Provider Paylater */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Provider Paylater</span>
                  </label>
                  <select
                    value={selectedItemPaylaterId}
                    onChange={(e) => setItemPaylaterAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500/50 transition-colors"
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

                {/* Rekening Sumber (Pembayaran Cicilan) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rekening Sumber (Bayar Cicilan)</span>
                  </label>
                  <select
                    value={selectedItemSourceId}
                    onChange={(e) => setItemSourceAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    {regularAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Nominal Paylater (Harga Barang / Pokok) */}
              <CurrencyInput
                label="Nominal Paylater (Harga Barang / Pokok)"
                value={itemAmount}
                onChange={(val) => setItemAmount(val)}
                placeholder="0"
                accentColor="cyan"
                quickAmounts={QUICK_AMOUNTS}
                helperText="Total harga barang yang dipotong dari sisa limit Paylater."
                required
              />

              {/* 5. Tenor (Bulan) & 6. Tanggal Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Tenor Cicilan (Bulan)
                  </label>
                  <div className="flex items-center gap-1">
                    {PAYLATER_TENORS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setItemTenor(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          itemTenor === t
                            ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                            : "bg-charcoal-900/60 text-gray-400 border-white/10 hover:text-white"
                        }`}
                      >
                        {t} bln
                      </button>
                    ))}
                  </div>
                </div>

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
                    value={itemDueDay}
                    onChange={(e) => setItemDueDay(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-charcoal-900/80 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* 7. Total Tagihan Per Bulan */}
              <CurrencyInput
                label={
                  <span className="flex items-center gap-1 text-gray-300">
                    <Percent className="w-3.5 h-3.5 text-rose-400" />
                    <span>Total Tagihan Per Bulan</span>
                  </span>
                }
                subLabel={`Pokok murni: ${formatCurrency(
                  calculatedItemPrincipal
                )}/bln`}
                value={itemMonthlyTotal}
                onChange={(val) => setItemMonthlyTotal(val)}
                placeholder={String(calculatedItemPrincipal || 0)}
                accentColor="rose"
                helperText="Kalkulasi otomatis pokok, atau edit manual untuk memasukkan nominal riil setelah bunga/biaya platform."
              />

              {/* Live Simulation Card untuk Belanja Paylater */}
              {itemAmount > 0 && (
                <div className="p-3.5 rounded-xl bg-charcoal-950/80 border border-cyan-500/25 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      Ringkasan Cicilan Belanja Paylater
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Tenor {parsedItemTenor} Bulan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">
                        Pokok Bulanan
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(calculatedItemPrincipal)}
                      </span>
                      <span className="text-[9px] text-emerald-500/80">
                        Memulihkan limit
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">
                        Bunga / Biaya
                      </span>
                      <span className="font-mono font-bold text-rose-400">
                        {formatCurrency(calculatedItemInterest)}
                      </span>
                      <span className="text-[9px] text-rose-500/80">
                        Beban platform
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">
                        Tagihan/Bulan
                      </span>
                      <span className="font-mono font-black text-white">
                        {formatCurrency(effectiveItemMonthlyTotal)}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        Potong rekening
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">
                        Total Biaya
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatCurrency(totalItemInterestCost)}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        Selama {parsedItemTenor} bln
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Batal & Simpan Cicilan Paylater */}
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
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-charcoal-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {createLoanMutation.isPending
                      ? "Memproses..."
                      : "Simpan Cicilan Paylater"}
                  </span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
