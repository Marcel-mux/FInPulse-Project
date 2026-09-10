"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Car,
  Coffee,
  Coins,
  DollarSign,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Utensils,
  Wrench,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useFinance";

const AVAILABLE_ICONS = [
  { name: "Briefcase", comp: Briefcase },
  { name: "Gift", comp: Gift },
  { name: "TrendingUp", comp: TrendingUp },
  { name: "Laptop", comp: Laptop },
  { name: "PiggyBank", comp: PiggyBank },
  { name: "Coins", comp: Coins },
  { name: "DollarSign", comp: DollarSign },
  { name: "Utensils", comp: Utensils },
  { name: "Car", comp: Car },
  { name: "Film", comp: Film },
  { name: "ShoppingBag", comp: ShoppingBag },
  { name: "Receipt", comp: Receipt },
  { name: "HeartPulse", comp: HeartPulse },
  { name: "GraduationCap", comp: GraduationCap },
  { name: "Coffee", comp: Coffee },
  { name: "Home", comp: Home },
  { name: "Plane", comp: Plane },
  { name: "Smartphone", comp: Smartphone },
  { name: "Gamepad2", comp: Gamepad2 },
  { name: "Wrench", comp: Wrench },
];

const PRESET_COLORS = [
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Crimson
  "#14B8A6", // Teal
  "#84CC16", // Lime
];

export function CategoryFormModal() {
  const { isCategoryFormOpen, editingCategory, closeCategoryForm } =
    useAppStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("Utensils");
  const [colorHex, setColorHex] = useState("#F59E0B");
  const [error, setError] = useState<string | null>(null);

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setIcon(editingCategory.icon || "Utensils");
      setColorHex(editingCategory.colorHex || "#F59E0B");
    } else {
      setName("");
      setType("expense");
      setIcon("Utensils");
      setColorHex("#F59E0B");
    }
    setError(null);
  }, [editingCategory, isCategoryFormOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama kategori wajib diisi");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          name: name.trim(),
          type,
          icon,
          colorHex,
        });
      } else {
        await createCategoryMutation.mutateAsync({
          name: name.trim(),
          type,
          icon,
          colorHex,
        });
      }
      closeCategoryForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const isPending =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Modal
      isOpen={isCategoryFormOpen}
      onClose={closeCategoryForm}
      title={editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
      description="Kelola kategori pemasukan atau pengeluaran untuk budgeting dan analitik."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {error && (
          <div className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-xs text-crimson-400">
            {error}
          </div>
        )}

        {/* Category Type Switcher */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Tipe Aliran Dana
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                if (!editingCategory) setColorHex("#F59E0B");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                type === "expense"
                  ? "bg-crimson-500/15 border-crimson-500/50 text-crimson-400 shadow-glow-crimson"
                  : "bg-charcoal-900/60 border-white/[0.06] text-gray-400 hover:text-white"
              }`}
            >
              Pengeluaran (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                if (!editingCategory) setColorHex("#10B981");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                type === "income"
                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-glow-emerald"
                  : "bg-charcoal-900/60 border-white/[0.06] text-gray-400 hover:text-white"
              }`}
            >
              Pemasukan (Income)
            </button>
          </div>
        </div>

        {/* Category Name Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Nama Kategori
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Kopi Harian, Langganan SaaS, Investasi Saham"
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            required
          />
        </div>

        {/* Icon Grid Picker */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Pilih Ikon
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-40 overflow-y-auto p-1.5 rounded-xl bg-charcoal-900/70 border border-white/[0.06]">
            {AVAILABLE_ICONS.map((item) => {
              const Comp = item.comp;
              const isSelected = icon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`h-10 rounded-xl flex items-center justify-center border transition-all ${
                    isSelected
                      ? "bg-white/15 border-white text-white shadow-sm scale-105"
                      : "bg-white/[0.02] border-transparent text-gray-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                  title={item.name}
                >
                  <Comp className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette Picker */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Warna Kategori
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorHex(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  colorHex === c
                    ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-charcoal-950"
                    : "hover:scale-110 opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-7 h-7 rounded-full bg-transparent border-0 cursor-pointer"
              title="Pilih warna kustom"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08] mt-2">
          <button
            type="button"
            onClick={closeCategoryForm}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-charcoal-950 text-xs font-bold shadow-glow-emerald hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending
              ? "Menyimpan..."
              : editingCategory
              ? "Simpan Perubahan"
              : "Buat Kategori"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
