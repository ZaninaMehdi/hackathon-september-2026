type MarkProps = {
  size?: number;
  className?: string;
};

// Amanah mark: a seal — something entrusted, verified, held to account.
// Deliberately non-religious geometry (circle + checkmark), echoing the
// product's own "approved" status dot so the identity mark and the core
// trust mechanic read as the same idea.
export function Mark({ size = 24, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" className="fill-accent" />
      <path
        d="M7 12.5L10.3 16L17 8.5"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
