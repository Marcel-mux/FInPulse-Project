export type AccountType =
  | "cash"
  | "bank"
  | "ewallet"
  | "investment"
  | "credit";

export type TransactionType = "income" | "expense" | "transfer";

export type AccountCategory = "REGULAR" | "PAYLATER";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountCategory?: AccountCategory;
  creditLimit?: number | null;
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
  paylaterAccounts?: Account[];
  allAccounts?: Account[];
  totalNetWorth: number;
  activeAccountsCount: number;
  totalPaylaterLimit?: number;
  totalPaylaterUsed?: number;
  totalPaylaterAvailable?: number;
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

export interface LiquidAccountDistribution {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  colorHex: string | null;
  icon: string | null;
  percentage: number;
}

export interface CreditPlatformBreakdown {
  id: string;
  name: string;
  creditLimit: number;
  remainingCredit: number;
  usedCredit: number;
  utilizationRate: number;
  dueDay: number;
  colorHex: string | null;
  icon: string | null;
  activeLoanCount: number;
}

export interface CreditFacilitySummary {
  totalCreditLimit: number;
  totalRemainingCredit: number;
  totalUsedCredit: number;
  creditUtilization: number;
  platforms: CreditPlatformBreakdown[];
}

export interface RealWealthSummary {
  totalActualBalance: number;
  totalRealIncome: number;
  totalRealExpense: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
  accountsDistribution: LiquidAccountDistribution[];
}

export interface NetWorthSummary {
  totalActualBalance: number;
  totalUsedCredit: number;
  netWorth: number;
  formula: string;
}

export interface AnalyticsResponse {
  timeRange: TimeRange;
  startDate: string;
  endDate: string;
  summary: AnalyticsSummary;
  realWealth: RealWealthSummary;
  creditFacility: CreditFacilitySummary;
  netWorth: NetWorthSummary;
  cashFlow: CashFlowDataPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  expenseTrend: ExpenseTrendPoint[];
  transactions: TransactionWithRelations[];
}

export type BillStatus = "paid" | "due_today" | "upcoming" | "overdue";

export interface BillWithRelations {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDay: number;
  autoDeduct: boolean;
  lastDeducted: string | null;
  accountId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    name: string;
    type: AccountType;
    accountCategory?: AccountCategory;
    creditLimit?: number | null;
    colorHex: string | null;
    icon: string | null;
    balance: number;
  };
  category: {
    id: string;
    name: string;
    type: string;
    colorHex: string | null;
    icon: string | null;
  };
  isPaidThisMonth: boolean;
  daysUntilDue: number;
  status: BillStatus;
}

export interface BillsResponse {
  bills: BillWithRelations[];
  totalMonthlyBills: number;
  paidCount: number;
  upcomingCount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
}

export type LoanStatus = "ACTIVE" | "COMPLETED";

export interface LoanWithRelations {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  tenor: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyTotal: number;
  dueDay: number;
  remainingMonths: number;
  status: LoanStatus;
  lastPaid: string | null;
  paylaterAccountId: string;
  sourceAccountId: string;
  disbursementAccountId?: string | null;
  createdAt: string;
  updatedAt: string;
  paylaterAccount: {
    id: string;
    name: string;
    accountCategory?: AccountCategory;
    creditLimit?: number | null;
    balance: number;
  };
  sourceAccount: {
    id: string;
    name: string;
    balance: number;
    type: AccountType;
  };
  disbursementAccount?: {
    id: string;
    name: string;
    balance: number;
    type: AccountType;
  } | null;
  isPaidThisMonth: boolean;
}

export interface LoansResponse {
  loans: LoanWithRelations[];
  totalActiveDebt: number;
  totalMonthlyInstallment: number;
  activeLoansCount: number;
}

export interface AppRelease {
  id: string;
  version: string;
  title: string;
  notes: string;
  releasedAt: string;
}

export interface AppReleaseResponse {
  release: AppRelease | null;
  shouldShow: boolean;
  lastSeenVersion: string;
}


