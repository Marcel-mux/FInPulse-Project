"use client";

import { motion } from "framer-motion";
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
    <section className="w-full flex flex-col gap-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide text-white uppercase">
                Limit Paylater & Kredit
              </h2>
              {paylaterAccounts.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {paylaterAccounts.length} Akun
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              Terpisah dari uang riil & Net Worth utama
            </p>
          </div>
        </div>

        <button
          onClick={() => openPaylaterModal(null)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/20 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Paylater</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-5 rounded-2xl glass-surface border border-white/[0.08] flex flex-col gap-4">
        {/* Ringkasan Akumulasi Plafon & Pemakaian */}
        {paylaterAccounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-charcoal-900/60 border border-white/[0.06]">
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Total Plafon Kredit
              </span>
              <span className="text-base font-black font-mono text-white">
                {formatCurrency(totalLimit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Total Sisa Limit
              </span>
              <span className="text-base font-black font-mono text-emerald-400">
                {formatCurrency(totalAvailable)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Total Pemakaian (Hutang)
              </span>
              <span className="text-base font-black font-mono text-rose-400">
                {formatCurrency(totalUsed)}
              </span>
            </div>
          </div>
        )}

        {/* Wadah Gulir Horizontal (Horizontal Carousel) */}
        <div className="w-full flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 no-scrollbar touch-pan-x">
          {isLoading ? (
            /* Skeleton loader horizontal */
            Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="min-w-[285px] sm:min-w-[320px] max-w-[340px] h-52 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse shrink-0 snap-start"
              />
            ))
          ) : paylaterAccounts.length === 0 ? (
            /* Empty State */
            <div className="w-full py-8 px-4 rounded-xl bg-charcoal-900/40 border border-dashed border-white/10 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-bold text-white mb-1">
                  Belum Ada Paylater Terdaftar
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Pantau sisa plafon SPayLater, GoPay Later, Kredivo, atau Akulaku tanpa mencampurnya dengan saldo kas nyata. Catat transaksi dan set limit otomatis via WhatsApp Bot!
                </p>
              </div>
              <button
                onClick={() => openPaylaterModal(null)}
                className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-charcoal-950 font-bold text-xs hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Daftarkan Paylater Pertama</span>
              </button>
            </div>
          ) : (
            <>
              {/* Cards Carousel */}
              {paylaterAccounts.map((account) => (
                <PaylaterCard
                  key={account.id}
                  account={account}
                  onEdit={handleEdit}
                  onPayBill={handlePayBill}
                />
              ))}

              {/* Tombol Aksi Cepat: Card Tambah Paylater di Akhir Carousel */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openPaylaterModal(null)}
                className="min-w-[200px] sm:min-w-[220px] max-w-[240px] h-auto min-h-[220px] rounded-2xl border border-dashed border-white/15 hover:border-orange-500/50 hover:bg-orange-500/[0.03] transition-all flex flex-col items-center justify-center gap-3 cursor-pointer text-gray-400 hover:text-orange-400 shrink-0 select-none snap-start p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:bg-orange-500/10">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Tambah Paylater</span>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
