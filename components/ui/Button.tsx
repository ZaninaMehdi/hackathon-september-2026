import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerSoft";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-sans font-semibold whitespace-nowrap transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-40";

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-meta",
  md: "h-10 px-4 text-[14px]",
  lg: "h-12 px-5 text-copy",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent shadow-card hover:bg-accent-hover hover:shadow-lift focus-visible:ring-accent",
  secondary:
    "border border-border bg-surface-raised text-ink hover:border-border-strong hover:bg-surface-sunken focus-visible:ring-accent",
  ghost: "text-body hover:bg-surface-sunken hover:text-ink focus-visible:ring-accent",
  danger:
    "bg-danger text-on-danger shadow-card hover:brightness-[1.12] hover:shadow-lift focus-visible:ring-danger",
  // Destructive, but secondary in the hierarchy — used where a solid red bar
  // would shout over the content it sits next to.
  dangerSoft:
    "border border-danger/30 bg-surface-raised text-danger hover:bg-danger-wash focus-visible:ring-danger",
};

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

/** Shared class string, for when the control has to be a Link or a label. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonStyleOptions = {}): string {
  return [BASE, SIZES[size], VARIANTS[variant], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleOptions & { children: ReactNode };

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
}
