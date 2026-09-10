"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown } from "lucide-react";
import { ExpenseTrendPoint } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface ExpenseTrendAreaChartProps {
  data: ExpenseTrendPoint[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ExpenseTrendPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-3 rounded-xl glass-card border border-white/15 shadow-2xl backdrop-blur-md text-xs flex flex-col gap-1 min-w-[140px]">
        <span className="font-medium text-gray-400">
          {item.label} ({item.date})
        </span>
        <span className="text-base font-black text-crimson-400 tabular-nums">
          {formatCurrency(item.amount)}
        </span>
        <span className="text-[10px] text-gray-400">Pengeluaran harian</span>
      </div>
    );
  }
  return null;
}

export function ExpenseTrendAreaChart({
  data,
  isLoading = false,
}: ExpenseTrendAreaChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-80 rounded-3xl glass-card border border-white/[0.08] p-6 flex flex-col justify-between animate-pulse">
        <div className="h-6 w-44 bg-white/10 rounded" />
        <div className="h-56 w-full bg-white/[0.04] rounded-2xl" />
      </div>
    );
  }

  const hasData = data.some((d) => d.amount > 0);

  return (
    <div className="w-full rounded-3xl glass-card border border-white/[0.08] p-5 sm:p-6 flex flex-col gap-4 shadow-glass">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-crimson-400" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Tren Pengeluaran Keuangan
          </h3>
        </div>
        <span className="text-xs text-gray-400">Gradient Shadow</span>
      </div>

      {!hasData ? (
        <div className="w-full h-72 flex items-center justify-center text-xs text-gray-400 border border-dashed border-white/10 rounded-2xl">
          Belum ada tren pengeluaran pada rentang waktu ini.
        </div>
      ) : (
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="expenseGradientShadow"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#8B5CF6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
                  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
                  return String(val);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#EF4444"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradientShadow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
