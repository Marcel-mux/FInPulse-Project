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
  let fillColor = "bg-emerald-500";
  let textColor = "text-emerald-400";
  let StatusIcon = CheckCircle2;
  let statusText = "Aman";

  if (isWarning) {
    fillColor = "bg-amber-500";
    textColor = "text-amber-400";
    StatusIcon = AlertTriangle;
    statusText = "Waspada";
  } else if (isCritical) {
    fillColor = "bg-rose-500";
    textColor = "text-rose-400";
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
        className={`w-full ${height} rounded-full bg-charcoal-900 border border-white/[0.08] overflow-hidden p-0.5 relative`}
      >
        {/* Solid Animated Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className={`h-full rounded-full ${fillColor} relative overflow-hidden`}
        />
      </div>
    </div>
  );
}
