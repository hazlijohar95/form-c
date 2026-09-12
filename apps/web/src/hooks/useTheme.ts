import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, resolveTheme, storeTheme } from "../lib/theme.js";
import type { ThemeMode } from "../lib/theme.js";

export function useTheme(): {
  theme: ThemeMode;
  resolvedTheme: "dark" | "light";
  setTheme: (m: ThemeMode) => void;
} {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => resolveTheme(getStoredTheme()));

  function setTheme(mode: ThemeMode): void {
    setThemeState(mode);
    storeTheme(mode);
    setResolvedTheme(applyTheme(mode));
  }

  useEffect(() => {
    setResolvedTheme(applyTheme(theme));
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (): void => setResolvedTheme(applyTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, resolvedTheme, setTheme };
}
