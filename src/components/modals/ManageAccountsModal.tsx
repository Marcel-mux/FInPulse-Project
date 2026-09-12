"use client";

import { motion } from "framer-motion";
import {
  Banknote,
  CreditCard,
  Edit2,
  Eye,
  Landmark,
  Plus,
  Scale,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useAccounts, useDeleteAccount } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";
import { Account, AccountType } from "@/types";

const TYPE_ICONS: Record<AccountType, typeof Landmark> = {
  bank: Landmark,
  cash: Banknote,
  ewallet: Wallet,
  investment: TrendingUp,
  credit: CreditCard,
};

export function ManageAccountsModal() {
  const {
    isManageAccountsOpen,
    setManageAccountsOpen,
    openAccountForm,
    openAccountDetail,
    openReconciliation,
  } = useAppStore();

  const { data, isLoading } = useAccounts();
  const deleteAccountMutation = useDeleteAccount();

  const accounts = data?.accounts || [];

  const handleDelete = async (account: Account) => {
    if (
      confirm(
        `Apakah kamu yakin ingin menghapus akun "${account.name}"? Jika memiliki riwayat transaksi, akun akan dinonaktifkan.`
      )
    ) {
      try {
        await deleteAccountMutation.mutateAsync(account.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menghapus akun");
      }
    }
  };

  return (
    <Modal
      isOpen={isManageAccountsOpen}
      onClose={() => setManageAccountsOpen(false)}
      title="Kelola Akun & Rekonsiliasi Saldo"
      description="Atur rekening bank, e-wallet, dan lakukan sinkronisasi saldo aktual."
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Header Action */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400">
            Daftar Akun ({accounts.length})
          </span>
          <button
            onClick={() => openAccountForm(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Akun</span>
          </button>
        </div>

        {/* Accounts List */}
        <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full h-18 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse"
              />
            ))
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-white/10 rounded-2xl">
              Belum ada akun terdaftar.
            </div>
          ) : (
            accounts.map((acc) => {
              const IconComp = TYPE_ICONS[acc.type] || Landmark;
              const accentColor = acc.colorHex || "#10B981";

              return (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl glass-surface border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  {/* Account Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0"
                      style={{
                        backgroundColor: `${accentColor}20`,
                        color: accentColor,
                      }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {acc.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="capitalize">{acc.type}</span>
                        <span>•</span>
                        <span className="font-semibold text-white">
                          {formatCurrency(acc.balance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {/* Reconcile button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openReconciliation(acc)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
                      title="Rekonsiliasi Saldo"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rekonsiliasi</span>
                    </motion.button>

                    {/* Detail button */}
                    <button
                      onClick={() => {
                        setManageAccountsOpen(false);
                        openAccountDetail(acc);
                      }}
                      className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-emerald-400 border border-white/[0.06] transition-colors cursor-pointer"
                      title="Detail Saldo & Riwayat"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => openAccountForm(acc)}
                      className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
                      title="Edit Akun"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(acc)}
                      disabled={deleteAccountMutation.isPending}
                      className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-400 border border-crimson-500/20 transition-colors cursor-pointer"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
