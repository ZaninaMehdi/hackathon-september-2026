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

export function GivingIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" {...STROKE} />
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

export function BookingsIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" {...STROKE} />
      <path d="M4 1.5V12.5" stroke="currentColor" strokeWidth="2.25" />
    </svg>
  );
}
