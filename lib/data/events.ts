import { createClient } from "@/lib/supabase/server";
import {
  recurrenceLabel,
  type RecurrenceFrequency,
} from "@/lib/events/recurrence";

export type OrgEvent = {
  id: string;
  day: string;
  title: string;
  description: string;
  timePlace: string;
  location: string;
  startsAt: string;
  endsAt: string;
  price: number;
  isFree: boolean;
  priceLabel: string;
  seriesId: string | null;
  recurrence: RecurrenceFrequency | null;
  recurrenceLabel: string | null;
  isRecurring: boolean;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${formatTime(startsAt)} – ${formatTime(endsAt)}`;
  }

  const endDay = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${formatTime(startsAt)} – ${endDay} ${formatTime(endsAt)}`;
}

function formatPrice(price: number): string {
  if (price <= 0) return "Free";
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  price: number | null;
  series_id: string | null;
  recurrence: string | null;
};

function mapEventRow(e: EventRow): OrgEvent {
  const endsAt = e.ends_at ?? e.starts_at;
  const price = Number(e.price ?? 0);
  const recurrence = (e.recurrence as RecurrenceFrequency | null) ?? null;
  return {
    id: e.id,
    day: new Date(e.starts_at).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    title: e.title,
    description: e.description ?? "",
    timePlace: [formatTimeRange(e.starts_at, endsAt), e.location].filter(Boolean).join(" · "),
    location: e.location ?? "",
    startsAt: e.starts_at,
    endsAt,
    price,
    isFree: price <= 0,
    priceLabel: formatPrice(price),
    seriesId: e.series_id ?? null,
    recurrence,
    recurrenceLabel: recurrenceLabel(recurrence),
    isRecurring: Boolean(e.series_id),
  };
}

const EVENT_COLUMNS =
  "id, title, description, starts_at, ends_at, location, price, series_id, recurrence";

export async function getOrgEvents(orgId: string): Promise<OrgEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("org_id", orgId)
    .not("starts_at", "is", null)
    .order("starts_at", { ascending: true });

  return (data ?? []).map(mapEventRow);
}

export async function getPublicUpcomingEvents(orgId: string): Promise<OrgEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("org_id", orgId)
    .eq("visibility", "public")
    .eq("status", "confirmed")
    .not("starts_at", "is", null)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  return (data ?? []).map(mapEventRow);
}
