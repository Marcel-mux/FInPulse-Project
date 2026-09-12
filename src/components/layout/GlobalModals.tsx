"use client";

import { useMemo } from "react";
import { TransactionModal } from "@/components/modals/TransactionModal";
import { AccountFormModal } from "@/components/modals/AccountFormModal";
import { AccountDetailModal } from "@/components/modals/AccountDetailModal";
import { ReconciliationModal } from "@/components/modals/ReconciliationModal";
import { CategoryFormModal } from "@/components/modals/CategoryFormModal";
import { ManageAccountsModal } from "@/components/modals/ManageAccountsModal";
import { ManageCategoriesModal } from "@/components/modals/ManageCategoriesModal";
import { BudgetFormModal } from "@/components/modals/BudgetFormModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { WhatsAppIntegrationModal } from "@/components/modals/WhatsAppIntegrationModal";
import { PrintableReport } from "@/components/export/PrintableReport";
import { useAccounts, useRecentTransactions } from "@/hooks/useFinance";
import { AnalyticsSummary, TransactionWithRelations } from "@/types";

export function GlobalModals() {
  const { data: accountsData } = useAccounts();
  const { data: transactionsData } = useRecentTransactions(100);

  const accounts = useMemo(() => accountsData?.accounts || [], [accountsData]);
  const transactions: TransactionWithRelations[] = useMemo(
    () => transactionsData?.transactions || [],
    [transactionsData]
  );
  const totalNetWorth = accountsData?.totalNetWorth || 0;

  // Derive simple summary for print report
  const summary: AnalyticsSummary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of transactions) {
      if (tx.type === "income") inc += tx.amount;
      if (tx.type === "expense") exp += tx.amount;
    }
    const net = inc - exp;
    const rate = inc > 0 ? Math.round(((inc - exp) / inc) * 100 * 10) / 10 : 0;
    return {
      totalIncome: inc,
      totalExpense: exp,
      netCashFlow: net,
      savingsRate: rate,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  return (
    <>
      <TransactionModal />
      <AccountFormModal />
      <AccountDetailModal />
      <ReconciliationModal />
      <CategoryFormModal />
      <ManageAccountsModal />
      <ManageCategoriesModal />
      <BudgetFormModal />
      <ExportModal />
      <WhatsAppIntegrationModal />

      {/* Hidden printable report (A4 vector output) */}
      <PrintableReport
        transactions={transactions}
        accounts={accounts}
        summary={summary}
        totalNetWorth={totalNetWorth}
        periodLabel="Laporan Eksekutif Terbaru"
      />
    </>
  );
}
