"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function QuickActionFloatingBar() {
  const { setTransactionModalOpen } = useAppStore();

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-auto px-2">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-full glass-card border border-white/15 shadow-glass backdrop-blur-xl bg-charcoal-900/90"
      >
        {/* Pemasukan Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setTransactionModalOpen(true, "income")}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs shadow-glow-emerald transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="tracking-tight">Pemasukan</span>
        </motion.button>

        {/* Pengeluaran Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setTransactionModalOpen(true, "expense")}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-crimson-500/15 hover:bg-crimson-500/25 border border-crimson-500/30 text-crimson-400 font-bold text-xs shadow-glow-crimson transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-crimson-500/20 flex items-center justify-center">
            <ArrowUpRight className="w-3.5 h-3.5 text-crimson-400" />
          </div>
          <span className="tracking-tight">Pengeluaran</span>
        </motion.button>

        {/* Transfer Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setTransactionModalOpen(true, "transfer")}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold text-xs shadow-glow-indigo transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-300" />
          </div>
          <span className="tracking-tight">Transfer</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
