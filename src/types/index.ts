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
  estimatedDaysRemaining: number | null;
  isWarning: boolean;
  isExceeded: boolean;
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

export type TimeRange = "7d" | "30d" | "3m" | "ytd" | "custom";

export interface CashFlowDataPoint {
  date: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdownPoint {
  categoryId: string;
  name: string;
  color: string;
  value: number; // nominal amount
  percentage: number;
  icon?: string | null;
  count: number;
}

export interface ExpenseTrendPoint {
  date: string;
  label: string;
  amount: number;
}

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
}

export interface AnalyticsResponse {
  timeRange: TimeRange;
  startDate: string;
  endDate: string;
  summary: AnalyticsSummary;
  cashFlow: CashFlowDataPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  expenseTrend: ExpenseTrendPoint[];
  transactions: TransactionWithRelations[];
}
