"use client";

import { Header } from "@/components/layout/Header";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { AccountCarousel } from "@/components/dashboard/AccountCarousel";
import { PaylaterSection } from "@/components/paylater/PaylaterSection";
import { LoanSection } from "@/components/loans/LoanSection";
import { BillSection } from "@/components/bills/BillSection";
import { BudgetSection } from "@/components/budget/BudgetSection";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { QuickSpendingWidget } from "@/components/dashboard/QuickSpendingWidget";
import { QuickActionFloatingBar } from "@/components/dashboard/QuickActionFloatingBar";
import { GlobalModals } from "@/components/layout/GlobalModals";
import { useAccounts, useRecentTransactions } from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";

export default function DashboardPage() {
  const { data: accountsData, isLoading: isAccountsLoading } = useAccounts();
  const { data: transactionsData, isLoading: isTransactionsLoading } =
    useRecentTransactions(10);

  const {
    selectedAccountId,
    setSelectedAccountId,
    setTransactionModalOpen,
    openAccountForm,
    openAccountDetail,
    setManageAccountsOpen,
  } = useAppStore();

  const accounts = accountsData?.accounts || [];
  const totalNetWorth = accountsData?.totalNetWorth || 0;
  const totalActualBalance = accountsData?.totalActualBalance || 0;
  const totalDebt = accountsData?.totalPaylaterUsed || 0;
  const activeAccountsCount = accountsData?.activeAccountsCount || 0;
  const transactions = transactionsData?.transactions || [];

  return (
    <div className="min-h-screen bg-charcoal-950 text-foreground flex flex-col relative max-w-full overflow-x-hidden w-screen">
      {/* Top Header */}
      <Header />

      {/* Main Dashboard Content - Aligned to max-w-7xl with Multi-Column Grid on Desktop */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 sm:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Kolom Kiri / Utama (lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
            {/* Total Net Worth Overview */}
            <NetWorthCard
              totalNetWorth={totalNetWorth}
              totalActualBalance={totalActualBalance}
              totalDebt={totalDebt}
              activeAccountsCount={activeAccountsCount}
              isLoading={isAccountsLoading}
            />

            {/* Multi-Account Horizontal Carousel (Mobile) / Grid (Desktop) */}
            <AccountCarousel
              accounts={accounts}
              isLoading={isAccountsLoading}
              selectedAccountId={selectedAccountId}
              onSelectAccount={(id) =>
                setSelectedAccountId(selectedAccountId === id ? null : id)
              }
              onAccountClick={(acc) => openAccountDetail(acc)}
              onAddAccount={() => openAccountForm(null)}
              onManageAccounts={() => setManageAccountsOpen(true)}
            />

            {/* Section Khusus: Limit Paylater & Fasilitas Kredit */}
            <div id="paylater-section">
              <PaylaterSection />
            </div>

            {/* Section Khusus: Pinjaman & Cicilan Paylater */}
            <div id="loan-section">
              <LoanSection />
            </div>

            {/* Recent Activity Feed */}
            <RecentActivityFeed
              transactions={transactions}
              isLoading={isTransactionsLoading}
              onAddTransaction={() => setTransactionModalOpen(true, "expense")}
            />
          </div>

          {/* Kolom Kanan / Sidebar Widget (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">
            {/* Tagihan & Autodebet (Bills & Recurring) */}
            <div id="bill-section">
              <BillSection />
            </div>

            {/* Ringkasan Anggaran Bulanan (Budgets) */}
            <BudgetSection />

            {/* Breakdown Kategori Belanja / Ringkasan Cepat */}
            <QuickSpendingWidget />
          </div>
        </div>
      </main>

      {/* Quick Action Floating Bar (Fixed at bottom) */}
      <QuickActionFloatingBar />

      {/* All Global Modals (Accounts, Transactions, Reconciliation, Budgets, Export & Print) */}
      <GlobalModals />
    </div>
  );
}
