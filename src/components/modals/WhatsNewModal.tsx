"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppRelease, useAcknowledgeRelease } from "@/hooks/useFinance";
import {
  Sparkles,
  Rocket,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from "lucide-react";

export function WhatsNewModal() {
  const { data, isLoading } = useAppRelease();
  const acknowledgeMutation = useAcknowledgeRelease();
  const [isDismissed, setIsDismissed] = useState(false);

  const release = data?.release;
  const isOpen = Boolean(!isLoading && data?.shouldShow && release && !isDismissed);

  if (!isOpen || !release) {
    return null;
  }

  const handleAcknowledge = async () => {
    setIsDismissed(true);
    try {
      await acknowledgeMutation.mutateAsync(release.version);
    } catch (err) {
      console.error("Gagal memperbarui lastSeenVersion:", err);
    }
  };

  const formattedDate = release.releasedAt
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(release.releasedAt))
    : null;

  // Render teks notes dengan formatting poin-poin yang rapi
  const noteLines = release.notes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleAcknowledge}
      maxWidth="max-w-lg"
    >
      <div className="relative overflow-hidden p-6">
        {/* Ambient Glow Gradient Background */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative flex items-center gap-3.5 pb-4 border-b border-white/10">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Rocket className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {release.version}
              </span>
              {formattedDate && (
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  {formattedDate}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mt-1">
              Apa yang Baru di FinPulse?
            </h3>
          </div>
        </div>

        {/* Release Title Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-zinc-800/60 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rilis Pembaruan Sistem</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {release.title}
          </p>
        </div>

        {/* Release Notes List */}
        <div className="mt-4 max-h-60 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
          {noteLines.map((line, idx) => {
            // Cek apakah format heading atau poin
            const isBullet = line.startsWith("-") || line.startsWith("•") || line.startsWith("*");
            const cleanText = isBullet
              ? line.replace(/^[-•*]\s*/, "")
              : line;

            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  {cleanText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end">
          <button
            onClick={handleAcknowledge}
            disabled={acknowledgeMutation.isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {acknowledgeMutation.isPending ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <span>Saya Mengerti</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
