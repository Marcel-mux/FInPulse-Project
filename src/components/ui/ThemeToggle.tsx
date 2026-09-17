"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="hidden sm:block w-9 h-9 rounded-xl bg-slate-800 border border-white/[0.08]" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        const next = isDark ? "light" : "dark";
        console.log("ThemeToggle: toggled to", next);
        setTheme(next);
      }}
      className="hidden sm:flex relative p-2.5 rounded-xl bg-slate-800 dark:bg-slate-800 border border-white/[0.08] text-gray-300 hover:text-white hover:border-white/20 transition-all cursor-pointer items-center justify-center"
      aria-label={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
      title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
    >
      <span
        className="block transition-transform duration-300"
        style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
      >
        {isDark ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </span>
    </button>
  );
}

/** Mobile variant — full-width row inside the drawer */
export function ThemeToggleMobile() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        const next = isDark ? "light" : "dark";
        console.log("ThemeToggleMobile: toggled to", next);
        setTheme(next);
      }}
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all w-full text-left cursor-pointer"
      aria-label={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
    >
      <span
        className="block transition-transform duration-300"
        style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
        )}
      </span>
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
