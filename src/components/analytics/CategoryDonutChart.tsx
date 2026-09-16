"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon, X } from "lucide-react";
import { CategoryBreakdownPoint } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface CategoryDonutChartProps {
  data: CategoryBreakdownPoint[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryBreakdownPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-3 rounded-xl glass-card border border-white/15 shadow-2xl backdrop-blur-md text-xs flex flex-col gap-1 min-w-[150px]">
        <div className="flex items-center gap-2 font-bold text-white">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.name}</span>
        </div>
        <div className="text-sm font-black text-white tabular-nums">
          {formatCurrency(item.value)}
        </div>
        <div className="text-[11px] text-gray-400">
          {item.percentage}% dari total pengeluaran ({item.count} transaksi)
        </div>
      </div>
    );
  }
  return null;
}

export function CategoryDonutChart({
  data,
  selectedCategoryId,
  onSelectCategory,
  isLoading = false,
}: CategoryDonutChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-80 rounded-2xl glass-card border border-white/[0.08] p-6 flex flex-col justify-between animate-pulse">
        <div className="h-6 w-44 bg-white/10 rounded" />
        <div className="h-56 w-full bg-white/[0.04] rounded-2xl" />
      </div>
    );
  }

  const totalExpense = data.reduce((acc, cur) => acc + cur.value, 0);
  const selectedCategory = data.find((d) => d.categoryId === selectedCategoryId);

  return (
    <div className="w-full rounded-2xl glass-card border border-white/[0.08] p-5 sm:p-6 flex flex-col gap-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Proporsi Pengeluaran per Kategori
          </h3>
        </div>
        {selectedCategoryId && (
          <button
            onClick={() => onSelectCategory(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="w-full h-72 flex items-center justify-center text-xs text-gray-400 border border-dashed border-white/10 rounded-2xl">
          Belum ada pengeluaran pada rentang waktu ini.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Donut Chart with center label */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={95}
                  paddingAngle={3}
                  onClick={(entry) => {
                    const raw = entry as unknown as {
                      categoryId?: string;
                      payload?: { categoryId?: string };
                    };
                    const catId = raw?.categoryId || raw?.payload?.categoryId;
                    if (catId) {
                      onSelectCategory(
                        selectedCategoryId === catId ? null : catId
                      );
                    }
                  }}
                  className="cursor-pointer"
                >
                  {data.map((entry) => {
                    const isSelected = selectedCategoryId === entry.categoryId;
                    return (
                      <Cell
                        key={`cell-${entry.categoryId}`}
                        fill={entry.color}
                        stroke={isSelected ? "#ffffff" : "rgba(11, 15, 25, 0.8)"}
                        strokeWidth={isSelected ? 3 : 2}
                        opacity={
                          selectedCategoryId && !isSelected ? 0.35 : 1
                        }
                        className="cursor-pointer transition-opacity"
                        onClick={() =>
                          onSelectCategory(
                            selectedCategoryId === entry.categoryId
                              ? null
                              : entry.categoryId
                          )
                        }
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Content Display */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                {selectedCategory ? selectedCategory.name : "Total Pengeluaran"}
              </span>
              <span className="text-sm sm:text-base font-black text-white tracking-tight tabular-nums mt-0.5">
                {formatCurrency(selectedCategory ? selectedCategory.value : totalExpense)}
              </span>
              {selectedCategory && (
                <span className="text-[10px] text-emerald-400 font-bold">
                  {selectedCategory.percentage}% dari total
                </span>
              )}
            </div>
          </div>

          {/* Interactive Categories Legend List */}
          <div className="w-full flex-1 max-h-64 overflow-y-auto pr-1 flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium mb-1">
              💡 Ketuk kategori untuk memfilter daftar transaksi di bawah:
            </span>
            {data.map((cat) => {
              const isSelected = selectedCategoryId === cat.categoryId;
              return (
                <div
                  key={cat.categoryId}
                  onClick={() =>
                    onSelectCategory(isSelected ? null : cat.categoryId)
                  }
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/[0.1] border-white/40 shadow-sm"
                      : "bg-charcoal-900/60 border-white/[0.04] hover:border-white/15 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-semibold text-white truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs tabular-nums">
                    <span className="font-bold text-white">
                      {formatCurrency(cat.value)}
                    </span>
                    <span className="text-gray-400 text-[11px] w-10 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
