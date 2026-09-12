"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  Banknote,
  Briefcase,
  Car,
  CheckCircle2,
  Cigarette,
  CircleDollarSign,
  Coffee,
  Coins,
  CreditCard,
  DollarSign,
  Edit3,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  History,
  Home,
  Info,
  Landmark,
  Laptop,
  PiggyBank,
  Plane,
  Plus,
  Receipt,
  Save,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useAccounts, useAccountTransactions, useUpdateAccount } from "@/hooks/useFinance";
import { formatCurrency, formatRelativeDate } from "@/lib/formatters";
import { AccountType, TransactionWithRelations } from "@/types";

const CATEGORY_ICON_MAP: Record<string, typeof CircleDollarSign> = {
  Briefcase,
  Gift,
  TrendingUp,
  Laptop,
  PiggyBank,
  Coins,
  DollarSign,
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  HeartPulse,
  GraduationCap,
  Coffee,
  Cigarette,
  Wifi,
  Home,
  Plane,
  Smartphone,
  Gamepad2,
  Wrench,
};

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: typeof Landmark; color: string }
> = {
  bank: { label: "Bank Account", icon: Landmark, color: "#3B82F6" },
  cash: { label: "Kas Tunai", icon: Banknote, color: "#10B981" },
  ewallet: { label: "E-Wallet", icon: Wallet, color: "#06B6D4" },
  investment: { label: "Investasi", icon: TrendingUp, color: "#8B5CF6" },
  credit: { label: "Kredit / PayLater", icon: CreditCard, color: "#EF4444" },
};

export function AccountDetailModal() {
  const {
    isAccountDetailOpen,
    viewingAccount,
    closeAccountDetail,
    setTransactionModalOpen,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"edit" | "history">("history");

  // Form State
  const [name, setName] = useState("");
  const [balance, setBalance] = useState<string>("");
  const [type, setType] = useState<AccountType>("bank");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const updateAccountMutation = useUpdateAccount();

  const { data: accountsData } = useAccounts();
  const currentAccount =
    accountsData?.accounts.find((a) => a.id === viewingAccount?.id) ||
    viewingAccount;

  // Fetch riwayat transaksi khusus akun ini
  const {
    data: txData,
    isLoading: isTxLoading,
  } = useAccountTransactions(currentAccount?.id, 100);

  const transactions: TransactionWithRelations[] = txData?.transactions || [];

  // Sinkronisasi data saat akun dipilih
  useEffect(() => {
    if (currentAccount) {
      setName(currentAccount.name);
      setBalance(String(currentAccount.balance));
      setType(currentAccount.type as AccountType);
      setFeedback(null);
    }
  }, [currentAccount]);

  if (!currentAccount) return null;

  const currentTypeConfig =
    ACCOUNT_TYPE_CONFIG[currentAccount.type as AccountType] ||
    ACCOUNT_TYPE_CONFIG.bank;
  const AccountIcon = currentTypeConfig.icon;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) {
      setFeedback({
        type: "error",
        message: "Nominal saldo harus berupa angka yang valid.",
      });
      return;
    }

    if (!name.trim()) {
      setFeedback({
        type: "error",
        message: "Nama rekening/dompet tidak boleh kosong.",
      });
      return;
    }

    try {
      await updateAccountMutation.mutateAsync({
        id: currentAccount.id,
        name: name.trim(),
        balance: parsedBalance,
        type,
      });

      setFeedback({
        type: "success",
        message: "Perubahan informasi dan saldo rekening berhasil disimpan!",
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Gagal memperbarui rekening",
      });
    }
  };

  const handleAddTransactionForAccount = () => {
    closeAccountDetail();
    setTransactionModalOpen(true, "expense");
  };

  return (
    <Modal
      isOpen={isAccountDetailOpen}
      onClose={closeAccountDetail}
      title={currentAccount.name}
      description={`Detail saldo & riwayat mutasi untuk ${currentTypeConfig.label}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Header Ringkasan Saldo & Info Akun */}
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-900 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 shadow-lg"
              style={{
                backgroundColor: `${currentTypeConfig.color}20`,
                color: currentTypeConfig.color,
              }}
            >
              <AccountIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {currentAccount.name}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-300 border border-white/[0.08]">
                  {currentAccount.currency}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {currentTypeConfig.label}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
            <span className="text-[11px] font-medium text-gray-400">
              Saldo Saat Ini
            </span>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight tabular-nums">
              {formatCurrency(currentAccount.balance)}
            </span>
          </div>
        </div>

        {/* Navigation Tabs: Edit vs Riwayat */}
        <div className="flex items-center p-1 rounded-xl bg-charcoal-900 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-emerald-500 text-charcoal-950 shadow-glow-emerald"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Aktivitas ({transactions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "edit"
                ? "bg-emerald-500 text-charcoal-950 shadow-glow-emerald"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Saldo & Akun</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "bg-crimson-500/10 text-crimson-300 border border-crimson-500/20"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-crimson-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* TAB 1: EDIT SALDO & INFORMASI AKUN */}
        {activeTab === "edit" && (
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="space-y-3.5 p-4 rounded-2xl bg-charcoal-900/60 border border-white/[0.06]">
              {/* Nama Akun */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Nama Dompet / Rekening:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bank BCA, Kas Dompet, ShopeePay"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              {/* Edit Nominal Saldo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Koreksi / Nominal Saldo (IDR):
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {formatCurrency(parseFloat(balance) || 0)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Ubah nominal di atas jika Anda ingin memperbarui atau menyesuaikan saldo rekening secara langsung.
                </p>
              </div>

              {/* Tipe Rekening */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Tipe Rekening / Dompet:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    Object.keys(ACCOUNT_TYPE_CONFIG) as AccountType[]
                  ).map((accType) => {
                    const cfg = ACCOUNT_TYPE_CONFIG[accType];
                    const Icon = cfg.icon;
                    const isSelected = type === accType;

                    return (
                      <button
                        key={accType}
                        type="button"
                        onClick={() => setType(accType)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white/[0.08] border-emerald-500 text-white shadow-glow-emerald"
                            : "bg-charcoal-950/60 border-white/[0.06] text-gray-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <Icon
                          className="w-4 h-4 shrink-0"
                          style={{ color: cfg.color }}
                        />
                        <span className="truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tombol Simpan Perubahan */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeAccountDetail}
                className="py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={updateAccountMutation.isPending}
                className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 text-xs font-bold flex items-center gap-2 transition-all shadow-glow-emerald disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {updateAccountMutation.isPending
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: RIWAYAT AKTIVITAS REKENING */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {isTxLoading ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full h-16 rounded-xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse"
                  />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-charcoal-900/40 border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-gray-500">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-300">
                    Belum ada riwayat transaksi untuk akun ini
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">
                    Setiap mutasi pengeluaran, pemasukan, atau transfer yang melibatkan akun ini akan tercatat rapi di sini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTransactionForAccount}
                  className="mt-2 inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Transaksi Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {transactions.map((tx) => {
                  const isExpense = tx.type === "expense";
                  const isIncome = tx.type === "income";
                  const isTransfer = tx.type === "transfer";

                  // Icon Kategori
                  const CatIcon =
                    (tx.category?.icon && CATEGORY_ICON_MAP[tx.category.icon]) ||
                    CircleDollarSign;

                  const isSourceAccount = tx.accountId === currentAccount.id;

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.06] hover:border-white/15 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                          style={{
                            backgroundColor: tx.category?.colorHex
                              ? `${tx.category.colorHex}20`
                              : isExpense
                              ? "#EF444420"
                              : isIncome
                              ? "#10B98120"
                              : "#3B82F620",
                            color: tx.category?.colorHex || (isExpense ? "#EF4444" : isIncome ? "#10B981" : "#3B82F6"),
                          }}
                        >
                          <CatIcon className="w-4 h-4" />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {tx.description || tx.category?.name || "Transaksi"}
                            </span>
                            {/* Type Badge */}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                isExpense
                                  ? "bg-crimson-500/10 text-crimson-400 border border-crimson-500/20"
                                  : isIncome
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {isExpense
                                ? "KELUAR"
                                : isIncome
                                ? "MASUK"
                                : isSourceAccount
                                ? "TRF KELUAR"
                                : "TRF MASUK"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                            <span>{formatRelativeDate(tx.date)}</span>
                            {tx.category && (
                              <>
                                <span>•</span>
                                <span className="truncate">{tx.category.name}</span>
                              </>
                            )}
                            {isTransfer && (
                              <>
                                <span>•</span>
                                <span className="truncate">
                                  {isSourceAccount
                                    ? `Ke ${tx.toAccount?.name || "Rekening Lain"}`
                                    : `Dari ${tx.account?.name || "Rekening Asal"}`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nominal */}
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-bold font-mono tracking-tight ${
                            isExpense || (isTransfer && isSourceAccount)
                              ? "text-crimson-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {isExpense || (isTransfer && isSourceAccount) ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
