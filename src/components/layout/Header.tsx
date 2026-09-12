"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart2,
  Bell,
  Bot,
  Download,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Receipt,
  WalletCards,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/store/useAppStore";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    setManageAccountsOpen,
    setManageCategoriesOpen,
    setExportModalOpen,
    setWhatsAppModalOpen,
    openBudgetForm,
    setTransactionModalOpen,
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
    setMounted(true);
    const now = new Date();
    const formatted = now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    setCurrentDate(formatted);
  }, []);

  // Lock body scroll saat mobile drawer terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isAnalytics = pathname === "/analytics";

  return (
    <>
      <header className="w-full border-b border-white/[0.06] bg-charcoal-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3 flex items-center justify-between">
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
          {/* Mobile Grid / Dashboard Direct Link (Ikon 4 kotak kecil) */}
          <Link
            href="/"
            className="sm:hidden p-2 rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center cursor-pointer"
            title="Ke Dashboard Utama"
            aria-label="Dashboard Utama"
          >
            <LayoutDashboard className="w-4 h-4" />
          </Link>

          {/* Mobile Hamburger Menu Toggle Button (☰) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Buka Menu Navigasi"
            aria-label="Buka Menu Navigasi"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-emerald-400" />
            ) : (
              <Menu className="w-4 h-4 text-gray-300" />
            )}
          </button>

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

          {/* WhatsApp AI Bot Button (Desktop / Tablet) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setWhatsAppModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl bg-charcoal-900/80 hover:bg-charcoal-900 border border-white/[0.08] hover:border-emerald-500/30 text-xs font-semibold text-gray-300 hover:text-emerald-400 transition-all cursor-pointer"
            title="Bot WhatsApp AI (Catat Otomatis via WA)"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Bot WA</span>
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

            {/* Logout Button (Desktop / Tablet) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden sm:flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 min-h-[36px] sm:min-h-[40px] rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 border border-crimson-500/20 hover:border-crimson-500/40 text-xs font-semibold text-crimson-400 hover:text-crimson-300 transition-all cursor-pointer"
              title="Keluar dari akun (Logout)"
              aria-label="Keluar dari akun"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </motion.button>
          </div>
        </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Mounted to Body (Immune to Parent Clip / Stacking) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop Overlay with Blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
                  aria-label="Tutup Menu"
                />

                {/* Mobile Drawer Panel (Slide-in from Right) */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  className="relative w-80 max-w-[85vw] h-full bg-charcoal-900 border-l border-white/10 z-50 p-5 sm:p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
                >
                  {/* Top Drawer Content */}
                  <div>
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-indigo-500 flex items-center justify-center shadow-glow-emerald">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                            FinPulse
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                              PRO
                            </span>
                          </h2>
                          <p className="text-[10px] text-gray-400 font-medium">
                            Navigasi Finansial
                          </p>
                        </div>
                      </div>

                      {/* Close Button (X) */}
                      <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors cursor-pointer"
                        aria-label="Tutup Menu"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Navigation Menu List */}
                    <nav className="flex flex-col gap-1.5 mt-5">
                      {/* Dashboard Utama */}
                      <Link
                        href="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                          !isAnalytics
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald"
                            : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Dashboard Utama</span>
                      </Link>

                      {/* Analitik & Laporan */}
                      <Link
                        href="/analytics"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                          isAnalytics
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald"
                            : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <BarChart2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Analitik & Laporan</span>
                      </Link>

                      {/* Kelola Akun / Dompet */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setManageAccountsOpen(true);
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all w-full text-left cursor-pointer"
                      >
                        <WalletCards className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Kelola Akun / Dompet</span>
                      </button>

                      {/* Anggaran (Budgets) */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (pathname === "/") {
                            document
                              .getElementById("budget-section")
                              ?.scrollIntoView({ behavior: "smooth" });
                          } else {
                            openBudgetForm(null);
                          }
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all w-full text-left cursor-pointer"
                      >
                        <PieChart className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Anggaran (Budgets)</span>
                      </button>

                      {/* Kategori Anggaran */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setManageCategoriesOpen(true);
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all w-full text-left cursor-pointer"
                      >
                        <FolderTree className="w-4 h-4 text-violet-400 shrink-0" />
                        <span>Kategori Anggaran</span>
                      </button>

                      {/* Riwayat Transaksi */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (pathname === "/") {
                            document
                              .getElementById("recent-activity")
                              ?.scrollIntoView({ behavior: "smooth" });
                          } else {
                            setTransactionModalOpen(true, "expense");
                          }
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all w-full text-left cursor-pointer"
                      >
                        <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Riwayat Transaksi</span>
                      </button>

                      {/* Ekspor Laporan */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setExportModalOpen(true);
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:bg-white/[0.05] hover:text-emerald-400 transition-all w-full text-left cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Ekspor Data (PDF/Excel)</span>
                      </button>

                      {/* Bot WhatsApp AI */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setWhatsAppModalOpen(true);
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:bg-white/[0.05] hover:text-emerald-400 transition-all w-full text-left cursor-pointer"
                      >
                        <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Bot WhatsApp AI</span>
                      </button>
                    </nav>
                  </div>

                  {/* Drawer Footer: User Profile & Logout Button */}
                  <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-[1px] shrink-0">
                        <div className="w-full h-full rounded-[11px] bg-charcoal-900 flex items-center justify-center font-bold text-xs text-indigo-300">
                          {userInitials}
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {session?.user?.name || "Pengguna FinPulse"}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate">
                          {session?.user?.email || ""}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut({ callbackUrl: "/login" });
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 border border-crimson-500/20 text-xs font-bold text-crimson-400 hover:text-crimson-300 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
