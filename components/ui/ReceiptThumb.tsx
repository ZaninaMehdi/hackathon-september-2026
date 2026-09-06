type ReceiptThumbProps = {
  size?: number;
  radius?: string;
  large?: boolean;
  className?: string;
};

// Striped placeholder for an uploaded receipt image — also doubles as the
// loading/missing state once real receipts are wired up.
export function ReceiptThumb({
  size = 44,
  radius = "rounded-sm",
  large = false,
  className = "",
}: ReceiptThumbProps) {
  return (
    <div
      className={`shrink-0 ${large ? "stripe-placeholder-lg" : "stripe-placeholder"} ${radius} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
