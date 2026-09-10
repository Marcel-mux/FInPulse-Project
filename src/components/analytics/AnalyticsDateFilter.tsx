"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import { TimeRange } from "@/types";

interface AnalyticsDateFilterProps {
  selectedRange: TimeRange;
  customStartDate: string;
  customEndDate: string;
  onChange: (range: TimeRange, start?: string, end?: string) => void;
}

const FILTER_OPTIONS: { id: TimeRange; label: string }[] = [
  { id: "7d", label: "7 Hari" },
  { id: "30d", label: "30 Hari" },
  { id: "3m", label: "3 Bulan" },
  { id: "ytd", label: "YTD" },
  { id: "custom", label: "Kustom" },
];

export function AnalyticsDateFilter({
  selectedRange,
  customStartDate,
  customEndDate,
  onChange,
}: AnalyticsDateFilterProps) {
  const [start, setStart] = useState(customStartDate);
  const [end, setEnd] = useState(customEndDate);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (start && end) {
      onChange("custom", start, end);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
      {/* Pills Options */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-charcoal-900 border border-white/[0.08] overflow-x-auto scrollbar-none">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id, start, end)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedRange === opt.id
                ? "bg-emerald-500 text-charcoal-950 shadow-glow-emerald"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs (if custom is selected) */}
      {selectedRange === "custom" && (
        <form
          onSubmit={handleApplyCustom}
          className="flex items-center gap-2 p-1.5 rounded-2xl bg-charcoal-900/90 border border-white/[0.08]"
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-transparent text-white text-xs border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
              required
            />
            <span className="text-gray-500 text-xs">-</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-transparent text-white text-xs border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30 transition-colors"
          >
            Terapkan
          </button>
        </form>
      )}
    </div>
  );
}
