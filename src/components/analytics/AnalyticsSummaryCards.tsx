"use client";

import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Percent,
  Wallet,
} from "lucide-react";
import { AnalyticsSummary } from "@/types";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
  isLoading?: boolean;
}

export function AnalyticsSummaryCards({
  summary,
  isLoading = false,
}: AnalyticsSummaryCardsProps) {
  const isNetPositive = summary.netCashFlow >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {/* 1. Total Pemasukan */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-glass"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">Pemasukan</span>
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
          <span className="text-[10px] text-gray-400 mt-1 block">
            Periode terpilih
          </span>
        </div>
      </motion.div>

      {/* 2. Total Pengeluaran */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-glass"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">Pengeluaran</span>
          <div className="w-8 h-8 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-black text-crimson-400 tracking-tight">
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
          <span className="text-[10px] text-gray-400 mt-1 block">
            Periode terpilih
          </span>
        </div>
      </motion.div>

      {/* 3. Arus Kas Bersih */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-glass"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">Arus Kas Bersih</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div
            className={`text-lg sm:text-2xl font-black tracking-tight ${
              isNetPositive ? "text-white" : "text-crimson-400"
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
          <span className="text-[10px] text-gray-400 mt-1 block">
            {isNetPositive ? "Surplus Keuangan" : "Defisit Keuangan"}
          </span>
        </div>
      </motion.div>

      {/* 4. Rasio Tabungan */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-glass"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">Savings Rate</span>
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-black text-violet-400 tracking-tight tabular-nums">
            {isLoading ? (
              <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
            ) : (
              `${typeof summary.savingsRate === "number" && !isNaN(summary.savingsRate) ? summary.savingsRate : 0}%`
            )}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            {(summary.savingsRate || 0) >= 20 ? "Target Ideal Tercapai" : "Dapat Ditingkatkan"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
