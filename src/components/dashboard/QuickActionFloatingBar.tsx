"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function QuickActionFloatingBar() {
  const { setTransactionModalOpen } = useAppStore();

  return (
    <div className="no-print fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-40 w-auto px-2 max-w-[calc(100vw-1rem)]">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-charcoal-900/95 border border-white/10 shadow-elevated backdrop-blur-md"
      >
        {/* Pemasukan Button (Touch target >= 44px) */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setTransactionModalOpen(true, "income")}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[44px] rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-semibold text-xs transition-colors cursor-pointer select-none"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="tracking-tight">Pemasukan</span>
        </motion.button>

        {/* Pengeluaran Button (Touch target >= 44px) */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setTransactionModalOpen(true, "expense")}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[44px] rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-semibold text-xs transition-colors cursor-pointer select-none"
        >
          <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="tracking-tight">Pengeluaran</span>
        </motion.button>

        {/* Transfer Button (Touch target >= 44px) */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setTransactionModalOpen(true, "transfer")}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[44px] rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-gray-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer select-none"
        >
          <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
            <ArrowLeftRight className="w-3.5 h-3.5 text-gray-300" />
          </div>
          <span className="tracking-tight">Transfer</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
