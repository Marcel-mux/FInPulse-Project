"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Banknote,
  CreditCard,
  Landmark,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRef } from "react";
import { Account, AccountType } from "@/types";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface AccountCardProps {
  account: Account;
  isSelected?: boolean;
  onSelect?: (accountId: string) => void;
}

const TYPE_CONFIG: Record<
  AccountType,
  {
    label: string;
    icon: typeof Landmark;
    gradient: string;
    border: string;
    glowClass: string;
    accentColor: string;
  }
> = {
  bank: {
    label: "Bank Account",
    icon: Landmark,
    gradient: "from-blue-600/20 via-indigo-900/30 to-charcoal-900",
    border: "border-blue-500/30 group-hover:border-blue-400/50",
    glowClass: "shadow-glow-indigo",
    accentColor: "#3B82F6",
  },
  cash: {
    label: "Kas Tunai",
    icon: Banknote,
    gradient: "from-emerald-600/20 via-emerald-950/40 to-charcoal-900",
    border: "border-emerald-500/30 group-hover:border-emerald-400/50",
    glowClass: "shadow-glow-emerald",
    accentColor: "#10B981",
  },
  ewallet: {
    label: "E-Wallet",
    icon: Wallet,
    gradient: "from-cyan-600/20 via-sky-950/40 to-charcoal-900",
    border: "border-cyan-500/30 group-hover:border-cyan-400/50",
    glowClass: "shadow-[0_0_25px_-5px_rgba(6,182,212,0.35)]",
    accentColor: "#06B6D4",
  },
  investment: {
    label: "Investasi",
    icon: TrendingUp,
    gradient: "from-violet-600/20 via-purple-950/40 to-charcoal-900",
    border: "border-violet-500/30 group-hover:border-violet-400/50",
    glowClass: "shadow-glow-violet",
    accentColor: "#8B5CF6",
  },
  credit: {
    label: "Kredit / PayLater",
    icon: CreditCard,
    gradient: "from-rose-600/20 via-red-950/40 to-charcoal-900",
    border: "border-rose-500/30 group-hover:border-rose-400/50",
    glowClass: "shadow-glow-crimson",
    accentColor: "#EF4444",
  },
};

export function AccountCard({
  account,
  isSelected = false,
  onSelect,
}: AccountCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt physics values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 260, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 260, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

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

  const config = TYPE_CONFIG[account.type] || TYPE_CONFIG.bank;
  const IconComponent = config.icon;

  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onSelect?.(account.id)}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative w-72 sm:w-80 h-44 rounded-2xl p-5 cursor-pointer select-none transition-shadow duration-300 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${config.gradient} border ${config.border} ${config.glowClass} ${
          isSelected ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-charcoal-950" : ""
        }`}
      >
        {/* Dynamic Sheen overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-white/0 via-white/[0.07] to-white/0 pointer-events-none" />

        {/* Card Header */}
        <div
          style={{ transform: "translateZ(25px)" }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
              style={{
                backgroundColor: account.colorHex
                  ? `${account.colorHex}25`
                  : `${config.accentColor}25`,
                color: account.colorHex || config.accentColor,
              }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {account.name}
              </h3>
              <span className="text-[11px] font-medium text-gray-400">
                {config.label}
              </span>
            </div>
          </div>

          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300 border border-white/[0.08]">
            {account.currency}
          </span>
        </div>

        {/* Card Body / Balance */}
        <div
          style={{ transform: "translateZ(35px)" }}
          className="flex flex-col gap-0.5"
        >
          <span className="text-xs text-gray-400 font-medium">
            Saldo Tersedia
          </span>
          <div className="text-2xl font-black text-white tracking-tight flex items-baseline">
            <AnimatedCounter
              value={account.balance}
              prefix="Rp "
              className="tabular-nums"
            />
          </div>
        </div>

        {/* Card Footer */}
        <div
          style={{ transform: "translateZ(15px)" }}
          className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-gray-400"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Aktif</span>
          </div>
          <span className="group-hover:text-white transition-colors">
            Ketuk untuk detail →
          </span>
        </div>
      </motion.div>
    </div>
  );
}
