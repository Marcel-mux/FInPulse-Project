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
import { useDeleteLoan } from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";

interface LoanCardProps {
  loan: LoanWithRelations;
}

export function LoanCard({ loan }: LoanCardProps) {
  const { openPayLoanModal } = useAppStore();
  const deleteLoanMutation = useDeleteLoan();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isCompleted = loan.status === "COMPLETED" || loan.remainingMonths <= 0;
  const currentInstallment = loan.tenor - loan.remainingMonths + 1;
  const progressPercent = Math.min(
    100,
    Math.round(((loan.tenor - loan.remainingMonths) / loan.tenor) * 100)
  );

  const handleDelete = async () => {
    try {
      await deleteLoanMutation.mutateAsync(loan.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between gap-3.5 shadow-sm group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] text-zinc-300 border border-white/[0.08] flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">
              {loan.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400">
              <span className="font-medium text-zinc-300">
                {loan.paylaterAccount.name}
              </span>
              <span>•</span>
              <span>Tenor {loan.tenor} bln</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Lunas</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Clock className="w-3 h-3" />
            <span>Bulan {currentInstallment}/{loan.tenor}</span>
          </span>
        )}
      </div>

      {/* Monthly Installment Headline */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-zinc-400 font-medium">
          Cicilan per Bulan
        </span>
        <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
          {formatCurrency(loan.monthlyTotal)}
        </div>
      </div>

      {/* Progress Bar Tenor */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
          <span>Progres Angsuran</span>
          <span className="font-mono text-zinc-300">
            {loan.tenor - loan.remainingMonths} dari {loan.tenor} bln ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isCompleted ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
        </div>
      </div>

      {/* Breakdown Pokok & Bunga (Subtle text row, no heavy nested card) */}
      <div className="flex items-center justify-between text-xs py-2 border-t border-b border-white/[0.05]">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-400">Pokok (Pulihkan Limit)</span>
          <span className="text-xs font-bold font-mono text-emerald-400">
            {formatCurrency(loan.monthlyPrincipal)}
          </span>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-[10px] text-zinc-400">Bunga / Biaya</span>
          <span className="text-xs font-bold font-mono text-rose-400">
            {formatCurrency(loan.monthlyInterest)}
          </span>
        </div>
      </div>

      {/* Meta Footer & Action */}
      <div className="flex items-center justify-between text-[11px] pt-1">
        <div className="flex flex-col gap-0.5">
          {loan.disbursementAccount && (
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
              <span>Cair: {loan.disbursementAccount.name}</span>
            </span>
          )}
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Landmark className="w-3 h-3 text-zinc-500" />
            <span>Sumber: {loan.sourceAccount.name}</span>
          </span>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-500" />
            <span>Jatuh tempo tiap tgl {loan.dueDay}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showConfirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-white/10 text-zinc-300 text-[11px] cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Hapus pinjaman"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {!isCompleted && (
            loan.isPaidThisMonth ? (
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bulan Ini Lunas</span>
                </span>
                <button
                  type="button"
                  onClick={() => openPayLoanModal(loan)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
                  title="Bayar cicilan berikutnya lebih awal"
                >
                  Lunasi
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openPayLoanModal(loan)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 text-xs font-bold transition-all cursor-pointer"
              >
                Bayar Tagihan
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
