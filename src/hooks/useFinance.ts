import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AccountsResponse,
  AnalyticsResponse,
  BillsResponse,
  BudgetsResponse,
  Category,
  LoansResponse,
  TransactionWithRelations,
  AppReleaseResponse,
} from "@/types";

// ========================
// QUERIES
// ========================

export function useAccounts() {
  return useQuery<AccountsResponse>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) {
        throw new Error("Gagal mengambil data akun");
      }
      return res.json();
    },
  });
}

export function useRecentTransactions(limit: number = 10) {
  return useQuery<{ transactions: TransactionWithRelations[] }>({
    queryKey: ["transactions", "recent", limit],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?limit=${limit}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil transaksi terbaru");
      }
      return res.json();
    },
  });
}

export function useAccountTransactions(
  accountId?: string | null,
  limit: number = 50
) {
  return useQuery<{ transactions: TransactionWithRelations[] }>({
    queryKey: ["transactions", "account", accountId || "none", limit],
    queryFn: async () => {
      if (!accountId) return { transactions: [] };
      const res = await fetch(
        `/api/transactions?accountId=${accountId}&limit=${limit}`
      );
      if (!res.ok) {
        throw new Error("Gagal mengambil riwayat transaksi akun");
      }
      return res.json();
    },
    enabled: Boolean(accountId),
  });
}

export function useCategories(type?: "income" | "expense") {
  return useQuery<{ categories: Category[] }>({
    queryKey: ["categories", type || "all"],
    queryFn: async () => {
      const url = type ? `/api/categories?type=${type}` : "/api/categories";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal mengambil data kategori");
      }
      return res.json();
    },
  });
}

export function useBudgets(month?: number, year?: number) {
  const queryParams = new URLSearchParams();
  if (month) queryParams.set("month", String(month));
  if (year) queryParams.set("year", String(year));

  const queryStr = queryParams.toString();
  const url = queryStr ? `/api/budgets?${queryStr}` : "/api/budgets";

  return useQuery<BudgetsResponse>({
    queryKey: ["budgets", month || "current", year || "current"],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal mengambil data anggaran");
      }
      return res.json();
    },
  });
}

export function useAnalytics(
  range: string = "30d",
  customStart?: string,
  customEnd?: string
) {
  const queryParams = new URLSearchParams();
  queryParams.set("range", range);
  if (customStart) queryParams.set("startDate", customStart);
  if (customEnd) queryParams.set("endDate", customEnd);

  const queryStr = queryParams.toString();
  const url = `/api/analytics?${queryStr}`;

  return useQuery<AnalyticsResponse>({
    queryKey: ["analytics", range, customStart || "", customEnd || ""],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal memuat data analitik keuangan");
      }
      return res.json();
    },
  });
}

export function useBills() {
  return useQuery<BillsResponse>({
    queryKey: ["bills"],
    queryFn: async () => {
      const res = await fetch("/api/bills");
      if (!res.ok) {
        throw new Error("Gagal memuat data tagihan & autodebet");
      }
      return res.json();
    },
  });
}

export function useLoans() {
  return useQuery<LoansResponse>({
    queryKey: ["loans"],
    queryFn: async () => {
      const res = await fetch("/api/loans");
      if (!res.ok) {
        throw new Error("Gagal memuat data pinjaman & cicilan");
      }
      return res.json();
    },
  });
}

// ========================
// MUTATIONS - ACCOUNTS
// ========================

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: string;
      balance: number;
      accountCategory?: string;
      creditLimit?: number | null;
      colorHex?: string;
      icon?: string;
    }) => {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat akun");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      balance?: number;
      type?: string;
      accountCategory?: string;
      creditLimit?: number | null;
      colorHex?: string;
      icon?: string;
      isActive?: boolean;
    }) => {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui akun");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus akun");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useReconcileAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      actualBalance,
      note,
    }: {
      id: string;
      actualBalance: number;
      note?: string;
    }) => {
      const res = await fetch(`/api/accounts/${id}/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualBalance, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal melakukan rekonsiliasi");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// ========================
// MUTATIONS - CATEGORIES
// ========================

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: "income" | "expense";
      icon?: string;
      colorHex?: string;
    }) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat kategori");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      type?: "income" | "expense";
      icon?: string;
      colorHex?: string;
    }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui kategori");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus kategori");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ========================
// MUTATIONS - TRANSACTIONS
// ========================

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: "income" | "expense" | "transfer";
      amount: number;
      accountId: string;
      toAccountId?: string;
      categoryId?: string;
      adminFee?: number;
      date?: string;
      description?: string;
      tags?: string;
      isRecurring?: boolean;
    }) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mencatat transaksi");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// ========================
// MUTATIONS - BUDGETS
// ========================

export function useUpsertBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      categoryId: string;
      amountLimit: number;
      periodMonth?: number;
      periodYear?: number;
    }) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengatur anggaran");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus anggaran");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

// ========================
// MUTATIONS - BILLS & AUTODEBET
// ========================

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      amount: number;
      dueDay: number;
      accountId: string;
      categoryId: string;
      autoDeduct?: boolean;
    }) => {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambahkan tagihan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      amount?: number;
      dueDay?: number;
      accountId?: string;
      categoryId?: string;
      autoDeduct?: boolean;
      resetDeducted?: boolean;
    }) => {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui tagihan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bills/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus tagihan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function usePayBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bills/${id}/pay`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membayar tagihan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// ========================
// MUTATIONS - LOANS & INSTALLMENTS
// ========================

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      totalAmount: number;
      tenor: number;
      dueDay: number;
      paylaterAccountId: string;
      sourceAccountId: string;
      disbursementAccountId?: string;
      monthlyTotal?: number;
      loanType?: "CASH_LOAN" | "PAYLATER_PURCHASE";
    }) => {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat pinjaman / cicilan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export interface PayLoanPayload {
  id: string;
  sourceAccountId?: string;
  amount?: number;
}

export function usePayLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PayLoanPayload | string) => {
      const loanId = typeof payload === "string" ? payload : payload.id;
      const body =
        typeof payload === "string"
          ? {}
          : {
              sourceAccountId: payload.sourceAccountId,
              amount: payload.amount,
            };

      const res = await fetch(`/api/loans/${loanId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membayar cicilan pinjaman");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/loans/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus pinjaman");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export interface ResetDataPayload {
  confirmation: string;
  scope: "ALL" | "MONTHLY" | "DAILY";
  date?: string;
  monthYear?: string;
}

export function useResetAllData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ResetDataPayload | string) => {
      const body =
        typeof payload === "string"
          ? { confirmation: payload, scope: "ALL" }
          : payload;

      const res = await fetch("/api/user/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal mereset data keuangan");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all cached data to refresh accounts, transactions, budgets, bills, loans, etc.
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries();
    },
  });
}

export function useAppRelease() {
  return useQuery<AppReleaseResponse>({
    queryKey: ["app-release"],
    queryFn: async () => {
      const res = await fetch("/api/app-release");
      if (!res.ok) {
        throw new Error("Gagal memeriksa versi aplikasi");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // 15 menit
  });
}

export function useAcknowledgeRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (version: string) => {
      const res = await fetch("/api/app-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        throw new Error("Gagal mengonfirmasi versi aplikasi");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-release"] });
    },
  });
}




