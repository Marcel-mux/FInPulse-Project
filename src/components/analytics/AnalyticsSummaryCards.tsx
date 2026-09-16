"use client";

import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Wallet,
} from "lucide-react";
import { AnalyticsSummary } from "@/types";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
  totalActualBalance?: number;
  isLoading?: boolean;
}

export function AnalyticsSummaryCards({
  summary,
  totalActualBalance = 0,
  isLoading = false,
}: AnalyticsSummaryCardsProps) {
  const isNetPositive = summary.netCashFlow >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {/* 1. Total Saldo Likuid */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Saldo Likuid</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
            {isLoading ? (
              <div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
            ) : (
              <AnimatedCounter
                value={totalActualBalance}
                prefix="Rp "
                className="tabular-nums"
              />
            )}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
            Kas & Bank Siap Pakai
          </span>
        </div>
      </motion.div>

      {/* 2. Total Pemasukan Riil */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Pemasukan Riil</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight">
            {isLoading ? (
              <div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
            ) : (
              <AnimatedCounter
                value={summary.totalIncome}
                prefix="Rp "
                className="tabular-nums"
              />
            )}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Uang masuk periode ini
          </span>
        </div>
      </motion.div>

      {/* 3. Total Pengeluaran Riil */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Pengeluaran Riil</span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-black text-rose-400 tracking-tight">
            {isLoading ? (
              <div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
            ) : (
              <AnimatedCounter
                value={summary.totalExpense}
                prefix="Rp "
                className="tabular-nums"
              />
            )}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Uang keluar periode ini
          </span>
        </div>
      </motion.div>

      {/* 4. Arus Kas Bersih (Net Cashflow) */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Arus Kas Bersih</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div
            className={`text-lg sm:text-2xl font-black tracking-tight ${
              isNetPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isLoading ? (
              <div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
            ) : (
              <AnimatedCounter
                value={Math.abs(summary.netCashFlow || 0)}
                prefix={isNetPositive ? "Rp " : "-Rp "}
                className="tabular-nums"
              />
            )}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block flex items-center gap-1.5">
            <span>{isNetPositive ? "Surplus Likuid" : "Defisit Likuid"}</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">
              Savings Rate {summary.savingsRate || 0}%
            </span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
