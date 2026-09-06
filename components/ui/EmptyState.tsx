import type { ReactNode } from "react";

const STROKE = {
  fill: "none",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type EmptyStateIcon = "donations" | "expenses" | "projects" | "phases" | "events" | "tasks";

const ICONS: Record<EmptyStateIcon, ReactNode> = {
  donations: (
    <>
      <circle cx="11" cy="11" r="7.25" stroke="currentColor" {...STROKE} />
      <path d="M11 7.5v7M8.75 9.25h3.5a1.75 1.75 0 010 3.5h-2.5a1.75 1.75 0 000 3.5h3.5" stroke="currentColor" {...STROKE} />
    </>
  ),
  expenses: (
    <>
      <path d="M5 3.5h12v15l-2-1.25L13 18.5l-2-1.25L9 18.5l-2-1.25L5 18.5v-15z" stroke="currentColor" {...STROKE} />
      <path d="M8.5 8h5M8.5 11.5h5" stroke="currentColor" {...STROKE} />
    </>
  ),
  projects: (
    <>
      <rect x="3.5" y="11" width="4.5" height="7.5" rx="1" stroke="currentColor" {...STROKE} />
      <rect x="14" y="3.5" width="4.5" height="15" rx="1" stroke="currentColor" {...STROKE} />
    </>
  ),
  phases: (
    <>
      <circle cx="6" cy="11" r="2.5" stroke="currentColor" {...STROKE} />
      <circle cx="16" cy="11" r="2.5" stroke="currentColor" {...STROKE} />
      <path d="M8.5 11h5" stroke="currentColor" {...STROKE} />
    </>
  ),
  events: (
    <>
      <rect x="3.5" y="4.5" width="15" height="14" rx="2" stroke="currentColor" {...STROKE} />
      <path d="M3.5 8.5h15M7.5 3v3M14.5 3v3" stroke="currentColor" {...STROKE} />
    </>
  ),
  tasks: (
    <>
      <rect x="3.5" y="3.5" width="15" height="15" rx="2.5" stroke="currentColor" {...STROKE} />
      <path d="M7.5 11.25l2.5 2.5 4.5-5" stroke="currentColor" {...STROKE} />
    </>
  ),
};

type EmptyStateProps = {
  icon: EmptyStateIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Tighter padding, for empty states nested inside a card or panel. */
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-sunken text-center ${
        compact ? "px-4 py-6" : "px-6 py-10"
      } ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-muted shadow-card">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          {ICONS[icon]}
        </svg>
      </span>
      <span className="text-meta font-semibold text-ink">{title}</span>
      {description && (
        <p className="max-w-[38ch] text-meta leading-[1.55] text-body">{description}</p>
      )}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}
