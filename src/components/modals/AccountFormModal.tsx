"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Building,
  Coins,
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useCreateAccount, useUpdateAccount } from "@/hooks/useFinance";
import { AccountType } from "@/types";

const ACCOUNT_TYPES: { type: AccountType; label: string; desc: string }[] = [
  { type: "bank", label: "Bank", desc: "Rekening tabungan atau giro" },
  { type: "cash", label: "Kas Tunai", desc: "Uang tunai fisik di dompet" },
  { type: "ewallet", label: "E-Wallet", desc: "GoPay, OVO, Dana, ShopeePay" },
  { type: "investment", label: "Investasi", desc: "Reksadana, Saham, Kripto" },
  { type: "credit", label: "Kredit / PayLater", desc: "Kartu kredit / tagihan utang" },
];

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Crimson
];

const AVAILABLE_ICONS = [
  { name: "Landmark", component: Landmark },
  { name: "Banknote", component: Banknote },
  { name: "Wallet", component: Wallet },
  { name: "CreditCard", component: CreditCard },
  { name: "TrendingUp", component: TrendingUp },
  { name: "PiggyBank", component: PiggyBank },
  { name: "Coins", component: Coins },
  { name: "Building", component: Building },
];

export function AccountFormModal() {
  const { isAccountFormOpen, editingAccount, closeAccountForm } = useAppStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("");
  const [colorHex, setColorHex] = useState("#3B82F6");
  const [icon, setIcon] = useState("Landmark");
  const [error, setError] = useState<string | null>(null);

  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setBalance(String(editingAccount.balance));
      setColorHex(editingAccount.colorHex || "#3B82F6");
      setIcon(editingAccount.icon || "Landmark");
    } else {
      setName("");
      setType("bank");
      setBalance("");
      setColorHex("#3B82F6");
      setIcon("Landmark");
    }
    setError(null);
  }, [editingAccount, isAccountFormOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama dompet / akun tidak boleh kosong");
      return;
    }

    try {
      if (editingAccount) {
        await updateAccountMutation.mutateAsync({
          id: editingAccount.id,
          name: name.trim(),
          type,
          colorHex,
          icon,
        });
      } else {
        const numBalance = parseFloat(balance) || 0;
        await createAccountMutation.mutateAsync({
          name: name.trim(),
          type,
          balance: numBalance,
          colorHex,
          icon,
        });
      }
      closeAccountForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const isPending =
    createAccountMutation.isPending || updateAccountMutation.isPending;

  return (
    <Modal
      isOpen={isAccountFormOpen}
      onClose={closeAccountForm}
      title={editingAccount ? "Edit Akun / Dompet" : "Tambah Akun / Dompet Baru"}
      description="Kelola informasi rekening bank, e-wallet, atau kas fisik kamu."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {error && (
          <div className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-xs text-crimson-400">
            {error}
          </div>
        )}

        {/* Name Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Nama Akun / Dompet
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: BCA Prioritas, GoPay Utama, Kas Tunai"
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            required
          />
        </div>

        {/* Account Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Tipe Akun
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setType(t.type)}
                className={`p-2.5 rounded-xl text-left border text-xs transition-all flex flex-col gap-0.5 ${
                  type === t.type
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-glow-emerald"
                    : "bg-charcoal-900/60 border-white/[0.06] text-gray-400 hover:text-white hover:border-white/15"
                }`}
              >
                <span className="font-bold">{t.label}</span>
                <span className="text-[10px] text-gray-400 opacity-80 leading-tight">
                  {t.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Initial Balance (only for new account) */}
        {!editingAccount ? (
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Saldo Awal (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400">
            💡 Untuk mengubah saldo akun yang sudah aktif, gunakan fitur{" "}
            <span className="text-emerald-400 font-semibold">
              Rekonsiliasi Saldo
            </span>{" "}
            agar mutasi audit keuangan tetap tercatat rapi.
          </div>
        )}

        {/* Icon Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Ikon Representatif
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ICONS.map((item) => {
              const IconComp = item.component;
              const isSelected = icon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                    isSelected
                      ? "bg-white/10 border-white text-white shadow-sm"
                      : "bg-charcoal-900/60 border-white/[0.06] text-gray-400 hover:text-white"
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette Picker */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Warna Tema Akun
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorHex(c)}
                className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${
                  colorHex === c
                    ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-charcoal-950"
                    : "hover:scale-105 opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-8 h-8 rounded-full bg-transparent border-0 cursor-pointer"
              title="Pilih warna kustom"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08] mt-2">
          <button
            type="button"
            onClick={closeAccountForm}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-charcoal-950 text-xs font-bold shadow-glow-emerald hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending
              ? "Menyimpan..."
              : editingAccount
              ? "Simpan Perubahan"
              : "Buat Akun"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
