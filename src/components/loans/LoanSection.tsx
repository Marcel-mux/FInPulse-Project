"use client";

import { CreditCard, Percent, Plus } from "lucide-react";
import { useLoans } from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";
import { LoanCard } from "./LoanCard";
import { formatCurrency } from "@/lib/formatters";

export function LoanSection() {
  const { data, isLoading } = useLoans();
  const { openLoanModal } = useAppStore();

  const loans = data?.loans || [];
  const totalActiveDebt = data?.totalActiveDebt || 0;
  const totalMonthlyInstallment = data?.totalMonthlyInstallment || 0;
  const activeLoansCount = data?.activeLoansCount || 0;

  return (
    <section className="w-full flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Pinjaman & Cicilan Paylater ({activeLoansCount})
          </h2>
        </div>

        <button
          onClick={() => openLoanModal("loan")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Pinjaman</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="flex flex-col gap-3">
        {/* Ringkasan Akumulasi Pinjaman */}
        {loans.length > 0 && (
          <div className="grid grid-cols-2 gap-3 p-3.5 sm:p-4 rounded-2xl bg-charcoal-900/80 border border-white/[0.08]">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-medium text-zinc-400">
                Total Pokok Hutang
              </span>
              <span className="text-xs sm:text-base font-bold font-mono text-rose-400 mt-0.5">
                {formatCurrency(totalActiveDebt)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                Memulihkan limit Paylater
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-medium text-zinc-400">
                Beban Cicilan Bulan Ini
              </span>
              <span className="text-xs sm:text-base font-bold font-mono text-white mt-0.5">
                {formatCurrency(totalMonthlyInstallment)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                Total pokok + bunga
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-charcoal-900/60 animate-pulse border border-white/[0.06]"
              />
            ))}
          </div>
        ) : loans.length === 0 ? (
          /* Empty State */
          <div className="py-8 px-4 rounded-2xl bg-charcoal-900/40 border border-dashed border-white/10 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-zinc-400 flex items-center justify-center border border-white/[0.08]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-white mb-1">
                Belum Ada Pinjaman / Cicilan
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Catat pinjaman tunai atau cicilan barang. Pokok angsuran akan memulihkan limit paylater secara otomatis saat dilunasi.
              </p>
            </div>
            <button
              onClick={() => openLoanModal("loan")}
              className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-charcoal-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simulasikan Pinjaman</span>
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
