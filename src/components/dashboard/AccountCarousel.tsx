"use client";

import { motion } from "framer-motion";
import { Plus, WalletCards } from "lucide-react";
import { Account } from "@/types";
import { AccountCard } from "./AccountCard";

interface AccountCarouselProps {
  accounts: Account[];
  isLoading?: boolean;
  selectedAccountId?: string | null;
  onSelectAccount?: (id: string) => void;
  onAddAccount?: () => void;
}

export function AccountCarousel({
  accounts,
  isLoading = false,
  selectedAccountId,
  onSelectAccount,
  onAddAccount,
}: AccountCarouselProps) {
  return (
    <section className="w-full flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <WalletCards className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Dompet & Rekening ({accounts.length})
          </h2>
        </div>
        <button
          onClick={onAddAccount}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Akun</span>
        </button>
      </div>

      {/* Horizontal Carousel Container */}
      <div className="w-full overflow-x-auto pb-4 pt-1 scrollbar-none flex gap-4 snap-x snap-mandatory">
        {isLoading ? (
          // Skeleton loader
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="w-72 sm:w-80 h-44 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse flex-shrink-0"
            />
          ))
        ) : accounts.length === 0 ? (
          <div className="w-full p-8 rounded-2xl border border-dashed border-white/10 text-center text-gray-400 text-sm">
            Belum ada akun dompet aktif.
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="snap-start flex-shrink-0">
              <AccountCard
                account={account}
                isSelected={selectedAccountId === account.id}
                onSelect={onSelectAccount}
              />
            </div>
          ))
        )}

        {/* Quick Add Account Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddAccount}
          className="w-44 sm:w-48 h-44 rounded-2xl border border-dashed border-white/15 hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] transition-all flex flex-col items-center justify-center gap-3 cursor-pointer text-gray-400 hover:text-emerald-400 flex-shrink-0 select-none snap-start"
        >
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:bg-emerald-500/10">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Tambah Baru</span>
        </motion.div>
      </div>
    </section>
  );
}
