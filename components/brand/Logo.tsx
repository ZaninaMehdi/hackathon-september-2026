import { Mark } from "./Mark";

type LogoProps = {
  markSize?: number;
  textClassName?: string;
  className?: string;
};

export function Logo({
  markSize = 22,
  textClassName = "text-[15px]",
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Mark size={markSize} />
      <span
        className={`font-sans font-bold tracking-[-0.02em] text-ink ${textClassName}`}
      >
        Amanah
      </span>
    </div>
  );
}
