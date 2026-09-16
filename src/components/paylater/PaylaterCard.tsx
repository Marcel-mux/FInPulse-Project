"use client";

import { ArrowUpRight, CreditCard } from "lucide-react";
import { Account } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface PaylaterCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onPayBill: (account: Account) => void;
}

export function PaylaterCard({ account, onEdit, onPayBill }: PaylaterCardProps) {
  const creditLimit = account.creditLimit ?? account.balance ?? 0;
  const availableLimit = Math.max(0, account.balance);
  const usedLimit = Math.max(0, creditLimit - availableLimit);
  const usagePercentage =
    creditLimit > 0
      ? Math.min(100, Math.round((usedLimit / creditLimit) * 100))
      : 0;

  // Status badge & bar color based on usage thresholds
  let statusBadge = {
    label: "Aman (< 40%)",
    colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    barColor: "bg-emerald-400",
  };

  if (usagePercentage >= 80) {
    statusBadge = {
      label: "Beban Tinggi (≥ 80%)",
      colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      barColor: "bg-rose-500",
    };
  } else if (usagePercentage >= 40) {
    statusBadge = {
      label: "Waspada (40% - 79%)",
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      barColor: "bg-amber-400",
    };
  }

  return (
    <div
      onClick={() => onEdit(account)}
      className="group relative w-full rounded-2xl p-4 sm:p-5 cursor-pointer select-none transition-all duration-200 bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-white/20 flex flex-col justify-between gap-4 shadow-sm"
    >
      {/* 1. Card Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-amber-500/20 bg-amber-500/10 text-amber-400 shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
              {account.name}
            </h3>
            <span className="text-[11px] font-medium text-zinc-400">
              Fasilitas Kredit
            </span>
          </div>
        </div>

        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.colorClass}`}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* 2. Card Body: Sisa Limit */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-zinc-400 font-medium">
          Sisa Limit Tersedia
        </span>
        <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight flex items-baseline">
          <AnimatedCounter
            value={availableLimit}
            prefix="Rp "
            className="tabular-nums"
          />
        </div>
      </div>

      {/* 3. Usage Progress Bar */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
          <span>Terpakai: {formatCurrency(usedLimit)}</span>
          <span className="font-mono text-zinc-300 font-bold">{usagePercentage}%</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusBadge.barColor}`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5 font-mono">
          <span>Plafon: {formatCurrency(creditLimit)}</span>
        </div>
      </div>

      {/* 4. Card Footer / Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px]">
        <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
          Detail & Riwayat →
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPayBill(account);
          }}
          className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Bayar</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>
    </div>
  );
}
