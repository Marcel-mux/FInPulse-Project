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
  onAccountClick?: (account: Account) => void;
  onAddAccount?: () => void;
  onManageAccounts?: () => void;
}

export function AccountCarousel({
  accounts,
  isLoading = false,
  selectedAccountId,
  onSelectAccount,
  onAccountClick,
  onAddAccount,
  onManageAccounts,
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
        <div className="flex items-center gap-3">
          {onManageAccounts && (
            <button
              onClick={onManageAccounts}
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Kelola Semua
            </button>
          )}
          <button
            onClick={onAddAccount}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Akun</span>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel on Mobile / Responsive Grid on Desktop */}
      <div className="w-full flex md:grid md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 overflow-x-auto md:overflow-visible no-scrollbar pb-4 pt-1 snap-x snap-mandatory touch-pan-x">
        {isLoading ? (
          // Skeleton loader
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="w-64 sm:w-72 md:w-full h-40 sm:h-44 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse shrink-0 md:shrink"
            />
          ))
        ) : accounts.length === 0 ? (
          <div className="w-full md:col-span-2 xl:col-span-3 p-8 rounded-2xl border border-dashed border-white/10 text-center text-gray-400 text-sm">
            Belum ada akun dompet aktif.
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="snap-start shrink-0 md:shrink w-auto md:w-full">
              <AccountCard
                account={account}
                isSelected={selectedAccountId === account.id}
                onSelect={onSelectAccount}
                onClick={onAccountClick}
              />
            </div>
          ))
        )}

        {/* Quick Add Account Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddAccount}
          className="w-36 sm:w-48 md:w-full h-40 sm:h-44 rounded-2xl border border-dashed border-white/15 hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] transition-all flex flex-col items-center justify-center gap-3 cursor-pointer text-gray-400 hover:text-emerald-400 shrink-0 md:shrink select-none snap-start"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:bg-emerald-500/10">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold">Tambah Baru</span>
        </motion.div>
      </div>
    </section>
  );
}
