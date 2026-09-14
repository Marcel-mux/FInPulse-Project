import { create } from "zustand";
import { Account, BillWithRelations, BudgetWithCategory, Category } from "@/types";

export type TransactionType = "income" | "expense" | "transfer";

interface AppState {
  // Modal states
  isTransactionModalOpen: boolean;
  activeTransactionType: TransactionType;
  selectedAccountId: string | null;

  // Account management modals
  isManageAccountsOpen: boolean;
  isAccountFormOpen: boolean;
  editingAccount: Account | null;

  // Account detail modal
  isAccountDetailOpen: boolean;
  viewingAccount: Account | null;

  // Balance reconciliation modal
  isReconciliationOpen: boolean;
  reconcilingAccount: Account | null;

  // Category management modals
  isManageCategoriesOpen: boolean;
  isCategoryFormOpen: boolean;
  editingCategory: Category | null;

  // Budget management modals
  isBudgetModalOpen: boolean;
  editingBudget: BudgetWithCategory | null;

  // Bill & recurring subscription modals
  isBillModalOpen: boolean;
  editingBill: BillWithRelations | null;

  // Export report modal
  isExportModalOpen: boolean;

  // WhatsApp bot integration modal
  isWhatsAppModalOpen: boolean;

  // Paylater management modal
  isPaylaterModalOpen: boolean;
  editingPaylaterAccount: Account | null;

  // Loan / Installment modal
  isLoanModalOpen: boolean;

  // Actions
  setTransactionModalOpen: (open: boolean, defaultType?: TransactionType) => void;
  setActiveTransactionType: (type: TransactionType) => void;
  setSelectedAccountId: (accountId: string | null) => void;

  setManageAccountsOpen: (open: boolean) => void;
  openAccountForm: (account?: Account | null) => void;
  closeAccountForm: () => void;

  openAccountDetail: (account: Account) => void;
  closeAccountDetail: () => void;

  openReconciliation: (account: Account) => void;
  closeReconciliation: () => void;

  setManageCategoriesOpen: (open: boolean) => void;
  openCategoryForm: (category?: Category | null) => void;
  closeCategoryForm: () => void;

  openBudgetForm: (budget?: BudgetWithCategory | null) => void;
  closeBudgetForm: () => void;

  openBillForm: (bill?: BillWithRelations | null) => void;
  closeBillForm: () => void;

  openPaylaterModal: (account?: Account | null) => void;
  closePaylaterModal: () => void;

  openLoanModal: () => void;
  closeLoanModal: () => void;

  setExportModalOpen: (open: boolean) => void;
  setWhatsAppModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isTransactionModalOpen: false,
  activeTransactionType: "expense",
  selectedAccountId: null,

  isManageAccountsOpen: false,
  isAccountFormOpen: false,
  editingAccount: null,

  isAccountDetailOpen: false,
  viewingAccount: null,

  isReconciliationOpen: false,
  reconcilingAccount: null,

  isManageCategoriesOpen: false,
  isCategoryFormOpen: false,
  editingCategory: null,

  isBudgetModalOpen: false,
  editingBudget: null,

  isBillModalOpen: false,
  editingBill: null,

  isPaylaterModalOpen: false,
  editingPaylaterAccount: null,

  isLoanModalOpen: false,

  isExportModalOpen: false,
  isWhatsAppModalOpen: false,

  setTransactionModalOpen: (open, defaultType) =>
    set((state) => ({
      isTransactionModalOpen: open,
      activeTransactionType: defaultType ?? state.activeTransactionType,
    })),
  setActiveTransactionType: (type) => set({ activeTransactionType: type }),
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),

  setManageAccountsOpen: (open) => set({ isManageAccountsOpen: open }),
  openAccountForm: (account = null) =>
    set({ isAccountFormOpen: true, editingAccount: account }),
  closeAccountForm: () =>
    set({ isAccountFormOpen: false, editingAccount: null }),

  openAccountDetail: (account) =>
    set({ isAccountDetailOpen: true, viewingAccount: account }),
  closeAccountDetail: () =>
    set({ isAccountDetailOpen: false, viewingAccount: null }),

  openReconciliation: (account) =>
    set({ isReconciliationOpen: true, reconcilingAccount: account }),
  closeReconciliation: () =>
    set({ isReconciliationOpen: false, reconcilingAccount: null }),

  setManageCategoriesOpen: (open) => set({ isManageCategoriesOpen: open }),
  openCategoryForm: (category = null) =>
    set({ isCategoryFormOpen: true, editingCategory: category }),
  closeCategoryForm: () =>
    set({ isCategoryFormOpen: false, editingCategory: null }),

  openBudgetForm: (budget = null) =>
    set({ isBudgetModalOpen: true, editingBudget: budget }),
  closeBudgetForm: () =>
    set({ isBudgetModalOpen: false, editingBudget: null }),

  openBillForm: (bill = null) =>
    set({ isBillModalOpen: true, editingBill: bill }),
  closeBillForm: () =>
    set({ isBillModalOpen: false, editingBill: null }),

  openPaylaterModal: (account = null) =>
    set({ isPaylaterModalOpen: true, editingPaylaterAccount: account }),
  closePaylaterModal: () =>
    set({ isPaylaterModalOpen: false, editingPaylaterAccount: null }),

  openLoanModal: () => set({ isLoanModalOpen: true }),
  closeLoanModal: () => set({ isLoanModalOpen: false }),

  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setWhatsAppModalOpen: (open) => set({ isWhatsAppModalOpen: open }),
}));
