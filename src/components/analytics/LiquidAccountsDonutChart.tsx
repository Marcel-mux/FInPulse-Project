"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Landmark, Wallet } from "lucide-react";
import { LiquidAccountDistribution } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface LiquidAccountsDonutChartProps {
  data: LiquidAccountDistribution[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: LiquidAccountDistribution;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-3 rounded-xl glass-card border border-white/15 shadow-2xl backdrop-blur-md text-xs flex flex-col gap-1 min-w-[160px]">
        <div className="flex items-center gap-2 font-bold text-white">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.colorHex || "#10B981" }}
          />
          <span>{item.name}</span>
        </div>
        <div className="text-sm font-black text-white tabular-nums">
          {formatCurrency(item.balance)}
        </div>
        <div className="text-[11px] text-gray-400">
          {item.percentage}% dari total saldo likuid
        </div>
      </div>
    );
  }
  return null;
}

export function LiquidAccountsDonutChart({
  data,
  isLoading = false,
}: LiquidAccountsDonutChartProps) {
  const totalBalance = data.reduce((sum, item) => sum + item.balance, 0);

  if (isLoading) {
    return (
      <div className="w-full h-80 rounded-3xl glass-card border border-white/[0.08] p-6 flex flex-col justify-between animate-pulse">
        <div className="h-6 w-44 bg-white/10 rounded" />
        <div className="h-56 w-full bg-white/[0.04] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl glass-card border border-white/[0.08] p-5 sm:p-6 flex flex-col gap-5 shadow-glass">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Distribusi Saldo Kas & Bank
            </h3>
            <p className="text-[11px] text-gray-400">
              Alokasi dana pada rekening kas likuid aktif
            </p>
          </div>
        </div>

        <span className="text-xs font-bold font-mono text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          Total: {formatCurrency(totalBalance)}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center text-gray-400 text-xs">
          <Landmark className="w-8 h-8 text-zinc-600 mb-2" />
          <span>Belum ada data rekening kas atau bank aktif.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart Container */}
          <div className="lg:col-span-5 h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="balance"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="transparent"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.colorHex || "#10B981"}
                      className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                Likuid
              </span>
              <span className="text-xs font-black text-white font-mono">
                {data.length} Akun
              </span>
            </div>
          </div>

          {/* Accounts Breakdown List */}
          <div className="lg:col-span-7 flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {data.map((acc) => (
              <div
                key={acc.id}
                className="p-2.5 sm:p-3 rounded-xl bg-charcoal-900/60 border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: acc.colorHex || "#10B981" }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase">
                      {acc.type}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold font-mono text-emerald-400 block">
                    {formatCurrency(acc.balance)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {acc.percentage}% porsi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
