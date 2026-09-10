"use client";

import { PieChart, Plus } from "lucide-react";
import { useBudgets, useDeleteBudget } from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency } from "@/lib/formatters";
import { BudgetCard } from "./BudgetCard";
import { BudgetProgressBar } from "./BudgetProgressBar";

export function BudgetSection() {
  const { data, isLoading } = useBudgets();
  const { openBudgetForm } = useAppStore();
  const deleteBudgetMutation = useDeleteBudget();

  const budgets = data?.budgets || [];
  const totalLimit = data?.totalLimit || 0;
  const totalSpent = data?.totalSpent || 0;
  const totalRemaining = data?.totalRemaining || 0;
  const overallPercentage = data?.overallPercentage || 0;

  const now = new Date();
  const monthName = now.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const handleDeleteBudget = async (id: string) => {
    if (confirm("Apakah kamu yakin ingin menghapus target anggaran kategori ini?")) {
      try {
        await deleteBudgetMutation.mutateAsync(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menghapus bujet");
      }
    }
  };

  return (
    <section className="w-full flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Anggaran Bulanan ({monthName})
          </h2>
        </div>
        <button
          onClick={() => openBudgetForm(null)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Pasang Bujet</span>
        </button>
      </div>

      {/* Overall Budget Overview Card */}
      {budgets.length > 0 && (
        <div className="p-5 rounded-3xl glass-card border border-white/[0.08] shadow-glass flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-gray-400 font-medium">
                Total Alokasi Bujet Bulan Ini
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums mt-0.5">
                {formatCurrency(totalSpent)}{" "}
                <span className="text-sm sm:text-base font-normal text-gray-400">
                  / {formatCurrency(totalLimit)}
                </span>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col">
                <span className="text-[10px] text-gray-400">Sisa Kuota</span>
                <span className="text-xs font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(totalRemaining)}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col">
                <span className="text-[10px] text-gray-400">Terpakai</span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {overallPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Master Liquid Progress Bar */}
          <BudgetProgressBar
            percentage={overallPercentage}
            height="h-3.5"
            showLabels={true}
          />
        </div>
      )}

      {/* Category Budgets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="w-full py-10 px-6 rounded-3xl glass-card border border-white/[0.06] text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            Belum Ada Anggaran untuk Bulan Ini
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mt-1 mb-4">
            Pasang batas pengeluaran per kategori untuk mengontrol gaya hidup dan
            memperoleh peringatan dini laju pengeluaran (Burn Rate).
          </p>
          <button
            onClick={() => openBudgetForm(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-charcoal-950 font-bold text-xs shadow-glow-emerald hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pasang Bujet Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={(budget) => openBudgetForm(budget)}
              onDelete={handleDeleteBudget}
            />
          ))}
        </div>
      )}
    </section>
  );
}
