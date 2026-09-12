"use client";

import Link from "next/link";
import { ArrowUpRight, PieChart, Sparkles } from "lucide-react";
import { useAnalytics } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";

export function QuickSpendingWidget() {
  const { data, isLoading } = useAnalytics("30d");
  const categoryBreakdown = data?.categoryBreakdown || [];
  const totalExpense = data?.summary?.totalExpense || 0;

  // Ambil 5 kategori pengeluaran terbesar
  const topCategories = categoryBreakdown.slice(0, 5);

  return (
    <section className="w-full flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Alokasi Belanja (30 Hari)
          </h2>
        </div>
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>Detail</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Card Content */}
      <div className="w-full p-5 rounded-3xl glass-card border border-white/[0.08] shadow-glass flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-10 w-full bg-white/[0.04] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : topCategories.length === 0 ? (
          <div className="py-6 px-4 text-center flex flex-col items-center justify-center text-gray-400">
            <Sparkles className="w-8 h-8 text-gray-500 mb-2" />
            <p className="text-xs font-medium">Belum ada pengeluaran tercatat dalam 30 hari terakhir.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs text-gray-400">Total Pengeluaran</span>
              <span className="text-base font-bold text-white tabular-nums">
                {formatCurrency(totalExpense)}
              </span>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              {topCategories.map((cat) => (
                <div key={cat.categoryId} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-gray-200 truncate max-w-[130px] sm:max-w-[180px]">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-white tabular-nums">
                        {formatCurrency(cat.value)}
                      </span>
                      <span className="text-[11px] text-gray-400 w-8 text-right font-medium">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
