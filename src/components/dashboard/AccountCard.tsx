"use client";

import { Banknote, CreditCard, Landmark, TrendingUp, Wallet } from "lucide-react";
import { Account, AccountType } from "@/types";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface AccountCardProps {
  account: Account;
  isSelected?: boolean;
  onSelect?: (accountId: string) => void;
  onClick?: (account: Account) => void;
}

const TYPE_CONFIG: Record<
  AccountType,
  {
    label: string;
    icon: typeof Landmark;
    accentBg: string;
    accentText: string;
  }
> = {
  bank: {
    label: "Bank",
    icon: Landmark,
    accentBg: "bg-blue-500/10 border-blue-500/20",
    accentText: "text-blue-400",
  },
  cash: {
    label: "Kas Tunai",
    icon: Banknote,
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
    accentText: "text-emerald-400",
  },
  ewallet: {
    label: "E-Wallet",
    icon: Wallet,
    accentBg: "bg-teal-500/10 border-teal-500/20",
    accentText: "text-teal-400",
  },
  investment: {
    label: "Investasi",
    icon: TrendingUp,
    accentBg: "bg-indigo-500/10 border-indigo-500/20",
    accentText: "text-indigo-400",
  },
  credit: {
    label: "Kredit / PayLater",
    icon: CreditCard,
    accentBg: "bg-rose-500/10 border-rose-500/20",
    accentText: "text-rose-400",
  },
};

export function AccountCard({
  account,
  isSelected = false,
  onSelect,
  onClick,
}: AccountCardProps) {
  const config = TYPE_CONFIG[account.type] || TYPE_CONFIG.bank;
  const IconComponent = config.icon;

  return (
    <div
      onClick={() => {
        onClick?.(account);
        onSelect?.(account.id);
      }}
      className={`group relative w-full h-36 sm:h-40 rounded-2xl p-4 sm:p-5 cursor-pointer select-none transition-all duration-200 flex flex-col justify-between bg-charcoal-900/80 hover:bg-charcoal-900 border ${
        isSelected
          ? "border-emerald-500/70 ring-1 ring-emerald-500/50 shadow-sm"
          : "border-white/[0.08] hover:border-white/20"
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${config.accentBg} ${config.accentText}`}
            style={
              account.colorHex
                ? {
                    backgroundColor: `${account.colorHex}18`,
                    borderColor: `${account.colorHex}30`,
                    color: account.colorHex,
                  }
                : undefined
            }
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {account.name}
            </h3>
            <span className="text-[11px] font-medium text-zinc-400 block">
              {config.label}
            </span>
          </div>
        </div>

        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06] shrink-0 font-mono">
          {account.currency || "IDR"}
        </span>
      </div>

      {/* Card Body / Balance */}
      <div className="flex flex-col gap-0.5 pt-1">
        <span className="text-[11px] text-zinc-400 font-medium">
          Saldo Tersedia
        </span>
        <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline">
          <AnimatedCounter
            value={account.balance}
            prefix="Rp "
            className="tabular-nums"
          />
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Aktif</span>
        </div>
        <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
          Detail →
        </span>
      </div>
    </div>
  );
}
