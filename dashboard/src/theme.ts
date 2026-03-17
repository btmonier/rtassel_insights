export type Theme = "light" | "dark";

const STORAGE_KEY = "rtassel-insights-theme";

function getSystemPreference(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getTheme(): Theme {
  if (typeof localStorage === "undefined") return getSystemPreference();
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return getSystemPreference();
}

export function setTheme(theme: Theme): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  document.documentElement.classList.remove("theme-dark", "theme-light");
  document.documentElement.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

type ThemeChangeListener = (theme: Theme) => void;

export function addThemeChangeListener(listener: ThemeChangeListener): () => void {
  const handler = (e: CustomEvent<{ theme: Theme }>) => listener(e.detail.theme);
  window.addEventListener("themechange", handler as EventListener);
  return () => window.removeEventListener("themechange", handler as EventListener);
}

export function initTheme(): Theme {
  const theme = getTheme();
  document.documentElement.classList.remove("theme-dark", "theme-light");
  document.documentElement.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
  return theme;
}
