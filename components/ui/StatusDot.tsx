type StatusDotStatus = "complete" | "in_progress" | "not_started" | "pending_approval";

type StatusDotProps = {
  status: StatusDotStatus;
  size?: number;
};

export function StatusDot({ status, size = 18 }: StatusDotProps) {
  if (status === "complete") {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1.5 5.2L3.8 7.5L8.5 2.5"
            className="stroke-on-accent"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span
        className="inline-block shrink-0 rounded-full border-2 border-accent bg-transparent"
        style={{ width: size, height: size }}
      />
    );
  }

  if (status === "pending_approval") {
    return (
      <span
        className="inline-block shrink-0 rounded-full border-2 border-dashed border-pending-border bg-transparent"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="inline-block shrink-0 rounded-full border-2 border-dashed border-border-strong bg-transparent"
      style={{ width: size, height: size }}
    />
  );
}
