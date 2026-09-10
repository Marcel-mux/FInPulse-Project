"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useCategories, useUpsertBudget } from "@/hooks/useFinance";

const QUICK_LIMITS = [
  { label: "+500rb", val: 500_000 },
  { label: "+1 Juta", val: 1_000_000 },
  { label: "+2 Juta", val: 2_000_000 },
  { label: "+5 Juta", val: 5_000_000 },
];

export function BudgetFormModal() {
  const { isBudgetModalOpen, editingBudget, closeBudgetForm } = useAppStore();

  const { data: categoriesData } = useCategories("expense");
  const expenseCategories = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData?.categories]
  );

  const [categoryId, setCategoryId] = useState("");
  const [amountLimit, setAmountLimit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const upsertBudgetMutation = useUpsertBudget();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (editingBudget) {
      setCategoryId(editingBudget.categoryId);
      setAmountLimit(String(editingBudget.amountLimit));
    } else {
      setCategoryId(expenseCategories[0]?.id || "");
      setAmountLimit("");
    }
    setError(null);
  }, [editingBudget, isBudgetModalOpen, expenseCategories]);

  const handleQuickAdd = (val: number) => {
    const current = parseFloat(amountLimit) || 0;
    setAmountLimit(String(current + val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Pilih kategori pengeluaran");
      return;
    }

    const parsedLimit = parseFloat(amountLimit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError("Limit bujet harus berupa angka lebih besar dari 0");
      return;
    }

    try {
      await upsertBudgetMutation.mutateAsync({
        categoryId,
        amountLimit: parsedLimit,
        periodMonth: currentMonth,
        periodYear: currentYear,
      });
      closeBudgetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengatur bujet");
    }
  };

  const monthName = now.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <Modal
      isOpen={isBudgetModalOpen}
      onClose={closeBudgetForm}
      title={editingBudget ? "Ubah Limit Anggaran" : "Pasang Anggaran Kategori"}
      description={`Tentukan batas maksimal pengeluaran bulanan untuk periode ${monthName}.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {error && (
          <div className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-xs text-crimson-400">
            {error}
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Kategori Pengeluaran
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!!editingBudget}
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60 transition-colors"
            required
          >
            <option value="" disabled>
              Pilih Kategori Pengeluaran
            </option>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {editingBudget && (
            <span className="text-[10px] text-gray-400 mt-1 block">
              Kategori tidak dapat diubah saat mode edit. Hapus dan buat baru jika ingin mengganti kategori.
            </span>
          )}
        </div>

        {/* Amount Limit Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Batas Maksimal Pengeluaran (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">
              Rp
            </span>
            <input
              type="number"
              min="1000"
              step="any"
              value={amountLimit}
              onChange={(e) => setAmountLimit(e.target.value)}
              placeholder="Contoh: 2500000"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white text-base font-bold placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors tabular-nums"
              required
              autoFocus
            />
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_LIMITS.map((q) => (
              <button
                key={q.val}
                type="button"
                onClick={() => handleQuickAdd(q.val)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] font-semibold text-gray-300 hover:text-white flex-shrink-0 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08] mt-2">
          <button
            type="button"
            onClick={closeBudgetForm}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={upsertBudgetMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-charcoal-950 text-xs font-bold shadow-glow-emerald hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            {upsertBudgetMutation.isPending
              ? "Menyimpan..."
              : editingBudget
              ? "Simpan Perubahan"
              : "Tetapkan Bujet"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
