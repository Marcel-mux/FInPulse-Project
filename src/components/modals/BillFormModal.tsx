"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Landmark,
  Receipt,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import {
  useAccounts,
  useCategories,
  useCreateBill,
  useDeleteBill,
  useUpdateBill,
} from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/formatters";
import { Account } from "@/types";

const QUICK_AMOUNTS = [
  { label: "+100rb", val: 100_000 },
  { label: "+250rb", val: 250_000 },
  { label: "+500rb", val: 500_000 },
  { label: "+1 Jt", val: 1_000_000 },
];

export function BillFormModal() {
  const { isBillModalOpen, editingBill, closeBillForm } = useAppStore();

  const { data: accountsData } = useAccounts();
  const { data: categoriesData } = useCategories("expense");

  const accounts: Account[] = useMemo(
    () => accountsData?.allAccounts || accountsData?.accounts || [],
    [accountsData]
  );
  const regularAccounts = useMemo(
    () => accounts.filter((a) => a.accountCategory !== "PAYLATER"),
    [accounts]
  );
  const paylaterAccounts = useMemo(
    () => accounts.filter((a) => a.accountCategory === "PAYLATER"),
    [accounts]
  );
  const categories = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData]
  );

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [autoDeduct, setAutoDeduct] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createBillMutation = useCreateBill();
  const updateBillMutation = useUpdateBill();
  const deleteBillMutation = useDeleteBill();

  useEffect(() => {
    if (editingBill) {
      setName(editingBill.name);
      setAmount(String(editingBill.amount));
      setDueDay(String(editingBill.dueDay));
      setAccountId(editingBill.accountId);
      setCategoryId(editingBill.categoryId);
      setAutoDeduct(editingBill.autoDeduct);
    } else {
      setName("");
      setAmount("");
      setDueDay("10");
      setAccountId(accounts[0]?.id || "");
      setCategoryId(categories[0]?.id || "");
      setAutoDeduct(true);
    }
    setError(null);
  }, [editingBill, isBillModalOpen, accounts, categories]);

  const handleQuickAdd = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama tagihan wajib diisi.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Nominal tagihan harus berupa angka lebih besar dari 0.");
      return;
    }

    const parsedDueDay = parseInt(dueDay, 10);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      setError("Tanggal jatuh tempo harus antara 1 sampai 31.");
      return;
    }

    if (!accountId) {
      setError("Pilih rekening sumber untuk autodebet.");
      return;
    }

    if (!categoryId) {
      setError("Pilih kategori pengeluaran untuk tagihan ini.");
      return;
    }

    try {
      if (editingBill) {
        await updateBillMutation.mutateAsync({
          id: editingBill.id,
          name: name.trim(),
          amount: parsedAmount,
          dueDay: parsedDueDay,
          accountId,
          categoryId,
          autoDeduct,
        });
      } else {
        await createBillMutation.mutateAsync({
          name: name.trim(),
          amount: parsedAmount,
          dueDay: parsedDueDay,
          accountId,
          categoryId,
          autoDeduct,
        });
      }
      closeBillForm();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan data tagihan"
      );
    }
  };

  const handleDelete = async () => {
    if (!editingBill) return;
    if (confirm(`Apakah Anda yakin ingin menghapus tagihan "${editingBill.name}"?`)) {
      try {
        await deleteBillMutation.mutateAsync(editingBill.id);
        closeBillForm();
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Gagal menghapus tagihan"
        );
      }
    }
  };

  const isPending =
    createBillMutation.isPending ||
    updateBillMutation.isPending ||
    deleteBillMutation.isPending;

  return (
    <Modal
      isOpen={isBillModalOpen}
      onClose={closeBillForm}
      title={editingBill ? "Edit Tagihan Rutin" : "Tambah Tagihan Baru"}
      description="Atur jadwal pembayaran tagihan rutin, cicilan, atau langganan otomatis."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {error && (
          <div className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs">
            {error}
          </div>
        )}

        {/* Nama Tagihan */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Nama Tagihan / Langganan:
          </label>
          <div className="relative">
            <Receipt className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: PayLater Shopee, WiFi Indihome, Netflix"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* Nominal Tagihan */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-300">
              Nominal Tagihan (IDR):
            </label>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {formatCurrency(parseFloat(amount) || 0)}
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
              Rp
            </span>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono font-bold"
            />
          </div>

          {/* Quick Nominal Buttons */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            {QUICK_AMOUNTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickAdd(item.val)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] font-semibold text-gray-300 transition-colors shrink-0 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tanggal Jatuh Tempo */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-300">
              Tanggal Jatuh Tempo:
            </label>
            <span className="text-[11px] text-gray-400">
              Setiap tanggal <strong className="text-white">{dueDay}</strong> per bulan
            </span>
          </div>
          <div className="relative">
            <Calendar className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="1 - 31"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* Rekening Sumber & Kategori (Grid 2 Kolom) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Rekening Sumber */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Rekening Sumber:
            </label>
            <div className="relative">
              <Landmark className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
              >
                {regularAccounts.length > 0 && (
                  <optgroup label="Rekening & Dompet Reguler" className="bg-charcoal-950 font-bold text-gray-400">
                    {regularAccounts.map((acc) => {
                      const typeLabel =
                        acc.type === "bank"
                          ? "Rekening Bank"
                          : acc.type === "cash"
                          ? "Kas Tunai"
                          : acc.type === "ewallet"
                          ? "E-Wallet"
                          : acc.type === "investment"
                          ? "Investasi"
                          : "Kredit";
                      return (
                        <option key={acc.id} value={acc.id} className="bg-charcoal-950 text-white font-normal">
                          {acc.name} ({typeLabel}) - Saldo: {formatCurrency(acc.balance)}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                {paylaterAccounts.length > 0 && (
                  <optgroup label="Fasilitas Paylater & Limit Kredit" className="bg-charcoal-950 font-bold text-orange-400">
                    {paylaterAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-charcoal-950 text-orange-300 font-normal">
                        {acc.name} (Paylater) - Sisa Limit: {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            {(() => {
              const selected = accounts.find((a) => a.id === accountId);
              if (selected?.accountCategory === "PAYLATER") {
                return (
                  <span className="text-[10px] text-orange-400 mt-1 flex items-center gap-1 font-medium">
                    <Zap className="w-3 h-3 text-orange-400 shrink-0" />
                    <span>Diproses via Paylater (Sisa Limit: {formatCurrency(selected.balance)})</span>
                  </span>
                );
              }
              if (selected) {
                return (
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Saldo tersedia: {formatCurrency(selected.balance)}
                  </span>
                );
              }
              return null;
            })()}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Kategori:
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-charcoal-950">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Toggle Switch Autodebet */}
        <div className="p-3.5 rounded-xl bg-charcoal-900/60 border border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`p-2 rounded-lg mt-0.5 ${
                autoDeduct ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-gray-400"
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Autodebet Otomatis</span>
                {autoDeduct && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Vercel Cron
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {autoDeduct
                  ? "Saldo rekening akan dipotong otomatis dan transaksi dicatat pada tanggal jatuh tempo."
                  : "Hanya mengirim pengingat via WhatsApp tanpa memotong saldo otomatis."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoDeduct}
              onChange={(e) => setAutoDeduct(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-charcoal-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 border border-white/10" />
          </label>
        </div>

        {/* Tombol Simpan & Hapus */}
        <div className="flex items-center justify-between pt-2">
          {editingBill ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="p-2.5 rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-400 border border-crimson-500/20 text-xs font-semibold transition-all cursor-pointer"
              title="Hapus Tagihan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeBillForm}
              className="py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 text-xs font-bold transition-all shadow-glow-emerald disabled:opacity-50 cursor-pointer"
            >
              {isPending
                ? "Menyimpan..."
                : editingBill
                ? "Simpan Perubahan"
                : "Tambah Tagihan"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
