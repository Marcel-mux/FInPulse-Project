export type AccountType =
  | "cash"
  | "bank"
  | "ewallet"
  | "investment"
  | "credit";

export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  colorHex: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string | Date;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  colorHex: string | null;
  createdAt: string | Date;
}

export interface TransactionWithRelations {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string | null;
  tags: string | null;
  receiptUrl: string | null;
  isRecurring: boolean;
  createdAt: string;
  account: {
    id: string;
    name: string;
    type: AccountType;
    colorHex: string | null;
    icon: string | null;
  };
  toAccount?: {
    id: string;
    name: string;
    type: AccountType;
    colorHex: string | null;
    icon: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    type: string;
    icon: string | null;
    colorHex: string | null;
  } | null;
}

export interface AccountsResponse {
  accounts: Account[];
  totalNetWorth: number;
  activeAccountsCount: number;
}

export interface BudgetWithCategory {
  id: string;
  categoryId: string;
  amountLimit: number;
  periodMonth: number;
  periodYear: number;
  createdAt: string | Date;
  category: Category;
  totalSpent: number;
  remaining: number;
  percentage: number;
  dailyBurnRate: number;
  estimatedDaysRemaining: number | null; // null jika belum ada pengeluaran
  isWarning: boolean; // true jika estimasi habis sebelum akhir bulan
  isExceeded: boolean; // true jika pemakaian >= 100%
}

export interface BudgetsResponse {
  budgets: BudgetWithCategory[];
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  periodMonth: number;
  periodYear: number;
}
