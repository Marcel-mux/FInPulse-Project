"use client";

import { motion } from "framer-motion";
import { Activity, Bell } from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    setCurrentDate(formatted);
  }, []);

  return (
    <header className="w-full pt-4 pb-2 px-4 sm:px-8 flex items-center justify-between border-b border-white/[0.06] bg-charcoal-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Brand & Greeting */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-indigo-500 flex items-center justify-center shadow-glow-emerald cursor-pointer"
        >
          <Activity className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              FinPulse
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                PRO
              </span>
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            {currentDate || "Memuat tanggal..."}
          </p>
        </div>
      </div>

      {/* Right Controls & Status */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal-900 border border-white/[0.08] text-xs text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow-emerald" />
          <span>Real-time Sync</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 rounded-xl bg-charcoal-900/80 border border-white/[0.08] text-gray-300 hover:text-white hover:border-white/20 transition-all"
          aria-label="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-charcoal-950" />
        </motion.button>

        {/* Avatar Profil Placeholder */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-[1px] cursor-pointer"
        >
          <div className="w-full h-full rounded-[11px] bg-charcoal-900 flex items-center justify-center font-bold text-xs text-indigo-300">
            FP
          </div>
        </motion.div>
      </div>
    </header>
  );
}
