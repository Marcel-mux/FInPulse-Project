"use client";

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

      {/* Responsive Grid on Mobile & Desktop (No clipping, 1-col on mobile, 2-col on sm, 3-col on xl) */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pt-1">
        {isLoading ? (
          // Skeleton loader
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="w-full h-36 sm:h-40 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse"
            />
          ))
        ) : accounts.length === 0 ? (
          <div className="w-full sm:col-span-2 xl:col-span-3 p-8 rounded-2xl border border-dashed border-white/10 text-center text-zinc-400 text-sm">
            Belum ada akun dompet aktif.
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="w-full">
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
        <div
          onClick={onAddAccount}
          className="w-full h-36 sm:h-40 rounded-2xl border border-dashed border-white/15 hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer text-zinc-400 hover:text-emerald-400 select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">Tambah Akun Baru</span>
        </div>
      </div>
    </section>
  );
}
