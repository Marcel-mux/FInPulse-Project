"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart2,
  Bell,
  Download,
  FolderTree,
  LayoutDashboard,
  WalletCards,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function Header() {
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState<string>("");
  const {
    setManageAccountsOpen,
    setManageCategoriesOpen,
    setExportModalOpen,
  } = useAppStore();

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

  const isAnalytics = pathname === "/analytics";

  return (
    <header className="w-full pt-4 pb-3 px-4 sm:px-8 flex items-center justify-between border-b border-white/[0.06] bg-charcoal-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Brand & Greeting */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
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
        </Link>

        {/* Navigation Tabs (Dashboard vs Analytics) */}
        <nav className="hidden sm:flex items-center ml-4 p-1 rounded-2xl bg-charcoal-900 border border-white/[0.08]">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !isAnalytics
                ? "bg-emerald-500 text-charcoal-950 shadow-glow-emerald"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/analytics"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isAnalytics
                ? "bg-emerald-500 text-charcoal-950 shadow-glow-emerald"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analitik</span>
          </Link>
        </nav>
      </div>

      {/* Navigation & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Analytics Icon link */}
        <Link
          href={isAnalytics ? "/" : "/analytics"}
          className="sm:hidden p-2 rounded-xl bg-charcoal-900/80 border border-white/[0.08] text-gray-300 hover:text-white"
          title={isAnalytics ? "Ke Dashboard" : "Ke Analitik"}
        >
          {isAnalytics ? (
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
          ) : (
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          )}
        </Link>

        {/* Manage Accounts Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setManageAccountsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          title="Kelola Dompet & Rekonsiliasi"
        >
          <WalletCards className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Kelola Akun</span>
        </motion.button>

        {/* Manage Categories Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setManageCategoriesOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          title="Kelola Kategori Anggaran"
        >
          <FolderTree className="w-4 h-4 text-indigo-400" />
          <span className="hidden md:inline">Kategori</span>
        </motion.button>

        {/* Export Reports Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-emerald-500/30 text-xs font-semibold text-gray-300 hover:text-emerald-400 transition-all cursor-pointer"
          title="Ekspor Laporan (CSV, XLSX, PDF)"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Ekspor</span>
        </motion.button>

        <div className="h-5 w-[1px] bg-white/10 hidden sm:block mx-1" />

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 rounded-xl bg-charcoal-900/80 border border-white/[0.08] text-gray-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          aria-label="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-charcoal-950" />
        </motion.button>

        {/* User Avatar */}
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
