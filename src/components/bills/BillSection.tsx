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
      <div className="flex flex-col gap-3">
        {/* Ringkasan Progres Tagihan Bulanan */}
        <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-charcoal-900/80 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
              <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Beban Tagihan Bulan Ini</span>
            </div>
            <span className="text-sm font-bold text-white font-mono">
              {formatCurrency(totalMonthlyBills)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${paidPercentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{paidCount} Lunas ({paidPercentage}%)</span>
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
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
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-zinc-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Belum Ada Tagihan Rutin
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Daftarkan langganan WiFi, listrik, Netflix, atau cicilan berkala.
                </p>
              </div>
              <button
                onClick={() => openBillForm(null)}
                className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-charcoal-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
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
