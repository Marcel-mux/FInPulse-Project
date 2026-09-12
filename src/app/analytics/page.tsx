"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { QuickActionFloatingBar } from "@/components/dashboard/QuickActionFloatingBar";
import { GlobalModals } from "@/components/layout/GlobalModals";
import { AnalyticsDateFilter } from "@/components/analytics/AnalyticsDateFilter";
import { AnalyticsSummaryCards } from "@/components/analytics/AnalyticsSummaryCards";
import { CashFlowBarChart } from "@/components/analytics/CashFlowBarChart";
import { CategoryDonutChart } from "@/components/analytics/CategoryDonutChart";
import { ExpenseTrendAreaChart } from "@/components/analytics/ExpenseTrendAreaChart";
import { FilteredTransactionList } from "@/components/analytics/FilteredTransactionList";
import { useAnalytics } from "@/hooks/useFinance";
import { TimeRange } from "@/types";

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const { data, isLoading } = useAnalytics(
    selectedRange,
    customStartDate || undefined,
    customEndDate || undefined
  );

  const summary = data?.summary || {
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
    savingsRate: 0,
    transactionCount: 0,
  };

  const cashFlow = data?.cashFlow || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const expenseTrend = data?.expenseTrend || [];
  const transactions = data?.transactions || [];

  const selectedCategoryObj = categoryBreakdown.find(
    (c) => c.categoryId === selectedCategoryId
  );

  return (
    <div className="min-h-screen bg-charcoal-950 text-foreground flex flex-col relative max-w-full overflow-x-hidden w-screen">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 sm:pb-32 flex flex-col gap-6 sm:gap-8">
        {/* Page Title & Time Range Filter */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Analitik & Laporan Finansial
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Visualisasi mendalam arus kas, alokasi kategori, dan tren pengeluaran.
            </p>
          </div>

          <AnalyticsDateFilter
            selectedRange={selectedRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onChange={(range, start, end) => {
              setSelectedRange(range);
              if (start) setCustomStartDate(start);
              if (end) setCustomEndDate(end);
              setSelectedCategoryId(null); // reset category filter on range change
            }}
          />
        </div>

        {/* 1. Summary KPI Cards */}
        <AnalyticsSummaryCards summary={summary} isLoading={isLoading} />

        {/* 2. Cash Flow In vs Out Bar Chart */}
        <CashFlowBarChart data={cashFlow} isLoading={isLoading} />

        {/* 3. Expense Trend Area Chart with Gradient Shadow */}
        <ExpenseTrendAreaChart data={expenseTrend} isLoading={isLoading} />

        {/* 4. Donut Chart Category Breakdown with Interactive Sector Filter */}
        <CategoryDonutChart
          data={categoryBreakdown}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(catId) => setSelectedCategoryId(catId)}
          isLoading={isLoading}
        />

        {/* 5. Filtered Transactions List below Donut Chart */}
        <FilteredTransactionList
          transactions={transactions}
          selectedCategoryId={selectedCategoryId}
          selectedCategoryName={selectedCategoryObj?.name}
          onClearFilter={() => setSelectedCategoryId(null)}
          isLoading={isLoading}
        />
      </main>

      {/* Floating Action Bar & All Global Modals */}
      <QuickActionFloatingBar />
      <GlobalModals />
    </div>
  );
}
