"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Cigarette,
  CircleDollarSign,
  Clock,
  Coffee,
  DollarSign,
  Edit2,
  Gift,
  HelpCircle,
  Landmark,
  Laptop,
  PiggyBank,
  Receipt,
  Repeat,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Wifi,
  Zap,
} from "lucide-react";
import { BillWithRelations } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { usePayBill } from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";
import confetti from "canvas-confetti";

const CATEGORY_ICON_MAP: Record<string, typeof CircleDollarSign> = {
  Briefcase,
  Gift,
  TrendingUp,
  Laptop,
  PiggyBank,
  DollarSign,
  Utensils,
  Receipt,
  ShoppingBag,
  Coffee,
  Cigarette,
  Wifi,
  HelpCircle,
};

interface BillCardProps {
  bill: BillWithRelations;
}

export function BillCard({ bill }: BillCardProps) {
  const { openBillForm } = useAppStore();
  const payBillMutation = usePayBill();

  const IconComp = (bill.category?.icon && CATEGORY_ICON_MAP[bill.category.icon]) || Receipt;
  const catColor = bill.category?.colorHex || "#06B6D4";

  const handlePayNow = async () => {
    if (
      confirm(
        `Bayar tagihan "${bill.name}" sebesar ${formatCurrency(
          bill.amount
        )} dari rekening ${bill.account.name}?`
      )
    ) {
      try {
        await payBillMutation.mutateAsync(bill.id);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Gagal membayar tagihan");
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 select-none ${
        bill.isPaidThisMonth
          ? "bg-charcoal-900/60 border-white/[0.06] hover:border-emerald-500/30"
          : bill.status === "due_today"
          ? "bg-gradient-to-br from-amber-950/20 via-charcoal-900 to-charcoal-950 border-amber-500/40 shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]"
          : bill.status === "overdue"
          ? "bg-gradient-to-br from-crimson-950/20 via-charcoal-900 to-charcoal-950 border-crimson-500/40 shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]"
          : "bg-charcoal-900/80 border-white/[0.08] hover:border-white/20"
      }`}
    >
      {/* Header Item: Icon, Nama, Status */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
            style={{
              backgroundColor: `${catColor}20`,
              color: catColor,
            }}
          >
            <IconComp className="w-5 h-5" />
          </div>

          <div className="flex flex-col min-w-0">
            <h4 className="text-sm font-bold text-white truncate tracking-wide">
              {bill.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="truncate">{bill.category?.name || "Tagihan"}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-gray-300">
                <Calendar className="w-3 h-3 text-gray-400" />
                Tgl {bill.dueDay}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {bill.isPaidThisMonth ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              LUNAS
            </span>
          ) : bill.status === "due_today" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
              <Clock className="w-3 h-3" />
              HARI INI
            </span>
          ) : bill.status === "overdue" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-crimson-500/15 text-crimson-400 border border-crimson-500/30">
              <AlertCircle className="w-3 h-3" />
              TERLEWAT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="w-3 h-3" />
              {bill.daysUntilDue === 1 ? "BESOK" : `${bill.daysUntilDue} HARI LAGI`}
            </span>
          )}
        </div>
      </div>

      {/* Body: Nominal & Sumber Rekening */}
      <div className="flex items-baseline justify-between pt-1 border-t border-white/[0.05]">
        <div>
          <span className="text-[10px] uppercase font-semibold text-gray-400">
            Nominal Tagihan
          </span>
          <div className="text-base font-black text-white font-mono tracking-tight">
            {formatCurrency(bill.amount)}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
            <Landmark className="w-3 h-3" />
            <span>
              {bill.account.name}{" "}
              {bill.account.accountCategory === "PAYLATER" ? "(Paylater)" : ""}
            </span>
          </span>
          <div className="text-[10px] font-medium text-gray-500">
            {bill.account.accountCategory === "PAYLATER"
              ? `Sisa Limit: ${formatCurrency(bill.account.balance)}`
              : `Saldo: ${formatCurrency(bill.account.balance)}`}
          </div>
        </div>
      </div>

      {/* Footer: Autodebet Status & Action Buttons */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-1.5">
          {bill.autoDeduct ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              Autodebet
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
              <Repeat className="w-3 h-3" />
              Pengingat
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!bill.isPaidThisMonth && (
            <button
              onClick={handlePayNow}
              disabled={payBillMutation.isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 transition-all shadow-glow-emerald disabled:opacity-50 cursor-pointer"
              title="Bayar tagihan ini sekarang"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{payBillMutation.isPending ? "..." : "Bayar"}</span>
            </button>
          )}

          <button
            onClick={() => openBillForm(bill)}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
            title="Edit Tagihan"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
