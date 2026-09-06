import { formatNikahFee, formatPriceRange, type PriceRange } from "@/lib/data/service-prices";

export function ServicePrice({ price, compact = false }: { price: PriceRange; compact?: boolean }) {
  return (
    <div className={compact ? "flex items-baseline gap-2" : "flex flex-col gap-0.5"}>
      <span className="font-mono text-[13px] font-medium text-ink">{formatPriceRange(price)}</span>
      {!compact && <span className="text-meta text-muted">{price.note}</span>}
    </div>
  );
}

export function NikahFee({ amount, compact = false }: { amount: number | null; compact?: boolean }) {
  return (
    <div className={compact ? "flex items-baseline gap-2" : "flex flex-col gap-0.5"}>
      <span className="font-mono text-[13px] font-medium text-ink">{formatNikahFee(amount)}</span>
      {!compact && (
        <span className="text-meta text-muted">
          {amount == null
            ? "An admin sets the nikah fee for this organization."
            : "Set by your organization. No payment is collected in the app."}
        </span>
      )}
    </div>
  );
}
