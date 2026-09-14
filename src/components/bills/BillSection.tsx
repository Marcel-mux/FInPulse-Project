"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Plus,
  Receipt,
} from "lucide-react";
import { useBills } from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";
import { BillCard } from "./BillCard";
import { formatCurrency } from "@/lib/formatters";

export function BillSection() {
  const { data, isLoading } = useBills();
  const { openBillForm } = useAppStore();

  const bills = data?.bills || [];
  const totalMonthlyBills = data?.totalMonthlyBills || 0;
  const paidCount = data?.paidCount || 0;
  const upcomingCount = data?.upcomingCount || 0;
  const totalPaidAmount = data?.totalPaidAmount || 0;

  const paidPercentage =
    totalMonthlyBills > 0
      ? Math.min(100, Math.round((totalPaidAmount / totalMonthlyBills) * 100))
      : 0;

  return (
    <section className="w-full flex flex-col gap-3">
      {/* Header Section */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Tagihan & Autodebet ({bills.length})
          </h2>
        </div>
        <button
          onClick={() => openBillForm(null)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tagihan</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-5 rounded-2xl glass-surface border border-white/[0.08] flex flex-col gap-4">
        {/* Ringkasan Progres Tagihan Bulanan */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-charcoal-900/60 border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
              <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Beban Tagihan Bulan Ini</span>
            </div>
            <span className="text-sm font-black text-white font-mono">
              {formatCurrency(totalMonthlyBills)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${paidPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{paidCount} Lunas ({paidPercentage}%)</span>
            </span>
            <span className="flex items-center gap-1 text-gray-300">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{upcomingCount} Menunggu</span>
            </span>
          </div>
        </div>

        {/* Daftar Tagihan */}
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full h-24 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse"
              />
            ))
          ) : bills.length === 0 ? (
            <div className="py-8 px-4 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-gray-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300">
                  Belum ada tagihan berulang
                </p>
                <p className="text-[11px] text-gray-500 max-w-xs mt-0.5">
                  Catat tagihan listrik, internet, Paylater, atau langganan streaming agar autodebet bekerja otomatis.
                </p>
              </div>
              <button
                onClick={() => openBillForm(null)}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Tagihan Pertama</span>
              </button>
            </div>
          ) : (
            bills.map((bill) => <BillCard key={bill.id} bill={bill} />)
          )}
        </div>
      </div>
    </section>
  );
}
