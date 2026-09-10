import { useQuery } from "@tanstack/react-query";
import { AccountsResponse, TransactionWithRelations } from "@/types";

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
