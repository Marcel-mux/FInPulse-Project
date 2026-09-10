import { create } from "zustand";
import { Account, Category } from "@/types";

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

  // Balance reconciliation modal
  isReconciliationOpen: boolean;
  reconcilingAccount: Account | null;

  // Category management modals
  isManageCategoriesOpen: boolean;
  isCategoryFormOpen: boolean;
  editingCategory: Category | null;

  // Actions
  setTransactionModalOpen: (open: boolean, defaultType?: TransactionType) => void;
  setActiveTransactionType: (type: TransactionType) => void;
  setSelectedAccountId: (accountId: string | null) => void;

  setManageAccountsOpen: (open: boolean) => void;
  openAccountForm: (account?: Account | null) => void;
  closeAccountForm: () => void;

  openReconciliation: (account: Account) => void;
  closeReconciliation: () => void;

  setManageCategoriesOpen: (open: boolean) => void;
  openCategoryForm: (category?: Category | null) => void;
  closeCategoryForm: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isTransactionModalOpen: false,
  activeTransactionType: "expense",
  selectedAccountId: null,

  isManageAccountsOpen: false,
  isAccountFormOpen: false,
  editingAccount: null,

  isReconciliationOpen: false,
  reconcilingAccount: null,

  isManageCategoriesOpen: false,
  isCategoryFormOpen: false,
  editingCategory: null,

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

  openReconciliation: (account) =>
    set({ isReconciliationOpen: true, reconcilingAccount: account }),
  closeReconciliation: () =>
    set({ isReconciliationOpen: false, reconcilingAccount: null }),

  setManageCategoriesOpen: (open) => set({ isManageCategoriesOpen: open }),
  openCategoryForm: (category = null) =>
    set({ isCategoryFormOpen: true, editingCategory: category }),
  closeCategoryForm: () =>
    set({ isCategoryFormOpen: false, editingCategory: null }),
}));
