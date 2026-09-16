"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Car,
  Cigarette,
  CircleDollarSign,
  Coffee,
  Coins,
  DollarSign,
  Edit2,
  Film,
  Flame,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  Smartphone,
  Trash2,
  TrendingUp,
  Utensils,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import { BudgetWithCategory } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { BudgetProgressBar } from "./BudgetProgressBar";

interface BudgetCardProps {
  budget: BudgetWithCategory;
  onEdit?: (budget: BudgetWithCategory) => void;
  onDelete?: (id: string) => void;
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

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const IconComponent =
    (budget.category.icon && CATEGORY_ICON_MAP[budget.category.icon]) ||
    CircleDollarSign;
  const categoryColor = budget.category.colorHex || "#10B981";

  // Threshold alerts
  const safePercentage =
    typeof budget.percentage === "number" && !isNaN(budget.percentage)
      ? budget.percentage
      : 0;
  const isOverbudget = safePercentage >= 100;
  const isCritical = safePercentage > 90;
  const isWarning = safePercentage >= 70 && safePercentage <= 90;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      transition={{ duration: 0.15 }}
      className={`relative p-5 rounded-2xl glass-card border transition-all flex flex-col justify-between gap-4 ${
        isCritical
          ? "border-rose-500/30 shadow-card"
          : isWarning
          ? "border-amber-500/30 shadow-card"
          : "border-white/[0.08] hover:border-white/15"
      }`}
    >
      {/* Top Header: Category Info & Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
            }}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white tracking-tight truncate">
              {budget.category.name}
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">
              Limit: {formatCurrency(budget.amountLimit)}
            </span>
          </div>
        </div>

        {/* Edit & Delete Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.06] transition-colors"
              title="Ubah Limit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(budget.id)}
              className="p-1.5 rounded-lg bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-400 border border-crimson-500/20 transition-colors"
              title="Hapus Bujet"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle: Amount Usage & Liquid Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white tracking-tight tabular-nums">
              {formatCurrency(budget.totalSpent)}
            </span>
            <span className="text-xs text-gray-400 font-medium">terpakai</span>
          </div>

          <span
            className={`text-xs font-bold tabular-nums ${
              isCritical
                ? "text-crimson-400 font-black"
                : isWarning
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {budget.percentage}%
          </span>
        </div>

        {/* Liquid-fill Animated Bar */}
        <BudgetProgressBar
          percentage={budget.percentage}
          height="h-2.5"
          showLabels={false}
        />
      </div>

      {/* Bottom Footer: Proyeksi Burn Rate */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs gap-2">
        {/* Burn Rate Badge */}
        {isOverbudget ? (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-crimson-500/15 border border-crimson-500/30 text-crimson-400 text-[11px] font-bold">
            <Flame className="w-3 h-3 text-crimson-400 shrink-0" />
            <span>Bujet Habis! (+{formatCurrency(budget.totalSpent - budget.amountLimit)})</span>
          </div>
        ) : budget.estimatedDaysRemaining !== null ? (
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
              budget.isWarning
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>
              Habis dlm ~{budget.estimatedDaysRemaining} hari{" "}
              {budget.isWarning ? "(Beresiko!)" : "(Aman)"}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] text-gray-400 text-[11px]">
            <span>Belum ada pengeluaran</span>
          </div>
        )}

        {/* Daily Average Burn */}
        <div className="text-right text-[11px] text-gray-400 font-medium truncate">
          Rata-rata: <span className="text-gray-200 font-semibold">{formatCurrency(budget.dailyBurnRate)}</span>/hari
        </div>
      </div>
    </motion.div>
  );
}
