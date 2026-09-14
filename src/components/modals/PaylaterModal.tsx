"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, useCreateTransaction } from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency } from "@/lib/formatters";
import confetti from "canvas-confetti";

const POPULAR_PROVIDERS = [
  { name: "SPayLater", colorHex: "#EE4D2D", defaultLimit: 5000000 },
  { name: "GoPay Later", colorHex: "#00AA13", defaultLimit: 3000000 },
  { name: "Kredivo", colorHex: "#0077C8", defaultLimit: 10000000 },
  { name: "Akulaku", colorHex: "#E60012", defaultLimit: 6000000 },
  { name: "Indodana", colorHex: "#00B4D8", defaultLimit: 5000000 },
  { name: "Lainnya", colorHex: "#8B5CF6", defaultLimit: 3000000 },
];

export function PaylaterModal() {
  const { isPaylaterModalOpen, editingPaylaterAccount, closePaylaterModal } = useAppStore();
  const { data: accountsData } = useAccounts();

  const regularAccounts = useMemo(
    () => (accountsData?.accounts || []).filter((a) => a.accountCategory !== "PAYLATER"),
    [accountsData?.accounts]
  );

  const [activeTab, setActiveTab] = useState<"manage" | "pay">("manage");
  const [providerName, setProviderName] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [colorHex, setColorHex] = useState("#EE4D2D");

  // Tab Bayar Tagihan state
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();
  const createTxMutation = useCreateTransaction();

  const isEditing = !!editingPaylaterAccount;
  const currentCreditLimit = editingPaylaterAccount?.creditLimit ?? editingPaylaterAccount?.balance ?? 0;
  const currentBalance = editingPaylaterAccount?.balance ?? 0;
  const currentUsed = Math.max(0, currentCreditLimit - currentBalance);

  useEffect(() => {
    if (isPaylaterModalOpen) {
      setError(null);
      if (editingPaylaterAccount) {
        setProviderName(editingPaylaterAccount.name);
        setCreditLimit(String(editingPaylaterAccount.creditLimit || editingPaylaterAccount.balance || 0));
        setBalance(String(editingPaylaterAccount.balance));
        setColorHex(editingPaylaterAccount.colorHex || "#EE4D2D");
        setActiveTab("manage");
        setPaymentAmount(String(currentUsed > 0 ? currentUsed : ""));
        if (regularAccounts.length > 0) {
          setSourceAccountId(regularAccounts[0].id);
        }
      } else {
        setProviderName("SPayLater");
        setCreditLimit("5000000");
        setBalance("5000000");
        setColorHex("#EE4D2D");
        setActiveTab("manage");
      }
    }
  }, [isPaylaterModalOpen, editingPaylaterAccount, regularAccounts, currentUsed]);

  if (!isPaylaterModalOpen) return null;

  const handleSelectPreset = (preset: (typeof POPULAR_PROVIDERS)[number]) => {
    if (preset.name === "Lainnya") {
      setProviderName("");
    } else {
      setProviderName(preset.name);
    }
    setColorHex(preset.colorHex);
    if (!isEditing) {
      setCreditLimit(String(preset.defaultLimit));
      setBalance(String(preset.defaultLimit));
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = providerName.trim();
    if (!cleanName) {
      setError("Nama Provider Paylater wajib diisi.");
      return;
    }

    const parsedLimit = parseFloat(creditLimit) || 0;
    const parsedBalance = parseFloat(balance) || 0;

    if (parsedLimit <= 0) {
      setError("Total Plafon Kredit harus lebih dari 0.");
      return;
    }

    if (parsedBalance > parsedLimit) {
      setError("Sisa limit tidak boleh melebihi total plafon limit kredit.");
      return;
    }

    try {
      if (isEditing && editingPaylaterAccount) {
        await updateAccountMutation.mutateAsync({
          id: editingPaylaterAccount.id,
          name: cleanName,
          type: "credit",
          accountCategory: "PAYLATER",
          creditLimit: parsedLimit,
          balance: parsedBalance,
          colorHex,
          icon: "credit-card",
        });
      } else {
        await createAccountMutation.mutateAsync({
          name: cleanName,
          type: "credit",
          accountCategory: "PAYLATER",
          creditLimit: parsedLimit,
          balance: parsedBalance,
          colorHex,
          icon: "credit-card",
        });
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      closePaylaterModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan akun paylater.");
    }
  };

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingPaylaterAccount) return;

    const parsedPay = parseFloat(paymentAmount) || 0;
    if (parsedPay <= 0) {
      setError("Nominal pembayaran harus lebih dari 0.");
      return;
    }

    const selectedSource = regularAccounts.find((a) => a.id === sourceAccountId);
    if (!selectedSource) {
      setError("Pilih rekening sumber dana untuk pembayaran.");
      return;
    }

    if (selectedSource.balance < parsedPay) {
      setError(
        `Saldo ${selectedSource.name} tidak cukup (${formatCurrency(selectedSource.balance)}).`
      );
      return;
    }

    try {
      // Catat transaksi pengeluaran dan pulihkan limit
      await createTxMutation.mutateAsync({
        type: "expense",
        amount: parsedPay,
        accountId: selectedSource.id,
        toAccountId: editingPaylaterAccount.id,
        description: `Bayar Tagihan ${editingPaylaterAccount.name}`,
        tags: "#paylater #bill",
        date: new Date().toISOString(),
      });

      // Update saldo akun paylater secara langsung
      const newBalance = Math.min(
        currentCreditLimit,
        currentBalance + parsedPay
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

      closePaylaterModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memproses pembayaran tagihan.");
    }
  };

  const handleDelete = async () => {
    if (!editingPaylaterAccount) return;
    if (confirm(`Yakin ingin menghapus ${editingPaylaterAccount.name}?`)) {
      try {
        await deleteAccountMutation.mutateAsync(editingPaylaterAccount.id);
        closePaylaterModal();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal menghapus akun.");
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-charcoal-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/25">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isEditing ? `Kelola ${editingPaylaterAccount.name}` : "Tambah Limit Paylater"}
                </h3>
                <p className="text-[11px] text-gray-400">
                  Plafon kredit terisolasi dari kas riil
                </p>
              </div>
            </div>
            <button
              onClick={closePaylaterModal}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation if Editing */}
          {isEditing && (
            <div className="flex border-b border-white/10 bg-charcoal-950/40 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("manage")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "manage"
                    ? "bg-white/10 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Plafon & Limit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pay")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "pay"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Bayar Tagihan
              </button>
            </div>
          )}

          {/* Modal Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: KELOLA LIMIT */}
            {activeTab === "manage" ? (
              <form onSubmit={handleSaveAccount} className="flex flex-col gap-4">
                {/* Preset Chips */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Pilihan Cepat Provider:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {POPULAR_PROVIDERS.map((preset) => {
                      const isSelected = providerName === preset.name;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-orange-500/20 border-orange-500 text-orange-400"
                              : "bg-charcoal-800/60 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: preset.colorHex }}
                          />
                          <span className="truncate">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nama Akun / Provider */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Nama Provider Paylater
                  </label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="Contoh: SPayLater, GoPay Later"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>

                {/* Total Plafon Limit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Total Plafon Limit Kredit (Rp)
                  </label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => {
                      setCreditLimit(e.target.value);
                      if (!isEditing) setBalance(e.target.value);
                    }}
                    placeholder="Contoh: 5000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Plafon maksimal pinjaman kredit yang diberikan provider.
                  </span>
                </div>

                {/* Sisa Limit Saat Ini */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Sisa Limit Saat Ini (Rp)
                  </label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="Contoh: 3500000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-emerald-400 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Sisa limit yang masih dapat digunakan untuk belanja.
                  </span>
                </div>

                {/* Tombol Simpan & Hapus */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteAccountMutation.isPending}
                      className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closePaylaterModal}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                      className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-charcoal-950 text-xs font-bold transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {createAccountMutation.isPending || updateAccountMutation.isPending
                        ? "Menyimpan..."
                        : isEditing
                        ? "Simpan Perubahan"
                        : "Daftarkan Paylater"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* TAB 2: BAYAR TAGIHAN */
              <form onSubmit={handlePayBill} className="flex flex-col gap-4">
                {/* Status Hutang Berjalan */}
                <div className="p-3.5 rounded-xl bg-charcoal-950 border border-white/5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Total Tagihan (Limit Terpakai)</span>
                    <span className="text-rose-400 font-mono font-black text-sm">
                      {formatCurrency(currentUsed)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>Sisa Limit Saat Ini</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatCurrency(currentBalance)}
                    </span>
                  </div>
                </div>

                {/* Pilih Rekening Sumber Dana */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Bayar Menggunakan Rekening:
                  </label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors"
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

                {/* Nominal Pembayaran */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-300">
                      Nominal Pembayaran (Rp)
                    </label>
                    {currentUsed > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(currentUsed))}
                        className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                      >
                        Bayar Penuh ({formatCurrency(currentUsed)})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Contoh: 300000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-emerald-400 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Saldo rekening sumber akan terpotong dan sisa limit paylater akan bertambah.
                  </span>
                </div>

                {/* Tombol Eksekusi Bayar */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closePaylaterModal}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createTxMutation.isPending || updateAccountMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {createTxMutation.isPending || updateAccountMutation.isPending
                        ? "Memproses..."
                        : "Konfirmasi Pembayaran"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
