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
    <section className="w-full flex flex-col gap-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide text-white uppercase">
                Pinjaman & Cicilan Paylater
              </h2>
              {activeLoansCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {activeLoansCount} Aktif
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              Pemisahan otomatis pokok pemulih limit & beban bunga
            </p>
          </div>
        </div>

        <button
          onClick={openLoanModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/20 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Pinjaman</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-5 rounded-2xl glass-surface border border-white/[0.08] flex flex-col gap-4">
        {/* Ringkasan Akumulasi Pinjaman */}
        {loans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-charcoal-900/60 border border-white/[0.06]">
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Total Sisa Pokok Hutang
              </span>
              <span className="text-base font-black font-mono text-rose-400">
                {formatCurrency(totalActiveDebt)}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Akan dipulihkan ke limit Paylater
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Beban Cicilan Bulan Ini
              </span>
              <span className="text-base font-black font-mono text-white">
                {formatCurrency(totalMonthlyInstallment)}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Total angsuran pokok + bunga
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-white/[0.03] animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : loans.length === 0 ? (
          /* Empty State */
          <div className="py-8 px-4 rounded-xl bg-charcoal-900/40 border border-dashed border-white/10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-white mb-1">
                Belum Ada Pinjaman / Cicilan
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Catat pinjaman tunai atau cicilan Akulaku, Kredivo, atau SPayLater. FinPulse akan otomatis memisahkan pokok yang memulihkan limit Paylater dan bunga yang dicatat sebagai biaya pengeluaran.
              </p>
            </div>
            <button
              onClick={openLoanModal}
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-charcoal-950 font-bold text-xs hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simulasikan Pinjaman Baru</span>
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
