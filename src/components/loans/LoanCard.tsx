"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoanWithRelations } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useDeleteLoan, usePayLoan } from "@/hooks/useFinance";

interface LoanCardProps {
  loan: LoanWithRelations;
}

export function LoanCard({ loan }: LoanCardProps) {
  const payLoanMutation = usePayLoan();
  const deleteLoanMutation = useDeleteLoan();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isCompleted = loan.status === "COMPLETED" || loan.remainingMonths <= 0;
  const currentInstallment = loan.tenor - loan.remainingMonths + 1;
  const progressPercent = Math.min(
    100,
    Math.round(((loan.tenor - loan.remainingMonths) / loan.tenor) * 100)
  );

  const handlePay = async () => {
    if (payLoanMutation.isPending || isCompleted) return;
    try {
      await payLoanMutation.mutateAsync(loan.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLoanMutation.mutateAsync(loan.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-charcoal-900/70 border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col gap-3.5 relative overflow-hidden group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white leading-tight">
              {loan.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400">
              <span className="text-orange-400 font-semibold">
                {loan.paylaterAccount.name}
              </span>
              <span>•</span>
              <span>Tenor {loan.tenor} bln</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Lunas</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
            <Clock className="w-3 h-3" />
            <span>Bulan {currentInstallment}/{loan.tenor}</span>
          </span>
        )}
      </div>

      {/* Progress Bar Tenor */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
          <span>Progres Angsuran</span>
          <span className="font-mono text-gray-300">
            {loan.tenor - loan.remainingMonths} dari {loan.tenor} bulan ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isCompleted
                ? "bg-emerald-400"
                : "bg-gradient-to-r from-orange-500 to-amber-400"
            }`}
          />
        </div>
      </div>

      {/* Breakdown Pokok & Bunga */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-charcoal-950/60 border border-white/[0.05]">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            Pokok / Bulan
          </span>
          <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
            {formatCurrency(loan.monthlyPrincipal)}
          </span>
          <span className="text-[9px] text-gray-500">Memulihkan limit</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            Bunga / Bulan
          </span>
          <span className="text-xs font-bold font-mono text-rose-400 mt-0.5">
            {formatCurrency(loan.monthlyInterest)}
          </span>
          <span className="text-[9px] text-gray-500">Biaya pengeluaran</span>
        </div>
      </div>

      {/* Meta Footer & Action */}
      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.06]">
        <div className="flex flex-col gap-0.5">
          {loan.disbursementAccount && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
              <span>Cair ke: {loan.disbursementAccount.name}</span>
            </span>
          )}
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Landmark className="w-3 h-3 text-cyan-400" />
            <span>Potong: {loan.sourceAccount.name}</span>
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span>Jatuh tempo tiap tgl {loan.dueDay}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showConfirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-[10px]"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Hapus pinjaman"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {!isCompleted && (
            loan.isPaidThisMonth ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bulan Ini Lunas</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handlePay}
                disabled={payLoanMutation.isPending}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-charcoal-950 text-xs font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
              >
                {payLoanMutation.isPending ? "Membayar..." : `Bayar ${formatCurrency(loan.monthlyTotal)}`}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
