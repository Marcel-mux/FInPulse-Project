"use client";

import { motion } from "framer-motion";
import { CreditCard, Edit2, ArrowUpRight } from "lucide-react";
import { Account } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface PaylaterCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onPayBill: (account: Account) => void;
}

export function PaylaterCard({ account, onEdit, onPayBill }: PaylaterCardProps) {
  const creditLimit = account.creditLimit ?? account.balance ?? 0;
  const availableLimit = Math.max(0, account.balance);
  const usedLimit = Math.max(0, creditLimit - availableLimit);
  const usagePercentage = creditLimit > 0 ? Math.min(100, Math.round((usedLimit / creditLimit) * 100)) : 0;

  // Tentukan badge status & warna progress
  let statusBadge = {
    label: "Aman",
    colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    barColor: "from-emerald-500 to-teal-400",
  };

  if (usagePercentage >= 80) {
    statusBadge = {
      label: "Hampir Penuh",
      colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      barColor: "from-rose-500 to-red-400",
    };
  } else if (usagePercentage >= 40) {
    statusBadge = {
      label: "Terpakai Sedang",
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      barColor: "from-amber-500 to-yellow-400",
    };
  }

  // Provider theme accents
  const nameLower = account.name.toLowerCase();
  let cardAccent = "from-orange-500/15 via-charcoal-900 to-charcoal-900 border-orange-500/20";
  let iconBg = "bg-orange-500/20 text-orange-400";

  if (nameLower.includes("gopay")) {
    cardAccent = "from-emerald-500/15 via-charcoal-900 to-charcoal-900 border-emerald-500/20";
    iconBg = "bg-emerald-500/20 text-emerald-400";
  } else if (nameLower.includes("kredivo")) {
    cardAccent = "from-blue-500/15 via-charcoal-900 to-charcoal-900 border-blue-500/20";
    iconBg = "bg-blue-500/20 text-blue-400";
  } else if (nameLower.includes("akulaku")) {
    cardAccent = "from-red-500/15 via-charcoal-900 to-charcoal-900 border-red-500/20";
    iconBg = "bg-red-500/20 text-red-400";
  } else if (nameLower.includes("indodana")) {
    cardAccent = "from-cyan-500/15 via-charcoal-900 to-charcoal-900 border-cyan-500/20";
    iconBg = "bg-cyan-500/20 text-cyan-400";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-b ${cardAccent} border relative flex flex-col justify-between gap-4 shadow-lg hover:border-white/20 transition-all`}
    >
      {/* Header Card: Provider Name & Edit Button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} shadow-inner`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{account.name}</h3>
            <span className="text-[11px] text-gray-400">Plafon: {formatCurrency(creditLimit)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.colorClass}`}>
            {statusBadge.label}
          </span>
          <button
            onClick={() => onEdit(account)}
            title="Edit Plafon & Sisa Limit"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Numbers: Sisa Limit vs Terpakai */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-charcoal-950/60 border border-white/5">
        <div>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
            Sisa Limit
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
            {formatCurrency(availableLimit)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
            Terpakai
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-rose-400">
            {formatCurrency(usedLimit)}
          </span>
        </div>
      </div>

      {/* Progress Bar Limit Terpakai */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span className="text-gray-400">Penggunaan Plafon</span>
          <span className="text-gray-300 font-bold font-mono">{usagePercentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${statusBadge.barColor} transition-all duration-500`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>

      {/* Action Button: Bayar Tagihan */}
      <div className="pt-1">
        <button
          onClick={() => onPayBill(account)}
          className="w-full py-2 px-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>Bayar Tagihan</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>
    </motion.div>
  );
}
