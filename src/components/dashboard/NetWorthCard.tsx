"use client";

import { Eye, EyeOff, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { formatCurrency } from "@/lib/formatters";

interface NetWorthCardProps {
  totalNetWorth: number;
  totalActualBalance?: number;
  totalDebt?: number;
  activeAccountsCount: number;
  isLoading?: boolean;
}

export function NetWorthCard({
  totalNetWorth,
  totalActualBalance = 0,
  totalDebt = 0,
  activeAccountsCount,
  isLoading = false,
}: NetWorthCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const isNegative = totalNetWorth < 0;

  return (
    <div className="w-full relative rounded-3xl p-6 sm:p-8 bg-charcoal-900/90 border border-white/[0.08] shadow-card">
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* Top Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Kekayaan Bersih
            </span>
          </div>

          <button
            onClick={() => setIsVisible((prev) => !prev)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors border border-white/[0.06] cursor-pointer"
            aria-label={isVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            title={isVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Balance Display */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="h-12 w-48 bg-white/10 rounded-xl animate-pulse" />
          ) : isVisible ? (
            <div
              className={`text-3xl sm:text-5xl font-black tracking-tight tabular-nums ${
                isNegative ? "text-rose-400" : "text-white"
              }`}
            >
              <AnimatedCounter
                value={
                  typeof totalNetWorth === "number" && !isNaN(totalNetWorth)
                    ? totalNetWorth
                    : 0
                }
                prefix="Rp "
                className="tabular-nums"
              />
            </div>
          ) : (
            <div className="text-3xl sm:text-5xl font-black tracking-widest text-zinc-500 select-none">
              ••••••••••
            </div>
          )}

          {/* Supporting Financial Breakdown (Liquid vs Debt) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-zinc-400 font-medium">Kas & Bank:</span>
              <span className="font-semibold text-zinc-200 font-mono">
                {isLoading ? "..." : isVisible ? formatCurrency(totalActualBalance) : "••••"}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span className="text-zinc-400 font-medium">Utang:</span>
              <span className="font-semibold text-rose-400 font-mono">
                {isLoading ? "..." : isVisible ? formatCurrency(totalDebt) : "••••"}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400">
              <Wallet className="w-3.5 h-3.5 text-zinc-500" />
              <span>{activeAccountsCount || 0} Akun Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
