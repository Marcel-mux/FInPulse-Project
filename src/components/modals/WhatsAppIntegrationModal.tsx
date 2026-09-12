"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Copy,
  Info,
  Link2,
  MessageSquare,
  Phone,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";

export function WhatsAppIntegrationModal() {
  const { isWhatsAppModalOpen, setWhatsAppModalOpen } = useAppStore();

  const [currentPhone, setCurrentPhone] = useState<string | null>(null);
  const [inputPhone, setInputPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch current phone when modal opens
  useEffect(() => {
    if (!isWhatsAppModalOpen) {
      setFeedback(null);
      return;
    }

    let isMounted = true;
    setIsFetching(true);

    fetch("/api/user/whatsapp")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.whatsappNumber) {
          setCurrentPhone(data.whatsappNumber);
          setInputPhone(data.whatsappNumber);
        } else {
          setCurrentPhone(null);
          setInputPhone("");
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil info nomor WA:", err);
      })
      .finally(() => {
        if (isMounted) setIsFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isWhatsAppModalOpen]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: inputPhone.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan nomor WhatsApp");
      }

      setCurrentPhone(data.whatsappNumber);
      setInputPhone(data.whatsappNumber || "");
      setFeedback({
        type: "success",
        text: data.message || "Nomor WhatsApp berhasil ditautkan!",
      });

      if (data.whatsappNumber) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan jaringan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Apakah Anda yakin ingin mencabut tautan nomor WhatsApp ini?")) {
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: "" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencabut tautan");

      setCurrentPhone(null);
      setInputPhone("");
      setFeedback({
        type: "success",
        text: "Tautan nomor WhatsApp berhasil dicabut.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal mencabut nomor WhatsApp",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/whatsapp`
      : "https://f-in-pulse-project.vercel.app/api/webhook/whatsapp";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isWhatsAppModalOpen}
      onClose={() => setWhatsAppModalOpen(false)}
      title="Bot WhatsApp AI FinPulse"
      description="Catat pengeluaran, pemasukan, dan transfer otomatis via pesan teks WhatsApp"
    >
      <div className="space-y-5">
        {/* Banner Fitur AI */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-indigo-500/10 border border-emerald-500/20 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1 text-gray-300">
            <p className="font-semibold text-white flex items-center gap-1.5">
              Didukung Model Gemini 2.5 Flash
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] text-emerald-400 font-bold border border-emerald-500/30">
                AI
              </span>
            </p>
            <p className="text-gray-400 leading-relaxed">
              Kirimkan pesan santai dalam Bahasa Indonesia ke WhatsApp bot. AI akan
              mendeteksi tipe, nominal, nama dompet, dan kategori secara otomatis!
            </p>
          </div>
        </div>

        {/* Status Penautan Nomor */}
        <div className="p-4 rounded-2xl bg-charcoal-900 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Nomor WhatsApp Anda
            </h3>
            {currentPhone ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Terhubung
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Belum Ditautkan
              </span>
            )}
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-crimson-500/10 text-crimson-300 border border-crimson-500/20"
              }`}
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSavePhone} className="space-y-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-medium">
                Nomor Handphone (Awali dengan 08 atau 628):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  disabled={isLoading || isFetching}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Sistem akan mengenali pengirim pesan dari nomor ini untuk mencatat ke akun Anda.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isLoading || isFetching || !inputPhone.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-glow-emerald disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{isLoading ? "Menyimpan..." : currentPhone ? "Perbarui Nomor" : "Tautkan Nomor"}</span>
              </button>

              {currentPhone && (
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 border border-crimson-500/20 text-crimson-400 hover:text-crimson-300 transition-all cursor-pointer"
                  title="Cabut tautan nomor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Contoh Format Pesan */}
        <div className="p-4 rounded-2xl bg-charcoal-900 border border-white/[0.08] space-y-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            Contoh Pesan yang Bisa Dicatat:
          </h3>
          <ul className="text-xs text-gray-300 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <div>
                <span className="font-semibold text-white">&quot;Makan siang 25rb pakai Kas&quot;</span>
                <p className="text-[10px] text-gray-400">Pengeluaran Makanan & Minuman dari dompet Kas</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <div>
                <span className="font-semibold text-white">&quot;Beli bensin 35k lewat BCA&quot;</span>
                <p className="text-[10px] text-gray-400">Pengeluaran Transportasi dari rekening BCA</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <div>
                <span className="font-semibold text-white">&quot;Gaji freelance 1.5jt masuk Jago&quot;</span>
                <p className="text-[10px] text-gray-400">Pemasukan Freelance ke rekening Bank Jago</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <div>
                <span className="font-semibold text-white">&quot;Transfer 100rb dari BCA ke ShopeePay&quot;</span>
                <p className="text-[10px] text-gray-400">Mutasi saldo otomatis antar dompet</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Info Webhook URL untuk Gateway */}
        <div className="p-4 rounded-2xl bg-charcoal-900/50 border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Webhook Gateway URL (Fonnte / Wablas):
            </span>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? "Tersalin!" : "Salin URL"}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-charcoal-950 border border-white/[0.06] text-[11px] font-mono text-gray-300 break-all select-all">
            {webhookUrl}
          </div>
          <p className="text-[10px] text-gray-500">
            Gunakan URL di atas pada pengaturan Webhook Gateway WhatsApp (metode POST).
          </p>
        </div>
      </div>
    </Modal>
  );
}
