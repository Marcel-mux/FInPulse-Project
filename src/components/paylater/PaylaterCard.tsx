"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, CreditCard } from "lucide-react";
import { Account } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface PaylaterCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onPayBill: (account: Account) => void;
}

export function PaylaterCard({ account, onEdit, onPayBill }: PaylaterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt physics values (identik dengan AccountCard)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 260, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 260, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const creditLimit = account.creditLimit ?? account.balance ?? 0;
  const availableLimit = Math.max(0, account.balance);
  const usedLimit = Math.max(0, creditLimit - availableLimit);
  const usagePercentage =
    creditLimit > 0
      ? Math.min(100, Math.round((usedLimit / creditLimit) * 100))
      : 0;

  // Status badge & bar color
  let statusBadge = {
    label: "Aman",
    colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    barColor: "from-emerald-500 to-teal-400",
  };

  if (usagePercentage >= 80) {
    statusBadge = {
      label: "Hampir Penuh",
      colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      barColor: "from-rose-500 to-red-400",
    };
  } else if (usagePercentage >= 40) {
    statusBadge = {
      label: "Terpakai Sedang",
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      barColor: "from-amber-500 to-yellow-400",
    };
  }

  // Provider theme accents
  const nameLower = account.name.toLowerCase();
  let themeConfig = {
    accentColor: "#f97316",
    gradient: "from-orange-600/20 via-orange-950/30 to-charcoal-900",
    border: "border-orange-500/30 group-hover:border-orange-400/50",
    glowClass: "shadow-[0_0_25px_-5px_rgba(249,115,22,0.3)]",
    iconBg: "bg-orange-500/20 text-orange-400",
  };

  if (nameLower.includes("gopay")) {
    themeConfig = {
      accentColor: "#10b981",
      gradient: "from-emerald-600/20 via-emerald-950/30 to-charcoal-900",
      border: "border-emerald-500/30 group-hover:border-emerald-400/50",
      glowClass: "shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]",
      iconBg: "bg-emerald-500/20 text-emerald-400",
    };
  } else if (nameLower.includes("kredivo")) {
    themeConfig = {
      accentColor: "#3b82f6",
      gradient: "from-blue-600/20 via-blue-950/30 to-charcoal-900",
      border: "border-blue-500/30 group-hover:border-blue-400/50",
      glowClass: "shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)]",
      iconBg: "bg-blue-500/20 text-blue-400",
    };
  } else if (nameLower.includes("akulaku")) {
    themeConfig = {
      accentColor: "#ef4444",
      gradient: "from-rose-600/20 via-red-950/30 to-charcoal-900",
      border: "border-rose-500/30 group-hover:border-rose-400/50",
      glowClass: "shadow-[0_0_25px_-5px_rgba(239,68,68,0.3)]",
      iconBg: "bg-rose-500/20 text-rose-400",
    };
  } else if (nameLower.includes("indodana") || nameLower.includes("atome")) {
    themeConfig = {
      accentColor: "#06b6d4",
      gradient: "from-cyan-600/20 via-cyan-950/30 to-charcoal-900",
      border: "border-cyan-500/30 group-hover:border-cyan-400/50",
      glowClass: "shadow-[0_0_25px_-5px_rgba(6,182,212,0.3)]",
      iconBg: "bg-cyan-500/20 text-cyan-400",
    };
  }

  return (
    <div
      style={{ perspective: 1000 }}
      className="min-w-[285px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 snap-start h-auto"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onEdit(account)}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative h-full rounded-2xl p-4 sm:p-5 cursor-pointer select-none transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between gap-3.5 overflow-hidden bg-gradient-to-br ${themeConfig.gradient} border ${themeConfig.border} ${themeConfig.glowClass}`}
      >
        {/* Dynamic Sheen overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-white/0 via-white/[0.07] to-white/0 pointer-events-none" />

        {/* 1. Card Header */}
        <div
          style={{ transform: "translateZ(25px)" }}
          className="flex items-start justify-between gap-2"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${themeConfig.iconBg}`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide leading-tight">
                {account.name}
              </h3>
              <span className="text-[11px] font-medium text-gray-400">
                Paylater / Kredit
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.colorClass}`}
            >
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* 2. Card Body: Sisa Limit (Big Font with AnimatedCounter) */}
        <div
          style={{ transform: "translateZ(35px)" }}
          className="flex flex-col gap-1"
        >
          <span className="text-xs text-gray-400 font-medium">
            Sisa Limit Aktif
          </span>
          <div className="text-2xl font-black text-emerald-400 tracking-tight flex items-baseline">
            <AnimatedCounter
              value={availableLimit}
              prefix="Rp "
              className="tabular-nums"
            />
          </div>
        </div>

        {/* 3. Progress Bar & Pemakaian Plafon */}
        <div
          style={{ transform: "translateZ(20px)" }}
          className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-charcoal-950/60 border border-white/[0.05]"
        >
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="text-gray-400">Penggunaan Plafon</span>
            <span className="text-gray-200 font-bold font-mono">
              {usagePercentage}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${statusBadge.barColor} transition-all duration-500`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-0.5">
            <span>Terpakai: {formatCurrency(usedLimit)}</span>
            <span>Total: {formatCurrency(creditLimit)}</span>
          </div>
        </div>

        {/* 4. Card Footer / Teks Interaksi & Tombol Cepat */}
        <div
          style={{ transform: "translateZ(15px)" }}
          className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-gray-400"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-medium">Aktif</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPayBill(account);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-[10px] font-bold text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Bayar</span>
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            </button>
            <span className="group-hover:text-white transition-colors text-[11px] font-medium">
              Ketuk untuk detail →
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
