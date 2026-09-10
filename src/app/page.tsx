"use client";

import { Header } from "@/components/layout/Header";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { AccountCarousel } from "@/components/dashboard/AccountCarousel";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { AccountFormModal } from "@/components/modals/AccountFormModal";
import { ReconciliationModal } from "@/components/modals/ReconciliationModal";
import { CategoryFormModal } from "@/components/modals/CategoryFormModal";
import { ManageAccountsModal } from "@/components/modals/ManageAccountsModal";
import { ManageCategoriesModal } from "@/components/modals/ManageCategoriesModal";
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
    setManageAccountsOpen,
  } = useAppStore();

  const accounts = accountsData?.accounts || [];
  const totalNetWorth = accountsData?.totalNetWorth || 0;
  const activeAccountsCount = accountsData?.activeAccountsCount || 0;
  const transactions = transactionsData?.transactions || [];

  return (
    <div className="min-h-screen bg-charcoal-950 text-foreground flex flex-col">
      {/* Top Header */}
      <Header />

      {/* Main Dashboard Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Total Net Worth Overview */}
        <NetWorthCard
          totalNetWorth={totalNetWorth}
          activeAccountsCount={activeAccountsCount}
          isLoading={isAccountsLoading}
        />

        {/* Multi-Account Horizontal Carousel */}
        <AccountCarousel
          accounts={accounts}
          isLoading={isAccountsLoading}
          selectedAccountId={selectedAccountId}
          onSelectAccount={(id) =>
            setSelectedAccountId(selectedAccountId === id ? null : id)
          }
          onAddAccount={() => openAccountForm(null)}
          onManageAccounts={() => setManageAccountsOpen(true)}
        />

        {/* Recent Activity Feed */}
        <RecentActivityFeed
          transactions={transactions}
          isLoading={isTransactionsLoading}
          onAddTransaction={() => setTransactionModalOpen(true, "expense")}
        />
      </main>

      {/* Modals */}
      <AccountFormModal />
      <ReconciliationModal />
      <CategoryFormModal />
      <ManageAccountsModal />
      <ManageCategoriesModal />
    </div>
  );
}
