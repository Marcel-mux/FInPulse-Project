"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  CreditCard,
  Gauge,
  Percent,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { CreditFacilitySummary } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface CreditPlatformListProps {
  creditFacility?: CreditFacilitySummary;
  isLoading?: boolean;
}

export function CreditPlatformList({
  creditFacility,
  isLoading = false,
}: CreditPlatformListProps) {
  const totalLimit = creditFacility?.totalCreditLimit || 0;
  const totalUsed = creditFacility?.totalUsedCredit || 0;
  const utilization = creditFacility?.creditUtilization || 0;
  const platforms = creditFacility?.platforms || [];

  // Indikator status kesehatan kredit
  const getUtilizationStatus = (rate: number) => {
    if (rate < 30) {
      return {
        label: "Sehat & Aman (< 30%)",
        colorClass: "text-emerald-400",
        badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
        progressColor: "bg-emerald-400",
      };
    } else if (rate <= 70) {
      return {
        label: "Waspada / Beban Sedang (30% - 70%)",
        colorClass: "text-amber-400",
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
        progressColor: "bg-amber-400",
      };
    } else {
      return {
        label: "Beban Tinggi / Berisiko (> 70%)",
        colorClass: "text-rose-400",
        badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-300",
        progressColor: "bg-rose-500",
      };
    }
  };

  const overallStatus = getUtilizationStatus(utilization);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Disclaimer Banner Penjelas (Bukan Uang Riil) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Plafon Kredit & Kewajiban Berjalan
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Tidak Dihitung Sebagai Saldo Kas
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mt-1">
              Fasilitas Paylater dan Kartu Kredit merupakan instrumen utang, bukan dana simpanan likuid. Sisa limit yang belum terpakai tidak dimasukkan ke dalam total kekayaan bersih Anda.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        {/* 1. Total Plafon Tersedia */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-glass"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">
              Total Plafon Kredit
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isLoading ? (
                <div className="h-7 w-28 bg-white/10 rounded animate-pulse" />
              ) : (
                <AnimatedCounter value={totalLimit} prefix="Rp " className="tabular-nums" />
              )}
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Akumulasi batas kredit seluruh platform
            </span>
          </div>
        </motion.div>

        {/* 2. Total Limit Terpakai (Tagihan Aktif) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-glass"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">
              Limit Terpakai (Utang Aktif)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
              {isLoading ? (
                <div className="h-7 w-28 bg-white/10 rounded animate-pulse" />
              ) : (
                <AnimatedCounter value={totalUsed} prefix="Rp " className="tabular-nums" />
              )}
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Kewajiban aktif yang wajib dilunasi
            </span>
          </div>
        </motion.div>

        {/* 3. Persentase Beban Kredit (Utilization Rate) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col justify-between gap-3 shadow-glass"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">
              Rasio Penggunaan (Utilization)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${overallStatus.colorClass}`}>
              {isLoading ? (
                <div className="h-7 w-20 bg-white/10 rounded animate-pulse" />
              ) : (
                <span>{utilization}%</span>
              )}
            </div>
            <span className={`text-[10px] font-semibold mt-1 inline-block px-2 py-0.5 rounded-md border ${overallStatus.badgeBg}`}>
              {overallStatus.label}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Daftar Breakdown Per Platform Paylater */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/[0.08] flex flex-col gap-4 shadow-glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Rincian Akun Paylater & Fasilitas Kredit
              </h3>
              <p className="text-[11px] text-gray-400">
                Plafon, sisa limit, dan jadwal jatuh tempo rutin
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-zinc-400 font-mono">
            {platforms.length} Platform Terdaftar
          </span>
        </div>

        {platforms.length === 0 ? (
          <div className="py-10 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
            <CreditCard className="w-8 h-8 text-zinc-600" />
            <span>Belum ada akun bertipe Paylater yang terdaftar.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {platforms.map((p) => {
              const platformStatus = getUtilizationStatus(p.utilizationRate);
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/10 flex flex-col gap-3 hover:border-white/20 transition-all"
                >
                  {/* Top Header Platform */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 font-bold shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>Jatuh tempo tiap tgl {p.dueDay}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${platformStatus.badgeBg}`}>
                      {p.utilizationRate}% Terpakai
                    </span>
                  </div>

                  {/* Progress Bar Utilization */}
                  <div className="flex flex-col gap-1">
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${platformStatus.progressColor}`}
                        style={{ width: `${Math.min(100, p.utilizationRate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Nominal Breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400">Plafon</span>
                      <span className="text-xs font-bold font-mono text-white mt-0.5">
                        {formatCurrency(p.creditLimit)}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-rose-400 font-medium">Terpakai</span>
                      <span className="text-xs font-bold font-mono text-rose-400 mt-0.5">
                        {formatCurrency(p.usedCredit)}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-emerald-400 font-medium">Sisa Limit</span>
                      <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                        {formatCurrency(p.remainingCredit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips Kesehatan Kredit */}
        <div className="mt-2 p-3.5 rounded-xl bg-charcoal-950/60 border border-white/5 flex items-start gap-2.5 text-xs text-zinc-400">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Tips FinPulse:</strong> Pertahankan rasio penggunaan kredit di bawah 30% dari total plafon untuk menjaga beban cicilan bulanan tetap ringan dan kesehatan finansial tetap optimal.
          </p>
        </div>
      </div>
    </div>
  );
}
