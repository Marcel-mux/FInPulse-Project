import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AccountsResponse,
  Category,
  TransactionWithRelations,
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
      type?: string;
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
    },
  });
}

