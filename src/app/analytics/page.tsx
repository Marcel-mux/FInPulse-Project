"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { QuickActionFloatingBar } from "@/components/dashboard/QuickActionFloatingBar";
import { GlobalModals } from "@/components/layout/GlobalModals";
import { AnalyticsDateFilter } from "@/components/analytics/AnalyticsDateFilter";
import { AnalyticsSummaryCards } from "@/components/analytics/AnalyticsSummaryCards";
import { NetWorthBanner } from "@/components/analytics/NetWorthBanner";
import { LiquidAccountsDonutChart } from "@/components/analytics/LiquidAccountsDonutChart";
import { CreditPlatformList } from "@/components/analytics/CreditPlatformList";
import { CashFlowBarChart } from "@/components/analytics/CashFlowBarChart";
import { CategoryDonutChart } from "@/components/analytics/CategoryDonutChart";
import { ExpenseTrendAreaChart } from "@/components/analytics/ExpenseTrendAreaChart";
import { FilteredTransactionList } from "@/components/analytics/FilteredTransactionList";
import { useAnalytics } from "@/hooks/useFinance";
import { TimeRange } from "@/types";
import { CreditCard, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Tab State: "real_wealth" (Section A) atau "credit_facility" (Section B)
  const [activeTab, setActiveTab] = useState<"real_wealth" | "credit_facility">(
    "real_wealth"
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

  const realWealth = data?.realWealth;
  const creditFacility = data?.creditFacility;
  const netWorth = data?.netWorth;

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
              Laporan & Analitik Finansial
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Pemisahan tegas antara Saldo Likuid Riil (Kas/Bank) dan Fasilitas Kredit/Paylater berjalan.
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
              setSelectedCategoryId(null);
            }}
          />
        </div>

        {/* 1. Net Worth Banner dengan Formula Transparan */}
        <NetWorthBanner netWorth={netWorth} isLoading={isLoading} />

        {/* 2. Navigation Tabs (Section A vs Section B) */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-charcoal-900 border border-white/10 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("real_wealth")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "real_wealth"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-charcoal-950 shadow-lg shadow-emerald-500/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>💰 Kekayaan Riil & Arus Kas</span>
            {realWealth && (
              <span
                className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === "real_wealth"
                    ? "bg-black/20 text-charcoal-950 font-mono"
                    : "bg-white/10 text-emerald-400 font-mono"
                }`}
              >
                {formatCurrency(realWealth.totalActualBalance)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credit_facility")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "credit_facility"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-charcoal-950 shadow-lg shadow-orange-500/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💳 Fasilitas Kredit & Paylater</span>
            {creditFacility && (
              <span
                className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === "credit_facility"
                    ? "bg-black/20 text-charcoal-950 font-mono"
                    : "bg-white/10 text-orange-400 font-mono"
                }`}
              >
                {creditFacility.creditUtilization}% Terpakai
              </span>
            )}
          </button>
        </div>

        {/* 3. Render Active Section */}
        {activeTab === "real_wealth" ? (
          /* SECTION A: KEKAYAAN RIIL & ARUS KAS */
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* 4 Summary Cards (Saldo Likuid, Pemasukan Riil, Pengeluaran Riil, Arus Kas Bersih) */}
            <AnalyticsSummaryCards
              summary={summary}
              totalActualBalance={realWealth?.totalActualBalance || 0}
              isLoading={isLoading}
            />

            {/* Grid Charts: Distribusi Saldo Likuid & Arus Kas Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart Distribusi Saldo per Rekening Likuid */}
              <LiquidAccountsDonutChart
                data={realWealth?.accountsDistribution || []}
                isLoading={isLoading}
              />

              {/* Cash Flow In vs Out Bar Chart */}
              <CashFlowBarChart data={cashFlow} isLoading={isLoading} />
            </div>

            {/* Expense Trend Area Chart with Gradient Shadow */}
            <ExpenseTrendAreaChart data={expenseTrend} isLoading={isLoading} />

            {/* Donut Chart Category Breakdown with Interactive Sector Filter */}
            <CategoryDonutChart
              data={categoryBreakdown}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={(catId) => setSelectedCategoryId(catId)}
              isLoading={isLoading}
            />

            {/* Filtered Transactions List below Donut Chart */}
            <FilteredTransactionList
              transactions={transactions}
              selectedCategoryId={selectedCategoryId}
              selectedCategoryName={selectedCategoryObj?.name}
              onClearFilter={() => setSelectedCategoryId(null)}
              isLoading={isLoading}
            />
          </div>
        ) : (
          /* SECTION B: FASILITAS KREDIT & PAYLATER */
          <CreditPlatformList
            creditFacility={creditFacility}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Floating Action Bar & All Global Modals */}
      <QuickActionFloatingBar />
      <GlobalModals />
    </div>
  );
}
