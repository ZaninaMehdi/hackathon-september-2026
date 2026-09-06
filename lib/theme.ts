export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "amanah-theme";
export const THEME_PREFERENCES: ThemePreference[] = ["light", "dark", "system"];

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    // Storage throws in private browsing or when cookies are blocked.
  }
  return "system";
}

function resolvePreference(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function applyPreference(preference: ThemePreference): ResolvedTheme {
  const resolved = resolvePreference(preference);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  // Keeps native controls (scrollbars, date pickers) in step with the palette.
  root.style.colorScheme = resolved;
  return resolved;
}

/* An external store rather than component state, so every mounted toggle
   reflects the same preference and useSyncExternalStore can read it during
   render instead of syncing it in an effect. */

const listeners = new Set<() => void>();
let snapshot: ThemePreference | null = null;

function notify() {
  snapshot = null;
  listeners.forEach((listener) => listener());
}

export function subscribeToPreference(listener: () => void) {
  listeners.add(listener);
  // Fires when another tab writes the key.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      snapshot = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getPreferenceSnapshot(): ThemePreference {
  // Cached because useSyncExternalStore calls this on every render pass and
  // it must return a referentially stable value.
  if (snapshot === null) snapshot = readStoredPreference();
  return snapshot;
}

export function getServerPreferenceSnapshot(): ThemePreference {
  return "system";
}

export function setPreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // A failed write just means the choice won't survive a reload.
  }
  applyPreference(preference);
  notify();
}

export function watchSystemTheme(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Runs synchronously in <head>, before first paint, so the correct palette is
 * in place on the very first frame. It duplicates the small amount of logic
 * above because it has to be a self-contained string — it cannot import.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");if(p!=="light"&&p!=="dark")p="system";var t=p==="system"?(window.matchMedia("${DARK_QUERY}").matches?"dark":"light"):p;var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;}catch(e){}})();`;
