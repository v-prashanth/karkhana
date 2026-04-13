"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
  }, [theme]);

  return <>{children}</>;
}
