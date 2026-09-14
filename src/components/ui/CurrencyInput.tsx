"use client";

import React, { useEffect, useState } from "react";

export interface CurrencyInputProps {
  id?: string;
  name?: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  quickAmounts?: { label: string; val: number }[];
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  subLabel?: React.ReactNode;
  prefix?: string;
  error?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  accentColor?: "orange" | "emerald" | "rose" | "cyan" | "indigo" | "amber";
  min?: number;
  max?: number;
  autoFocus?: boolean;
}

export function CurrencyInput({
  id,
  name,
  value,
  onChange,
  placeholder = "0",
  quickAmounts,
  label,
  helperText,
  subLabel,
  prefix = "Rp",
  error,
  required = false,
  className = "",
  inputClassName = "",
  accentColor = "orange",
  autoFocus = false,
}: CurrencyInputProps) {
  // Format numeric value for display (e.g. 1500000 -> "1.500.000")
  const formatDisplay = (num: number): string => {
    if (!num || isNaN(num) || num <= 0) return "";
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatDisplay(value)
  );

  // Sync with value prop changes from parent / quick chips
  useEffect(() => {
    setDisplayValue(formatDisplay(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    if (!rawDigits) {
      setDisplayValue("");
      onChange(0);
      return;
    }

    const num = parseInt(rawDigits, 10) || 0;
    setDisplayValue(new Intl.NumberFormat("id-ID").format(num));
    onChange(num);
  };

  const handleQuickAdd = (addVal: number) => {
    const currentNum = value || 0;
    const newTotal = currentNum + addVal;
    setDisplayValue(new Intl.NumberFormat("id-ID").format(newTotal));
    onChange(newTotal);
  };

  const accentBorderMap = {
    orange: "focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20",
    emerald: "focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20",
    rose: "focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/20",
    cyan: "focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20",
    indigo: "focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20",
    amber: "focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20",
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || subLabel) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="text-xs font-semibold text-gray-300 flex items-center gap-1"
            >
              {label}
              {required && <span className="text-rose-400">*</span>}
            </label>
          )}
          {subLabel && (
            <span className="text-[10px] text-gray-400">{subLabel}</span>
          )}
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono select-none pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          required={required}
          readOnly={false}
          disabled={false}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          className={`w-full ${
            prefix ? "pl-10" : "pl-3.5"
          } pr-3.5 py-2.5 rounded-xl bg-charcoal-900/80 border border-white/10 text-white font-mono text-xs font-bold placeholder:text-gray-500 transition-colors ${
            accentBorderMap[accentColor]
          } ${error ? "border-rose-500/50" : ""} ${inputClassName}`}
        />
      </div>

      {/* Quick helper chips */}
      {quickAmounts && quickAmounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          {quickAmounts.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleQuickAdd(chip.val)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] active:scale-95 text-[11px] font-semibold text-gray-300 border border-white/5 transition-all cursor-pointer select-none"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {helperText && !error && (
        <p className="text-[10px] text-gray-400 mt-0.5">{helperText}</p>
      )}

      {error && <p className="text-[10px] text-rose-400 mt-0.5">{error}</p>}
    </div>
  );
}
