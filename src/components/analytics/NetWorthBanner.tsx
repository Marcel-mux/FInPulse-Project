"use client";

import { formatCurrency } from "@/lib/formatters";
import { NetWorthSummary } from "@/types";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ShieldCheck, Minus, Equal, Sparkles } from "lucide-react";

interface NetWorthBannerProps {
  netWorth?: NetWorthSummary;
  isLoading?: boolean;
}

export function NetWorthBanner({
  netWorth,
  isLoading = false,
}: NetWorthBannerProps) {
  const actual = netWorth?.totalActualBalance || 0;
  const debt = netWorth?.totalUsedCredit || 0;
  const total = netWorth?.netWorth || 0;

  return (
    <div className="w-full relative overflow-hidden rounded-3xl p-5 sm:p-7 glass-card border border-white/[0.08] shadow-glass">
      {/* Ambient Glows */}
      <div className="absolute -top-20 -left-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-16 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header with Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              Kekayaan Bersih (Net Worth Riil)
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>100% Saldo Likuid Riil (Plafon Kredit Dipisahkan)</span>
          </div>
        </div>

        {/* Main Number & Formula Breakdown */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1">
          <div>
            <span className="text-xs text-zinc-400 font-medium block mb-1">
              Total Kekayaan Bersih Saat Ini:
            </span>
            <div className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {isLoading ? (
                <div className="h-12 w-48 bg-white/10 rounded-xl animate-pulse" />
              ) : (
                <AnimatedCounter value={total} prefix="Rp " className="tabular-nums" />
              )}
            </div>
          </div>

          {/* Formula Interactive Banner */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-charcoal-900/90 border border-white/[0.08] text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                Saldo Likuid Kas & Bank
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-white">
                {isLoading ? "..." : formatCurrency(actual)}
              </span>
            </div>

            <div className="p-1 rounded-full bg-white/5 text-zinc-400">
              <Minus className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-rose-400 font-semibold uppercase">
                Utang Paylater Aktif
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-rose-400">
                {isLoading ? "..." : formatCurrency(debt)}
              </span>
            </div>

            <div className="p-1 rounded-full bg-white/5 text-zinc-400">
              <Equal className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-indigo-400 font-semibold uppercase">
                Kekayaan Bersih
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-300">
                {isLoading ? "..." : formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Rumus Transparan Footer */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-zinc-500">Rumus Kalkulasi:</span>
            <code className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono text-[11px] border border-emerald-500/20">
              {netWorth?.formula || "Kekayaan Bersih = Total Saldo Aktual - Total Limit Terpakai (Utang Paylater & Pokok Pinjaman Aktif)"}
            </code>
          </div>
          <span className="text-[10px] text-zinc-500 italic">
            *Sisa limit paylater tidak dihitung sebagai aset kekayaan
          </span>
        </div>
      </div>
    </div>
  );
}
