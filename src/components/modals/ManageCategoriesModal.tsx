"use client";

import { useState } from "react";
import {
  Briefcase,
  Car,
  Cigarette,
  CircleDollarSign,
  Coffee,
  Coins,
  DollarSign,
  Edit2,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  Plus,
  Receipt,
  ShoppingBag,
  Smartphone,
  Trash2,
  TrendingUp,
  Utensils,
  Wifi,
  Wrench,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useCategories, useDeleteCategory } from "@/hooks/useFinance";
import { Category } from "@/types";

const CATEGORY_ICON_MAP: Record<string, typeof CircleDollarSign> = {
  Briefcase,
  Gift,
  TrendingUp,
  Laptop,
  PiggyBank,
  Coins,
  DollarSign,
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  HeartPulse,
  GraduationCap,
  Coffee,
  Cigarette,
  Wifi,
  Home,
  Plane,
  Smartphone,
  Gamepad2,
  Wrench,
};

export function ManageCategoriesModal() {
  const {
    isManageCategoriesOpen,
    setManageCategoriesOpen,
    openCategoryForm,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const { data, isLoading } = useCategories(activeTab);
  const deleteCategoryMutation = useDeleteCategory();

  const categories = data?.categories || [];

  const handleDelete = async (category: Category) => {
    if (confirm(`Apakah kamu yakin ingin menghapus kategori "${category.name}"?`)) {
      try {
        await deleteCategoryMutation.mutateAsync(category.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menghapus kategori");
      }
    }
  };

  return (
    <Modal
      isOpen={isManageCategoriesOpen}
      onClose={() => setManageCategoriesOpen(false)}
      title="Kelola Kategori Anggaran"
      description="Atur kategori pengeluaran dan pemasukan untuk laporan keuangan yang terstruktur."
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Tab Switcher & Add Button */}
        <div className="flex items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex items-center p-1 rounded-xl bg-charcoal-900 border border-white/[0.08]">
            <button
              onClick={() => setActiveTab("expense")}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "expense"
                  ? "bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setActiveTab("income")}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "income"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pemasukan
            </button>
          </div>

          <button
            onClick={() => openCategoryForm(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kategori Baru</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full h-14 rounded-2xl bg-charcoal-900/60 border border-white/[0.06] animate-pulse"
              />
            ))
          ) : categories.length === 0 ? (
            <div className="col-span-full text-center py-8 text-xs text-gray-400 border border-dashed border-white/10 rounded-2xl">
              Belum ada kategori untuk tipe ini.
            </div>
          ) : (
            categories.map((cat) => {
              const IconComp =
                (cat.icon && CATEGORY_ICON_MAP[cat.icon]) || CircleDollarSign;
              const color = cat.colorHex || "#10B981";

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-2xl glass-surface border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                      }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openCategoryForm(cat)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
                      title="Edit Kategori"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={deleteCategoryMutation.isPending}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-400 border border-crimson-500/20 transition-colors cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
