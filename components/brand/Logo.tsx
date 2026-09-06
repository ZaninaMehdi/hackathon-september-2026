import { Mark } from "./Mark";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
  className?: string;
  /** Colour of the wordmark. The mark already follows `--color-accent`. */
  wordmarkClassName?: string;
};

// The mark-to-wordmark ratio is fixed per size rather than passed in
// separately, so the lockup can't drift out of proportion at a call site.
// Tracking opens up at small sizes and tightens at large ones — serifs need
// air to stay legible at 15px, and look loose if they keep it at 24px.
//
// Sizes run a couple of pixels larger than the sans equivalents would: Amiri
// sets a small Latin face on the em, so matching numbers would read undersized
// next to the mark.
const SIZES: Record<LogoSize, { mark: number; text: string; gap: string; tracking: string }> = {
  sm: { mark: 22, text: "text-[17px]", gap: "gap-2", tracking: "tracking-[0.01em]" },
  md: { mark: 26, text: "text-[20px]", gap: "gap-2.5", tracking: "tracking-[0]" },
  lg: { mark: 32, text: "text-[27px]", gap: "gap-3", tracking: "tracking-[-0.015em]" },
};

export function Logo({ size = "sm", className = "", wordmarkClassName = "text-ink" }: LogoProps) {
  const { mark, text, gap, tracking } = SIZES[size];

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <Mark size={mark} />
      {/* font-bold, not semibold: Amiri ships 400 and 700 only, and 600 would
          be synthesised into a smeared faux-bold. */}
      <span className={`font-brand font-bold ${wordmarkClassName} ${text} ${tracking}`}>Amanah</span>
    </div>
  );
}
