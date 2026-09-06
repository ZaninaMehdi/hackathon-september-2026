"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  applyPreference,
  getPreferenceSnapshot,
  getServerPreferenceSnapshot,
  setPreference,
  subscribeToPreference,
  watchSystemTheme,
  THEME_PREFERENCES,
  type ThemePreference,
} from "@/lib/theme";

const LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ICONS: Record<ThemePreference, React.ReactNode> = {
  light: (
    <>
      <circle cx="9" cy="9" r="3.4" />
      <path d="M9 1.6v1.7M9 14.7v1.7M16.4 9h-1.7M3.3 9H1.6M14.2 3.8l-1.2 1.2M5 13l-1.2 1.2M14.2 14.2L13 13M5 5L3.8 3.8" />
    </>
  ),
  dark: <path d="M14.6 10.4A6 6 0 1 1 7.6 3.4a4.8 4.8 0 0 0 7 7Z" />,
  system: (
    <>
      <rect x="2.2" y="3.2" width="13.6" height="9.2" rx="1.4" />
      <path d="M6.6 15.4h4.8" />
    </>
  ),
};

type ThemeToggleProps = {
  /** Show the current mode as text beside the icon. */
  showLabel?: boolean;
  /** Applied to the label, so a parent can hide it at some breakpoints
   *  without rendering a second toggle that would hold stale state. */
  labelClassName?: string;
  className?: string;
};

export function ThemeToggle({
  showLabel = false,
  labelClassName = "",
  className = "",
}: ThemeToggleProps) {
  const preference = useSyncExternalStore(
    subscribeToPreference,
    getPreferenceSnapshot,
    getServerPreferenceSnapshot,
  );

  // While on "system", keep following the OS if it changes mid-session. Only
  // the resolved palette changes here, not the preference, so there is
  // nothing to re-render.
  useEffect(() => {
    if (preference !== "system") return;
    return watchSystemTheme(() => applyPreference("system"));
  }, [preference]);

  function cycle() {
    const next: ThemePreference =
      THEME_PREFERENCES[(THEME_PREFERENCES.indexOf(preference) + 1) % THEME_PREFERENCES.length];
    setPreference(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${LABELS[preference]}`}
      aria-label={`Theme: ${LABELS[preference]}. Click to change.`}
      className={`inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-body outline-none transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[preference]}
      </svg>
      {showLabel && <span className={`text-meta ${labelClassName}`}>{LABELS[preference]}</span>}
    </button>
  );
}
