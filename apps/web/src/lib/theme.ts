// Theme mode — OpenCode parity: explicit system|dark|light, persisted,
// FOUC-free init in index.html, live follow of OS while on system.
export type ThemeMode = "dark" | "light" | "system";

const KEY = "formc-theme";

export function getStoredTheme(): ThemeMode {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "dark" || v === "light" || v === "system") return v;
  } catch {
    /* private mode — fall through */
  }
  return "dark";
}

export function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Apply to <html> + keep theme-color in sync. Returns the resolved mode. */
export function applyTheme(mode: ThemeMode): "dark" | "light" {
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#101010" : "#f6f6f6");
  return resolved;
}

export function storeTheme(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    /* private mode — theme just won't persist */
  }
}
