"use client";

import { Eye, EyeOff, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface NetWorthCardProps {
  totalNetWorth: number;
  activeAccountsCount: number;
  isLoading?: boolean;
}

export function NetWorthCard({
  totalNetWorth,
  activeAccountsCount,
  isLoading = false,
}: NetWorthCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-card border border-white/[0.08] shadow-glass">
      {/* Ambient Glows */}
      <div className="absolute -top-24 -left-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between gap-6">
        {/* Top Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-400">
              Total Net Worth (Kekayaan Bersih)
            </span>
          </div>

          <button
            onClick={() => setIsVisible((prev) => !prev)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all border border-white/[0.05]"
            aria-label={isVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            title={isVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Main Balance Display */}
        <div className="flex flex-col gap-1">
          {isLoading ? (
            <div className="h-12 w-48 bg-white/10 rounded-xl animate-pulse" />
          ) : isVisible ? (
            <div className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-1">
              <AnimatedCounter
                value={typeof totalNetWorth === "number" && !isNaN(totalNetWorth) ? totalNetWorth : 0}
                prefix="Rp "
                className="tabular-nums"
              />
            </div>
          ) : (
            <div className="text-3xl sm:text-5xl font-black tracking-widest text-gray-400 select-none">
              ••••••••••
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-gray-300">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              {activeAccountsCount || 0} Dompet / Rekening Aktif
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <TrendingUp className="w-3 h-3" />
              100% Terverifikasi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
