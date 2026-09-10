import { create } from "zustand";

export type TransactionType = "income" | "expense" | "transfer";

interface AppState {
  // Modal states
  isTransactionModalOpen: boolean;
  activeTransactionType: TransactionType;
  selectedAccountId: string | null;

  // Actions
  setTransactionModalOpen: (open: boolean, defaultType?: TransactionType) => void;
  setActiveTransactionType: (type: TransactionType) => void;
  setSelectedAccountId: (accountId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isTransactionModalOpen: false,
  activeTransactionType: "expense",
  selectedAccountId: null,

  setTransactionModalOpen: (open, defaultType) =>
    set((state) => ({
      isTransactionModalOpen: open,
      activeTransactionType: defaultType ?? state.activeTransactionType,
    })),
  setActiveTransactionType: (type) => set({ activeTransactionType: type }),
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),
}));
