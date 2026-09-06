import type { ReactNode } from "react";

type BadgeVariant =
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "confirmed"
  | "expired"
  | "declined"
  | "success";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  pending: "bg-surface-raised text-pending-text border border-dashed border-pending-border",
  approved: "bg-accent-wash text-accent border border-transparent",
  success: "bg-success-wash text-success border border-transparent",
  rejected: "bg-danger-wash text-danger border border-transparent",
  draft: "bg-neutral-wash text-body border border-transparent",
  confirmed: "bg-accent-wash text-accent border border-transparent",
  expired: "bg-neutral-wash text-muted border border-transparent",
  declined: "bg-danger-wash text-danger border border-transparent",
};

type BadgeProps = {
  variant: BadgeVariant;
  children: ReactNode;
  compact?: boolean;
  className?: string;
};

export function Badge({ variant, children, compact = false, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill font-mono text-[10px] font-medium uppercase tracking-[0.04em] ${
        compact ? "px-[7px] py-[3px]" : "px-[9px] py-[5px]"
      } ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
