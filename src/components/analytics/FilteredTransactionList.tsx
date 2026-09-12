"use client";

import {
  ArrowLeftRight,
  Briefcase,
  Car,
  Cigarette,
  CircleDollarSign,
  Coffee,
  Coins,
  DollarSign,
  Film,
  Filter,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  Receipt,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Utensils,
  Wifi,
  Wrench,
  X,
} from "lucide-react";
import { TransactionWithRelations } from "@/types";
import { formatCurrency, formatRelativeDate } from "@/lib/formatters";

interface FilteredTransactionListProps {
  transactions: TransactionWithRelations[];
  selectedCategoryId: string | null;
  selectedCategoryName?: string;
  onClearFilter: () => void;
  isLoading?: boolean;
}

const CATEGORY_ICON_MAP: Record<string, typeof CircleDollarSign> = {
  Briefcase,
  Gift,
  TrendingUp,
  Laptop,
  PiggyBank,
  Coins,
  DollarSign,
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  HeartPulse,
  GraduationCap,
  Coffee,
  Cigarette,
  Wifi,
  Home,
  Plane,
  Smartphone,
  Gamepad2,
  Wrench,
};

export function FilteredTransactionList({
  transactions,
  selectedCategoryId,
  selectedCategoryName,
  onClearFilter,
  isLoading = false,
}: FilteredTransactionListProps) {
  const filtered = selectedCategoryId
    ? transactions.filter(
        (t) =>
          (t.categoryId && t.categoryId === selectedCategoryId) ||
          (!t.categoryId && selectedCategoryId === "uncategorized")
      )
    : transactions;

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-2.5 animate-pulse">
        <div className="h-6 w-44 bg-white/10 rounded" />
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="w-full h-16 rounded-2xl bg-charcoal-900/60 border border-white/[0.06]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header & Filter Indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Rincian Transaksi ({filtered.length})
          </h3>
        </div>

        {selectedCategoryId && (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold">
              <Filter className="w-3 h-3" />
              <span>Filter: {selectedCategoryName || "Kategori Terpilih"}</span>
              <button
                onClick={onClearFilter}
                className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white"
                title="Hapus filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="w-full py-10 px-4 rounded-2xl glass-card border border-dashed border-white/10 text-center text-xs text-gray-400">
          Tidak ada transaksi untuk kategori atau rentang waktu ini.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {filtered.map((tx) => {
            const IconComponent =
              (tx.category?.icon && CATEGORY_ICON_MAP[tx.category.icon]) ||
              (tx.type === "transfer" ? ArrowLeftRight : CircleDollarSign);

            const isIncome = tx.type === "income";
            const isTransfer = tx.type === "transfer";
            const amountColor = isIncome
              ? "text-emerald-400"
              : isTransfer
              ? "text-indigo-400"
              : "text-crimson-400";
            const prefix = isIncome ? "+ " : isTransfer ? "⇄ " : "- ";

            const categoryColor =
              tx.category?.colorHex || (isTransfer ? "#6366F1" : "#10B981");

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl glass-surface border border-white/[0.06] hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0"
                    style={{
                      backgroundColor: `${categoryColor}18`,
                      color: categoryColor,
                    }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[160px] sm:max-w-xs">
                        {tx.description || tx.category?.name || "Transaksi"}
                      </span>
                      {tx.tags && (
                        <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.06]">
                          {tx.tags}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                      <span>{tx.account.name}</span>
                      <span>•</span>
                      <span>{formatRelativeDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-black tracking-tight tabular-nums ${amountColor}`}
                  >
                    {prefix}
                    {formatCurrency(tx.amount)}
                  </span>
                  <div className="text-[10px] text-gray-400 capitalize">
                    {tx.category?.name || tx.type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
