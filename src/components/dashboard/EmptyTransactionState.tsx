"use client";

import { motion } from "framer-motion";
import { ArrowRight, ReceiptText, Sparkles } from "lucide-react";

interface EmptyTransactionStateProps {
  onAddTransaction?: () => void;
}

export function EmptyTransactionState({
  onAddTransaction,
}: EmptyTransactionStateProps) {
  return (
    <div className="w-full py-12 px-6 rounded-3xl glass-card border border-white/[0.06] flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Background glow blur */}
      <div className="absolute w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Floating subtle looping icon animation */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 2, -2, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mb-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-charcoal-850 to-charcoal-800 border border-white/10 flex items-center justify-center shadow-glow-indigo text-indigo-400">
          <ReceiptText className="w-8 h-8" />
        </div>

        {/* Small floating sparkles badge */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </motion.div>
      </motion.div>

      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight max-w-sm">
        Belum ada transaksi tercatat. Mulai catat keuangan Anda!
      </h3>
      <p className="text-xs sm:text-sm text-gray-400 max-w-sm mt-1.5 mb-6">
        Catat pengeluaran, pemasukan, atau transfer pertamamu untuk mulai
        memantau arus kas dan aset secara cerdas.
      </p>

      {onAddTransaction && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAddTransaction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-charcoal-950 font-bold text-xs shadow-glow-emerald hover:brightness-110 transition-all cursor-pointer"
        >
          <span>Catat Transaksi Baru</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </div>
  );
}
