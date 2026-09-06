import type { JanazaTaskRole, ServiceType } from "@/lib/data/services";
import { formatUsd } from "@/lib/mock/project";

export type PriceRange = {
  min: number;
  max: number;
  note: string;
};

export function formatNikahFee(amount: number | null) {
  if (amount == null) return "Fee not set";
  return formatUsd(amount);
}

export const JANAZA_TASK_PRICES: Record<JanazaTaskRole, PriceRange> = {
  salat: { min: 0, max: 0, note: "Led by a volunteer. No fee." },
  ghusl: { min: 80, max: 150, note: "Typical washing and shrouding cost." },
  transport: { min: 125, max: 275, note: "Depends on distance and the funeral home." },
  cemetery: { min: 450, max: 900, note: "Plot and burial — entered after the cemetery is called." },
};

export const JANAZA_PRICE: PriceRange = {
  min: Object.values(JANAZA_TASK_PRICES).reduce((sum, price) => sum + price.min, 0),
  max: Object.values(JANAZA_TASK_PRICES).reduce((sum, price) => sum + price.max, 0),
  note: "Estimate for salat, ghusl, transport, and cemetery. No payment is collected in the app.",
};

export function formatPriceRange(price: PriceRange) {
  if (price.min === 0 && price.max === 0) return "Included";
  if (price.min === price.max) return formatUsd(price.min);
  return `${formatUsd(price.min)}–${formatUsd(price.max)}`;
}

export function priceForService(serviceType: ServiceType): PriceRange | null {
  return serviceType === "janaza" ? JANAZA_PRICE : null;
}
