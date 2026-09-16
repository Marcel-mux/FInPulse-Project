"use client";

import { CreditCard, Plus } from "lucide-react";
import { useAccounts } from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";
import { PaylaterCard } from "./PaylaterCard";
import { formatCurrency } from "@/lib/formatters";
import { Account } from "@/types";

export function PaylaterSection() {
  const { data: accountsData, isLoading } = useAccounts();
  const { openPaylaterModal } = useAppStore();

  const paylaterAccounts = accountsData?.paylaterAccounts || [];
  const totalLimit = accountsData?.totalPaylaterLimit || 0;
  const totalUsed = accountsData?.totalPaylaterUsed || 0;
  const totalAvailable = accountsData?.totalPaylaterAvailable || 0;

  const handleEdit = (acc: Account) => {
    openPaylaterModal(acc);
  };

  const handlePayBill = (acc: Account) => {
    // Buka modal paylater dengan mode bayar tagihan
    openPaylaterModal(acc);
  };

  return (
    <section className="w-full flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Limit Paylater & Kredit ({paylaterAccounts.length})
          </h2>
        </div>

        <button
          onClick={() => openPaylaterModal(null)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Paylater</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex flex-col gap-3">
        {/* Ringkasan Akumulasi Plafon & Pemakaian */}
        {paylaterAccounts.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-charcoal-900/80 border border-white/[0.08]">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-medium text-zinc-400">
                Total Plafon
              </span>
              <span className="text-xs sm:text-base font-bold font-mono text-white mt-0.5">
                {formatCurrency(totalLimit)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-medium text-zinc-400">
                Total Sisa Limit
              </span>
              <span className="text-xs sm:text-base font-bold font-mono text-emerald-400 mt-0.5">
                {formatCurrency(totalAvailable)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-medium text-zinc-400">
                Total Pemakaian (Utang)
              </span>
              <span className="text-xs sm:text-base font-bold font-mono text-rose-400 mt-0.5">
                {formatCurrency(totalUsed)}
              </span>
            </div>
          </div>
        )}

        {/* Responsive Grid on Mobile & Desktop */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full h-44 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : paylaterAccounts.length === 0 ? (
          /* Empty State */
          <div className="w-full py-8 px-4 rounded-2xl bg-charcoal-900/40 border border-dashed border-white/10 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-zinc-400 flex items-center justify-center border border-white/[0.08]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-white mb-1">
                Belum Ada Paylater Terdaftar
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pantau sisa plafon SPayLater, GoPay Later, Kredivo, atau Akulaku secara terpisah dari saldo kas nyata.
              </p>
            </div>
            <button
              onClick={() => openPaylaterModal(null)}
              className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-charcoal-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Paylater</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {paylaterAccounts.map((account) => (
              <PaylaterCard
                key={account.id}
                account={account}
                onEdit={handleEdit}
                onPayBill={handlePayBill}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
