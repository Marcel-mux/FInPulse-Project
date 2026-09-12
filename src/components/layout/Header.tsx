"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart2,
  Bell,
  Download,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  WalletCards,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/store/useAppStore";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    setManageAccountsOpen,
    setManageCategoriesOpen,
    setExportModalOpen,
  } = useAppStore();

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FP";

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
    <header className="w-full flex items-center justify-between overflow-hidden border-b border-white/[0.06] bg-charcoal-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 pt-4 pb-3">
      {/* Brand & Greeting */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-indigo-500 flex items-center justify-center shadow-glow-emerald cursor-pointer shrink-0"
          >
            <Activity className="w-5 h-5 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1">
                FinPulse
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  PRO
                </span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate max-w-[110px] sm:max-w-none">
              {currentDate || "Memuat..."}
            </p>
          </div>
        </Link>

        {/* Navigation Tabs (Dashboard vs Analytics) */}
        <nav className="hidden sm:flex items-center ml-2 md:ml-4 p-1 rounded-2xl bg-charcoal-900 border border-white/[0.08]">
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
      <div className="flex items-center gap-1.5 sm:gap-2.5">
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

        {/* Mobile Dropdown Menu Button */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-charcoal-900/80 border border-white/[0.08] text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Menu Fitur"
            aria-label="Menu Fitur"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4 text-emerald-400" />
            ) : (
              <Menu className="w-4 h-4 text-gray-300" />
            )}
          </button>

          {/* Mobile Dropdown Popover */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="fixed right-4 top-16 z-50 w-56 p-2 rounded-2xl glass-card border border-white/15 shadow-2xl bg-charcoal-900/98 backdrop-blur-xl flex flex-col gap-1"
                >
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setManageAccountsOpen(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-gray-200 hover:text-white transition-colors w-full text-left"
                  >
                    <WalletCards className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Kelola Akun & Dompet</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setManageCategoriesOpen(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-gray-200 hover:text-white transition-colors w-full text-left"
                  >
                    <FolderTree className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Kategori Anggaran</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setExportModalOpen(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-gray-200 hover:text-emerald-400 transition-colors w-full text-left"
                  >
                    <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ekspor Laporan (PDF/Excel)</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Manage Accounts Button (Desktop / Tablet) */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setManageAccountsOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          title="Kelola Dompet & Rekonsiliasi"
        >
          <WalletCards className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Kelola Akun</span>
        </motion.button>

        {/* Manage Categories Button (Desktop / Tablet) */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setManageCategoriesOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          title="Kelola Kategori Anggaran"
        >
          <FolderTree className="w-4 h-4 text-indigo-400" />
          <span className="hidden md:inline">Kategori</span>
        </motion.button>

        {/* Export Reports Button (Desktop / Tablet) */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExportModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-emerald-500/30 text-xs font-semibold text-gray-300 hover:text-emerald-400 transition-all cursor-pointer"
          title="Ekspor Laporan (CSV, XLSX, PDF)"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Ekspor</span>
        </motion.button>

        <div className="h-5 w-[1px] bg-white/10 hidden sm:block mx-1" />

        {/* Notifications (Desktop / Tablet) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden sm:flex relative p-2.5 rounded-xl bg-charcoal-900/80 border border-white/[0.08] text-gray-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          aria-label="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-charcoal-950" />
        </motion.button>

        {/* User Profile & Logout Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-0.5 sm:pl-1">
          <div
            className="flex items-center gap-2"
            title={session?.user?.email || "Akun FinPulse"}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-[1px] cursor-default shrink-0"
            >
              <div className="w-full h-full rounded-[11px] bg-charcoal-900 flex items-center justify-center font-bold text-[11px] sm:text-xs text-indigo-300">
                {userInitials}
              </div>
            </motion.div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-200 truncate max-w-[110px]">
                {session?.user?.name || "Pengguna"}
              </span>
              <span className="text-[10px] text-gray-400 truncate max-w-[110px]">
                {session?.user?.email || ""}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 min-h-[36px] sm:min-h-[40px] rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 border border-crimson-500/20 hover:border-crimson-500/40 text-xs font-semibold text-crimson-400 hover:text-crimson-300 transition-all cursor-pointer"
            title="Keluar dari akun (Logout)"
            aria-label="Keluar dari akun"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
