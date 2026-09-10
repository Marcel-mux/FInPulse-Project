"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownLeft, ArrowUpRight, BarChart3 } from "lucide-react";
import { CashFlowDataPoint } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface CashFlowBarChartProps {
  data: CashFlowDataPoint[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: CashFlowDataPoint;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-3.5 rounded-2xl glass-card border border-white/15 shadow-2xl backdrop-blur-md text-xs flex flex-col gap-2 min-w-[180px]">
        <div className="font-bold text-white border-b border-white/10 pb-1.5">
          {item.label} ({item.date})
        </div>
        <div className="flex items-center justify-between text-emerald-400">
          <span className="flex items-center gap-1 font-medium">
            <ArrowDownLeft className="w-3 h-3" /> Masuk
          </span>
          <span className="font-bold tabular-nums">
            {formatCurrency(item.income)}
          </span>
        </div>
        <div className="flex items-center justify-between text-crimson-400">
          <span className="flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3 h-3" /> Keluar
          </span>
          <span className="font-bold tabular-nums">
            {formatCurrency(item.expense)}
          </span>
        </div>
        <div className="flex items-center justify-between text-gray-300 pt-1 border-t border-white/10">
          <span className="font-medium">Bersih</span>
          <span
            className={`font-bold tabular-nums ${
              item.net >= 0 ? "text-emerald-400" : "text-crimson-400"
            }`}
          >
            {item.net >= 0 ? "+" : ""}
            {formatCurrency(item.net)}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function CashFlowBarChart({
  data,
  isLoading = false,
}: CashFlowBarChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-80 rounded-3xl glass-card border border-white/[0.08] p-6 flex flex-col justify-between animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded" />
        <div className="h-56 w-full bg-white/[0.04] rounded-2xl" />
      </div>
    );
  }

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="w-full rounded-3xl glass-card border border-white/[0.08] p-5 sm:p-6 flex flex-col gap-4 shadow-glass">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Arus Kas: Pemasukan vs Pengeluaran
          </h3>
        </div>
        <span className="text-xs text-gray-400">Recharts Interaktif</span>
      </div>

      {/* Chart Container */}
      {!hasData ? (
        <div className="w-full h-72 flex items-center justify-center text-xs text-gray-400 border border-dashed border-white/10 rounded-2xl">
          Belum ada transaksi pada rentang waktu ini.
        </div>
      ) : (
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
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
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                formatter={(value) => (
                  <span className="text-xs text-gray-300 font-medium">
                    {value === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                )}
              />
              <Bar
                name="income"
                dataKey="income"
                fill="#10B981"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                name="expense"
                dataKey="expense"
                fill="#EF4444"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
