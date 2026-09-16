"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Bot,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useResetAllData } from "@/hooks/useFinance";

export function SettingsModal() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isSettingsOpen, setSettingsOpen, setWhatsAppModalOpen } = useAppStore();
  const resetAllDataMutation = useResetAllData();

  // State untuk modal konfirmasi reset
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [scope, setScope] = useState<"DAILY" | "MONTHLY" | "ALL">("DAILY");

  // Default tanggal hari ini (YYYY-MM-DD) dan bulan ini (YYYY-MM)
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [confirmationText, setConfirmationText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isConfirmed = confirmationText.trim().toLowerCase() === "reset";

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FP";

  const handleClose = () => {
    if (resetAllDataMutation.isPending) return;
    setIsConfirmOpen(false);
    setConfirmationText("");
    setErrorMessage(null);
    setSettingsOpen(false);
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || resetAllDataMutation.isPending) return;

    setErrorMessage(null);

    try {
      const res = await resetAllDataMutation.mutateAsync({
        confirmation: "reset",
        scope,
        date: selectedDate,
        monthYear: selectedMonth,
      });

      setSuccessMessage(
        res.message || "Seluruh data yang dipilih berhasil direset."
      );
      setIsConfirmOpen(false);
      setConfirmationText("");

      // Refresh data server & UI
      router.refresh();

      // Auto dismiss success toast after 5s
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal mereset data. Silakan coba lagi."
      );
    }
  };

  return (
    <>
      <Modal
        isOpen={isSettingsOpen}
        onClose={handleClose}
        title="Pengaturan & Profil"
        description="Kelola akun dan pengaturan preferensi data FinPulse"
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col gap-5 text-sm">
          {/* Toast Notifikasi Sukses */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-glow-emerald"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold leading-relaxed">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-charcoal-900/90 border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 p-[1px] shrink-0">
                <div className="w-full h-full rounded-[15px] bg-charcoal-950 flex items-center justify-center font-bold text-sm text-indigo-300">
                  {userInitials}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">
                    {session?.user?.name || "Pengguna FinPulse"}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.email || "-"}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] text-gray-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Terproteksi</span>
            </div>
          </div>

          {/* Quick Integration / WhatsApp Bot Shortcut */}
          <div className="p-3.5 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-200">
                  Integrasi WhatsApp Bot
                </span>
                <span className="text-[11px] text-gray-400">
                  Catat mutasi keuangan otomatis via pesan chat WA
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                setWhatsAppModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-xs font-semibold transition-all shrink-0 cursor-pointer"
            >
              Atur
            </button>
          </div>

          {/* Section Danger Zone */}
          <div className="rounded-2xl border border-crimson-500/30 bg-crimson-500/5 p-4 sm:p-5 flex flex-col gap-3 relative overflow-hidden">
            {/* Ambient Red Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-crimson-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-crimson-500/20 border border-crimson-500/30 text-crimson-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-crimson-300">
                    Zona Berbahaya (Danger Zone)
                  </h3>
                </div>
                <p className="text-xs text-gray-300 font-medium leading-relaxed">
                  Reset Data Keuangan Berdasarkan Cakupan
                </p>
                <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                  Mendukung reset transaksi harian, bulanan, atau total reset seluruh catatan keuangan dengan proteksi konfirmasi ketik &apos;reset&apos;.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmOpen(true);
                  setConfirmationText("");
                  setErrorMessage(null);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-crimson-500/20 hover:bg-crimson-500/30 border border-crimson-500/40 text-crimson-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data Keuangan</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Sub-Modal Konfirmasi Proteksi (Ketik "reset") */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-charcoal-900 border border-crimson-500/30 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-crimson-500/20 border border-crimson-500/30 text-crimson-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Hapus Riwayat & Reset Saldo?
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Pilih cakupan reset dan konfirmasi tindakan
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!resetAllDataMutation.isPending) {
                      setIsConfirmOpen(false);
                      setConfirmationText("");
                    }
                  }}
                  disabled={resetAllDataMutation.isPending}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scope Selector: 3 Pilihan Cakupan Reset */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-semibold text-gray-300">
                  Pilih Cakupan (Scope) Reset:
                </label>

                {/* Option 1: Hari Ini / Hari Tertentu */}
                <div
                  onClick={() => setScope("DAILY")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    scope === "DAILY"
                      ? "bg-amber-500/10 border-amber-500/40 text-white"
                      : "bg-charcoal-950/60 border-white/[0.08] text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="resetScope"
                      checked={scope === "DAILY"}
                      onChange={() => setScope("DAILY")}
                      className="mt-1 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-white">
                          Hari Ini / Hari Tertentu (Harian)
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Mereset total seluruh aktivitas (transaksi, pinjaman baru, tagihan baru/eksekusi) pada tanggal yang dipilih serta memulihkan saldo rekening dan limit paylater.
                      </p>

                      {scope === "DAILY" && (
                        <div
                          className="mt-2.5 pt-2.5 border-t border-white/[0.08] flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="text-[11px] text-gray-300 font-medium">
                            Pilih Tanggal:
                          </label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option 2: Bulan Ini / Bulan Tertentu */}
                <div
                  onClick={() => setScope("MONTHLY")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    scope === "MONTHLY"
                      ? "bg-indigo-500/10 border-indigo-500/40 text-white"
                      : "bg-charcoal-950/60 border-white/[0.08] text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="resetScope"
                      checked={scope === "MONTHLY"}
                      onChange={() => setScope("MONTHLY")}
                      className="mt-1 accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CalendarRange className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold text-white">
                          Bulan Ini / Bulan Tertentu (Bulanan)
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Menghapus seluruh transaksi dan anggaran pada bulan yang dipilih serta memulihkan saldo rekening.
                      </p>

                      {scope === "MONTHLY" && (
                        <div
                          className="mt-2.5 pt-2.5 border-t border-white/[0.08] flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="text-[11px] text-gray-300 font-medium">
                            Pilih Bulan:
                          </label>
                          <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-indigo-500/30 text-white text-xs focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option 3: Reset Semua (Total Reset) */}
                <div
                  onClick={() => setScope("ALL")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    scope === "ALL"
                      ? "bg-crimson-500/15 border-crimson-500/50 text-white"
                      : "bg-charcoal-950/60 border-white/[0.08] text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="resetScope"
                      checked={scope === "ALL"}
                      onChange={() => setScope("ALL")}
                      className="mt-1 accent-crimson-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5 text-crimson-400" />
                          <span className="text-xs font-bold text-white">
                            Reset Semua (Total Reset)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crimson-500/20 text-crimson-400 border border-crimson-500/30">
                          Menghapus seluruh riwayat, pinjaman, tagihan & mengosongkan saldo
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Mengosongkan saldo seluruh akun kas/bank ke Rp 0, memulihkan limit Paylater ke plafon awal, serta menghapus seluruh transaksi, tagihan, cicilan, dan anggaran.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Notice Box */}
              <div className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/25 flex items-start gap-2.5 text-xs text-crimson-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-crimson-400" />
                <p className="leading-relaxed">
                  <strong className="font-semibold">Peringatan:</strong>{" "}
                  {scope === "ALL" &&
                    "Tindakan ini tidak dapat dibatalkan. Semua transaksi, saldo rekening, tagihan, dan pinjaman Anda akan dikosongkan."}
                  {scope === "DAILY" &&
                    `Seluruh aktivitas (transaksi, pinjaman baru, dan status eksekusi tagihan) pada tanggal ${selectedDate} akan direset total serta dampaknya pada saldo rekening/paylater akan dipulihkan.`}
                  {scope === "MONTHLY" &&
                    `Seluruh transaksi dan anggaran pada bulan ${selectedMonth} akan dihapus dan dampaknya pada saldo rekening/paylater akan dibatalkan/dipulihkan.`}
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Input Konfirmasi */}
              <form onSubmit={handleExecuteReset} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Ketik kata <span className="font-mono text-crimson-400 uppercase font-bold tracking-wider">&apos;reset&apos;</span> untuk mengonfirmasi:
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Ketik 'reset' untuk melanjutkan"
                    disabled={resetAllDataMutation.isPending}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 focus:border-crimson-500/60 focus:ring-1 focus:ring-crimson-500/40 text-white placeholder:text-gray-500 text-xs sm:text-sm font-mono transition-all outline-none"
                  />
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmOpen(false);
                      setConfirmationText("");
                    }}
                    disabled={resetAllDataMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={!isConfirmed || resetAllDataMutation.isPending}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold transition-all shadow-lg shadow-crimson-600/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {resetAllDataMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sedang Mereset Data...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Jalankan Reset</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
