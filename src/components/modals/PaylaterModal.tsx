"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Trash2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "@/hooks/useFinance";
import { useAppStore } from "@/store/useAppStore";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import confetti from "canvas-confetti";

const POPULAR_PROVIDERS = [
  { name: "SPayLater", colorHex: "#EE4D2D", defaultLimit: 5_000_000 },
  { name: "GoPay Later", colorHex: "#00AA13", defaultLimit: 3_000_000 },
  { name: "Kredivo", colorHex: "#0077C8", defaultLimit: 10_000_000 },
  { name: "Akulaku", colorHex: "#E60012", defaultLimit: 6_000_000 },
  { name: "Indodana", colorHex: "#00B4D8", defaultLimit: 5_000_000 },
  { name: "Lainnya", colorHex: "#8B5CF6", defaultLimit: 3_000_000 },
];

const PAYLATER_QUICK_LIMITS = [
  { label: "+1 Jt", val: 1_000_000 },
  { label: "+2 Jt", val: 2_000_000 },
  { label: "+5 Jt", val: 5_000_000 },
  { label: "+10 Jt", val: 10_000_000 },
];

export function PaylaterModal() {
  const { isPaylaterModalOpen, editingPaylaterAccount, closePaylaterModal } =
    useAppStore();

  const [providerName, setProviderName] = useState("");
  const [creditLimit, setCreditLimit] = useState<number>(5_000_000);
  const [balance, setBalance] = useState<number>(5_000_000);
  const [colorHex, setColorHex] = useState("#EE4D2D");
  const [dueDay, setDueDay] = useState("25");
  const [error, setError] = useState<string | null>(null);

  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();

  const isEditing = !!editingPaylaterAccount;

  useEffect(() => {
    if (isPaylaterModalOpen) {
      setError(null);
      if (editingPaylaterAccount) {
        setProviderName(editingPaylaterAccount.name);
        setCreditLimit(
          editingPaylaterAccount.creditLimit ?? editingPaylaterAccount.balance ?? 0
        );
        setBalance(editingPaylaterAccount.balance ?? 0);
        setColorHex(editingPaylaterAccount.colorHex || "#EE4D2D");
        setDueDay("25");
      } else {
        setProviderName("SPayLater");
        setCreditLimit(5_000_000);
        setBalance(5_000_000);
        setColorHex("#EE4D2D");
        setDueDay("25");
      }
    }
  }, [isPaylaterModalOpen, editingPaylaterAccount]);

  if (!isPaylaterModalOpen) return null;

  const handleSelectPreset = (preset: (typeof POPULAR_PROVIDERS)[number]) => {
    if (preset.name === "Lainnya") {
      setProviderName("");
    } else {
      setProviderName(preset.name);
    }
    setColorHex(preset.colorHex);
    if (!isEditing) {
      setCreditLimit(preset.defaultLimit);
      setBalance(preset.defaultLimit);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = providerName.trim();
    if (!cleanName) {
      setError("Nama Provider Paylater wajib diisi.");
      return;
    }

    if (creditLimit <= 0) {
      setError("Total Plafon Limit Kredit harus lebih dari 0.");
      return;
    }

    if (balance > creditLimit) {
      setError("Sisa limit tidak boleh melebihi total plafon limit kredit.");
      return;
    }

    try {
      if (isEditing && editingPaylaterAccount) {
        await updateAccountMutation.mutateAsync({
          id: editingPaylaterAccount.id,
          name: cleanName,
          type: "credit",
          accountCategory: "PAYLATER",
          creditLimit,
          balance,
          colorHex,
          icon: "credit-card",
        });
      } else {
        await createAccountMutation.mutateAsync({
          name: cleanName,
          type: "credit",
          accountCategory: "PAYLATER",
          creditLimit,
          balance,
          colorHex,
          icon: "credit-card",
        });
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      closePaylaterModal();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan akun paylater."
      );
    }
  };

  const handleDelete = async () => {
    if (!editingPaylaterAccount) return;
    if (
      confirm(
        `Yakin ingin menghapus fasilitas Paylater "${editingPaylaterAccount.name}"?`
      )
    ) {
      try {
        await deleteAccountMutation.mutateAsync(editingPaylaterAccount.id);
        closePaylaterModal();
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Gagal menghapus akun paylater."
        );
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-charcoal-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/25">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isEditing
                    ? `Kelola ${editingPaylaterAccount.name}`
                    : "Kelola Paylater / Limit & Kredit"}
                </h3>
                <p className="text-[11px] text-gray-400">
                  Plafon kredit terisolasi dari kas riil
                </p>
              </div>
            </div>
            <button
              onClick={closePaylaterModal}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content Body - Langsung menampilkan formulir Plafon & Limit secara permanen */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="flex flex-col gap-4">
              {/* 1. Pilihan Cepat Provider */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Pilihan Cepat Provider:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {POPULAR_PROVIDERS.map((preset) => {
                    const isSelected = providerName === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-orange-500/20 border-orange-500 text-orange-400"
                            : "bg-charcoal-800/60 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: preset.colorHex }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Input Nama Provider Paylater */}
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  Nama Provider Paylater
                </label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="Contoh: SPayLater, GoPay Later"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>

              {/* 3. Input Total Plafon Limit Kredit (Pemberian Provider) */}
              <CurrencyInput
                label="Total Plafon Limit Kredit (Pemberian Provider)"
                value={creditLimit}
                onChange={(val) => {
                  setCreditLimit(val);
                  if (!isEditing) setBalance(val);
                }}
                placeholder="Contoh: 5.000.000"
                accentColor="orange"
                quickAmounts={PAYLATER_QUICK_LIMITS}
                helperText="Plafon maksimal pinjaman kredit yang diberikan provider."
                required
              />

              {/* 4. Input Sisa Limit Saat Ini (Belum Digunakan) */}
              <CurrencyInput
                label="Sisa Limit Saat Ini (Belum Digunakan)"
                value={balance}
                onChange={(val) => setBalance(val)}
                placeholder="Contoh: 3.500.000"
                accentColor="emerald"
                helperText="Sisa limit yang masih dapat digunakan untuk belanja."
                required
              />

              {/* 5. Input Tanggal Jatuh Tempo Tagihan Bulanan (1-31) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tanggal Jatuh Tempo Tagihan Bulanan (1-31)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="25"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="text-[10px] text-gray-400">
                  Tanggal rutin penagihan tagihan bulanan dari provider.
                </span>
              </div>

              {/* 6. Tombol Aksi Bawah: Hapus, Batal, Simpan Perubahan */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10 mt-1">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteAccountMutation.isPending}
                    className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closePaylaterModal}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createAccountMutation.isPending ||
                      updateAccountMutation.isPending
                    }
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-charcoal-950 text-xs font-bold transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {createAccountMutation.isPending ||
                    updateAccountMutation.isPending
                      ? "Menyimpan..."
                      : isEditing
                      ? "Simpan Perubahan"
                      : "Daftarkan Paylater"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
