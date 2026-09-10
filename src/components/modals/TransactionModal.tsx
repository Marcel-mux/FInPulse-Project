"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import {
  useAccounts,
  useCategories,
  useCreateTransaction,
} from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";
import { TransactionType } from "@/types";

const QUICK_AMOUNTS = [
  { label: "+10rb", val: 10_000 },
  { label: "+50rb", val: 50_000 },
  { label: "+100rb", val: 100_000 },
  { label: "+500rb", val: 500_000 },
  { label: "+1jt", val: 1_000_000 },
];

const ADMIN_FEE_PRESETS = [
  { label: "Gratis (Rp 0)", val: 0 },
  { label: "BI-Fast (Rp 2.500)", val: 2_500 },
  { label: "Realtime (Rp 6.500)", val: 6_500 },
];

export function TransactionModal() {
  const {
    isTransactionModalOpen,
    activeTransactionType,
    setTransactionModalOpen,
    setActiveTransactionType,
  } = useAppStore();

  const { data: accountsData } = useAccounts();
  const accounts = useMemo(
    () => accountsData?.accounts || [],
    [accountsData?.accounts]
  );

  const [type, setType] = useState<TransactionType>(activeTransactionType);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [adminFee, setAdminFee] = useState("0");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch categories for the current active type
  const { data: categoriesData } = useCategories(
    type === "transfer" ? undefined : type
  );
  const categories = categoriesData?.categories || [];

  const createTxMutation = useCreateTransaction();

  // Sync modal state on open
  useEffect(() => {
    if (isTransactionModalOpen) {
      setType(activeTransactionType);
      setAmount("");
      setDescription("");
      setTags("");
      setAdminFee("0");
      setError(null);

      // Default date to now in local format YYYY-MM-DDTHH:mm
      const now = new Date();
      const localDatetime = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setDate(localDatetime);

      // Default to first account if not set
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        if (accounts.length > 1) {
          setToAccountId(accounts[1].id);
        }
      }
    }
  }, [isTransactionModalOpen, activeTransactionType, accounts]);

  // When type changes, clear category selection to prevent mismatched categories
  useEffect(() => {
    setCategoryId("");
  }, [type]);

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + addValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Nominal harus berupa angka lebih besar dari 0");
      return;
    }

    if (!accountId) {
      setError("Akun asal wajib dipilih");
      return;
    }

    if (type === "transfer") {
      if (!toAccountId) {
        setError("Akun tujuan transfer wajib dipilih");
        return;
      }
      if (accountId === toAccountId) {
        setError("Akun asal dan akun tujuan transfer tidak boleh sama");
        return;
      }
    }

    try {
      await createTxMutation.mutateAsync({
        type,
        amount: parsedAmount,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        categoryId: type !== "transfer" && categoryId ? categoryId : undefined,
        adminFee: type === "transfer" ? parseFloat(adminFee) || 0 : undefined,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
      });

      // Selebrasi confetti jika mencatat pemasukan
      if (type === "income") {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#10B981", "#34D399", "#6366F1"],
        });
      }

      setTransactionModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat transaksi");
    }
  };

  const selectedSourceAccount = accounts.find((a) => a.id === accountId);

  return (
    <Modal
      isOpen={isTransactionModalOpen}
      onClose={() => setTransactionModalOpen(false)}
      title="Catat Transaksi Baru"
      description="Kelola arus kas secara presisi dengan sinkronisasi saldo otomatis."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
        {error && (
          <div className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-xs text-crimson-400">
            {error}
          </div>
        )}

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-charcoal-900 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setActiveTransactionType("expense");
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              type === "expense"
                ? "bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 shadow-glow-crimson"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Pengeluaran</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType("income");
              setActiveTransactionType("income");
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              type === "income"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Pemasukan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType("transfer");
              setActiveTransactionType("transfer");
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              type === "transfer"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-glow-indigo"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
        </div>

        {/* Large Nominal Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-300">
            Nominal Transaksi (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">
              Rp
            </span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-charcoal-900 border border-white/10 text-white placeholder-gray-600 text-2xl font-black tracking-tight focus:outline-none focus:border-emerald-500 transition-colors tabular-nums"
              required
              autoFocus
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q.val}
                type="button"
                onClick={() => handleQuickAddAmount(q.val)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] font-semibold text-gray-300 hover:text-white flex-shrink-0 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source and Destination Accounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Source Account */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              {type === "transfer" ? "Akun Pengirim (Asal)" : "Akun / Dompet"}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
            {selectedSourceAccount && (
              <span className="text-[10px] text-gray-400 mt-1 block">
                Saldo tersedia: {formatCurrency(selectedSourceAccount.balance)}
              </span>
            )}
          </div>

          {/* Destination Account (Only for Transfer) */}
          {type === "transfer" && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Akun Penerima (Tujuan)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                required
              >
                <option value="" disabled>
                  Pilih Akun Tujuan
                </option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Category (Only for Income & Expense) */}
          {type !== "transfer" && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Pilih Kategori (Opsional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Admin Fee Option (Only for Transfer) */}
        {type === "transfer" && (
          <div className="p-3 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Biaya Admin Transfer
              </span>
              <div className="flex items-center gap-1.5">
                {ADMIN_FEE_PRESETS.map((fee) => (
                  <button
                    key={fee.val}
                    type="button"
                    onClick={() => setAdminFee(String(fee.val))}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      parseFloat(adminFee) === fee.val
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                        : "bg-white/[0.02] border-white/[0.06] text-gray-400 hover:text-white"
                    }`}
                  >
                    {fee.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                Rp
              </span>
              <input
                type="number"
                min="0"
                value={adminFee}
                onChange={(e) => setAdminFee(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Tanggal & Waktu Transaksi
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-charcoal-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Description & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Catatan / Keterangan
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Makan siang ramen, Gaji bulan ini"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Tagar Kustom
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Contoh: #liburan #kuliner #projectA"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08] mt-2">
          <button
            type="button"
            onClick={() => setTransactionModalOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createTxMutation.isPending}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
              type === "expense"
                ? "bg-gradient-to-r from-crimson-500 to-crimson-600 text-white shadow-glow-crimson hover:brightness-110"
                : type === "income"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-charcoal-950 shadow-glow-emerald hover:brightness-110"
                : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-glow-indigo hover:brightness-110"
            }`}
          >
            {createTxMutation.isPending ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
