type IconProps = { className?: string };

const STROKE = { fill: "none", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function OverviewIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="2.5" stroke="currentColor" {...STROKE} />
    </svg>
  );
}

export function ProjectsIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <rect x="2" y="6" width="3.5" height="6" rx="0.75" fill="currentColor" />
      <rect x="8.5" y="2" width="3.5" height="10" rx="0.75" fill="currentColor" />
    </svg>
  );
}

export function EventsIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" {...STROKE} />
      <path d="M1.5 5H12.5" stroke="currentColor" strokeWidth="2.25" />
    </svg>
  );
}

export function TasksIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" {...STROKE} />
      <path d="M4.25 7l1.75 1.75L9.75 4.75" stroke="currentColor" {...STROKE} />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <path d="M6 3.5H2.5V11.5H10.5V8" stroke="currentColor" {...STROKE} />
      <path d="M8.5 2.5H11.5V5.5" stroke="currentColor" {...STROKE} />
      <path d="M11.5 2.5L6.75 7.25" stroke="currentColor" {...STROKE} />
    </svg>
  );
}

export function BookingsIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" {...STROKE} />
      <path d="M4 1.5V12.5" stroke="currentColor" strokeWidth="2.25" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <circle cx="7" cy="7" r="2.25" stroke="currentColor" {...STROKE} />
      <path
        d="M7 1.5v1.4M7 11.1v1.4M12.5 7h-1.4M2.9 7H1.5M10.7 3.3l-1 1M4.3 9.7l-1 1M10.7 10.7l-1-1M4.3 4.3l-1-1"
        stroke="currentColor"
        {...STROKE}
      />
    </svg>
  );
}
