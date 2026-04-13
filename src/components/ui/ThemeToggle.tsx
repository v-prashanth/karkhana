"use client";

import { Moon, SunMedium } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        type="button"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        onClick={toggleTheme}
        className="flex h-10 w-10 items-center justify-center rounded-full glass transition-transform hover:-translate-y-0.5"
      >
        {isDark ? <SunMedium className="h-4.5 w-4.5 text-warning" /> : <Moon className="h-4.5 w-4.5 text-slate-500" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      className="group inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/70 px-3 py-2 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all hover:-translate-y-0.5"
    >
      <div className="relative h-7 w-14 rounded-full bg-gradient-to-r from-amber-100 via-orange-100 to-slate-200 p-1 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 dark:bg-slate-950",
            isDark ? "translate-x-7" : "translate-x-0"
          )}
        >
          {isDark ? <Moon className="h-3 w-3 text-slate-300" /> : <SunMedium className="h-3 w-3 text-amber-500" />}
        </div>
      </div>
      <div className="text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Theme</p>
        <p className="text-sm font-medium text-foreground">{isDark ? "Dark mode" : "Light mode"}</p>
      </div>
    </button>
  );
}
