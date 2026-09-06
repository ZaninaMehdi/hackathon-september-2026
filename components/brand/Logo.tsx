import { Mark } from "./Mark";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
  className?: string;
};

// The mark-to-wordmark ratio is fixed per size rather than passed in
// separately, so the lockup can't drift out of proportion at a call site.
// Tracking opens up at small sizes and tightens at large ones — serifs need
// air to stay legible at 15px, and look loose if they keep it at 24px.
const SIZES: Record<LogoSize, { mark: number; text: string; gap: string; tracking: string }> = {
  sm: { mark: 22, text: "text-[15px]", gap: "gap-2", tracking: "tracking-[0.01em]" },
  md: { mark: 26, text: "text-[18px]", gap: "gap-2.5", tracking: "tracking-[0]" },
  lg: { mark: 32, text: "text-[24px]", gap: "gap-3", tracking: "tracking-[-0.015em]" },
};

export function Logo({ size = "sm", className = "" }: LogoProps) {
  const { mark, text, gap, tracking } = SIZES[size];

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <Mark size={mark} />
      <span className={`font-display font-semibold text-ink ${text} ${tracking}`}>Amanah</span>
    </div>
  );
}
