"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Briefcase,
  Car,
  CircleDollarSign,
  Clock,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Laptop,
  Receipt,
  Search,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";
import { TransactionWithRelations } from "@/types";
import { formatCurrency, formatRelativeDate } from "@/lib/formatters";
import { EmptyTransactionState } from "./EmptyTransactionState";

interface RecentActivityFeedProps {
  transactions: TransactionWithRelations[];
  isLoading?: boolean;
  onAddTransaction?: () => void;
}

const CATEGORY_ICON_MAP: Record<string, typeof CircleDollarSign> = {
  Briefcase,
  Gift,
  TrendingUp,
  Laptop,
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  HeartPulse,
  GraduationCap,
};

export function RecentActivityFeed({
  transactions,
  isLoading = false,
  onAddTransaction,
}: RecentActivityFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter(
      (tx) =>
        (tx.tags && tx.tags.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.category?.name && tx.category.name.toLowerCase().includes(q)) ||
        (tx.account.name && tx.account.name.toLowerCase().includes(q))
    );
  }, [transactions, searchQuery]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-3">
        <div className="h-6 w-44 bg-white/10 rounded-md animate-pulse" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="w-full h-16 rounded-2xl bg-charcoal-900/60 border border-white/[0.05] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return <EmptyTransactionState onAddTransaction={onAddTransaction} />;
  }

  return (
    <section className="w-full flex flex-col gap-3">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Aktivitas Terakhir
          </h2>
          <span className="text-xs text-gray-400">
            ({filteredTransactions.length} dari {transactions.length})
          </span>
        </div>

        {/* Quick Search / Tag Filter Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi atau #tagar..."
            className="w-full pl-8 pr-8 py-1.5 min-h-[36px] rounded-xl bg-charcoal-900/90 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Reset pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active tag indicator if filtered */}
      {searchQuery && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Tag className="w-3 h-3 text-emerald-400" />
            Filter aktif:
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            {searchQuery}
            <button
              onClick={() => setSearchQuery("")}
              className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Transaction List */}
      <div className="flex flex-col gap-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl glass-surface border border-dashed border-white/10 text-center text-xs text-gray-400">
            Tidak ada transaksi yang cocok dengan &quot;{searchQuery}&quot;.
            <button
              onClick={() => setSearchQuery("")}
              className="block mx-auto mt-2 text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          filteredTransactions.map((tx, index) => {
            // Resolve icon
            const IconComponent =
              (tx.category?.icon && CATEGORY_ICON_MAP[tx.category.icon]) ||
              (tx.type === "transfer" ? ArrowLeftRight : CircleDollarSign);

            // Type styling & badges
            const isIncome = tx.type === "income";
            const isTransfer = tx.type === "transfer";

            let amountPrefix = "- ";
            let amountColorClass = "text-crimson-400";
            let badgeBg = "bg-crimson-500/10 border-crimson-500/20 text-crimson-400";
            let BadgeIcon = ArrowUpRight;

            if (isIncome) {
              amountPrefix = "+ ";
              amountColorClass = "text-emerald-400";
              badgeBg = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
              BadgeIcon = ArrowDownLeft;
            } else if (isTransfer) {
              amountPrefix = "⇄ ";
              amountColorClass = "text-indigo-400";
              badgeBg = "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
              BadgeIcon = ArrowLeftRight;
            }

            // Category color
            const iconColor =
              tx.category?.colorHex || (isTransfer ? "#6366F1" : "#10B981");

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                whileHover={{
                  scale: 1.01,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                }}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl glass-surface border border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer"
              >
                {/* Left: Animated Category Icon & Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Hyper-animated category icon on hover */}
                  <motion.div
                    whileHover={{
                      scale: 1.2,
                      rotate: [0, -10, 10, 0],
                      transition: { duration: 0.35 },
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.08] shadow-sm transition-transform"
                    style={{
                      backgroundColor: `${iconColor}18`,
                      color: iconColor,
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.div>

                  {/* Info Text */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate max-w-[150px] sm:max-w-xs">
                        {tx.description || tx.category?.name || "Transaksi"}
                      </span>
                      {/* Interactive Tags pill (Clickable to filter!) */}
                      {tx.tags && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery(tx.tags!);
                          }}
                          className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-emerald-500/15 text-gray-400 hover:text-emerald-400 border border-white/[0.06] hover:border-emerald-500/30 transition-colors cursor-pointer"
                          title="Klik untuk memfilter dengan tagar ini"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{tx.tags}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                      {isTransfer ? (
                        <span className="truncate">
                          {tx.account.name} ➔ {tx.toAccount?.name || "Tujuan"}
                        </span>
                      ) : (
                        <span>{tx.account.name}</span>
                      )}
                      <span>•</span>
                      <span>{formatRelativeDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Dynamic Amount & Status Badge */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={`text-sm sm:text-base font-black tracking-tight tabular-nums ${amountColorClass}`}
                  >
                    {amountPrefix}
                    {formatCurrency(tx.amount)}
                  </span>

                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badgeBg}`}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    <span className="capitalize">
                      {isIncome
                        ? "Pemasukan"
                        : isTransfer
                        ? "Transfer"
                        : "Pengeluaran"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}
