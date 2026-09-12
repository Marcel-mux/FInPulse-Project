"use client";

import { motion } from "framer-motion";
import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";

interface BudgetProgressBarProps {
  percentage: number;
  height?: string;
  showLabels?: boolean;
}

export function BudgetProgressBar({
  percentage,
  height = "h-3",
  showLabels = false,
}: BudgetProgressBarProps) {
  const safePercentage =
    typeof percentage === "number" && !isNaN(percentage) ? percentage : 0;

  // Threshold determination
  const isWarning = safePercentage >= 70 && safePercentage <= 90;
  const isCritical = safePercentage > 90;

  // Visual classes based on threshold
  let fillGradient = "from-emerald-500 to-emerald-400";
  let glowClass = "shadow-glow-emerald";
  let textColor = "text-emerald-400";
  let StatusIcon = CheckCircle2;
  let statusText = "Aman";

  if (isWarning) {
    fillGradient = "from-amber-500 to-amber-400";
    glowClass = "shadow-[0_0_20px_-3px_rgba(245,158,11,0.45)]";
    textColor = "text-amber-400";
    StatusIcon = AlertTriangle;
    statusText = "Waspada";
  } else if (isCritical) {
    fillGradient = "from-crimson-600 to-crimson-500";
    glowClass = "shadow-glow-crimson";
    textColor = "text-crimson-400";
    StatusIcon = AlertOctagon;
    statusText = safePercentage >= 100 ? "Melebihi Bujet!" : "Kritis";
  }

  const clampedPercentage = Math.min(Math.max(safePercentage, 0), 100);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-semibold">
            <StatusIcon className={`w-3.5 h-3.5 ${textColor}`} />
            <span className={textColor}>{statusText}</span>
          </div>
          <span className={`font-bold tabular-nums ${textColor}`}>
            {safePercentage}%
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div
        className={`w-full ${height} rounded-full bg-charcoal-900 border border-white/[0.08] overflow-hidden p-0.5 relative ${
          isCritical
            ? "ring-2 ring-crimson-500/40 ring-offset-1 ring-offset-charcoal-950 animate-pulse"
            : ""
        }`}
      >
        {/* Liquid-fill Animated Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${fillGradient} ${glowClass} relative overflow-hidden`}
        >
          {/* Liquid Shimmer Light Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
    </div>
  );
}
