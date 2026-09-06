import { createClient } from "@/lib/supabase/server";
import type { EventCategory } from "@/lib/mock/events";

export type OrgEvent = {
  id: string;
  day: string;
  title: string;
  timePlace: string;
  category: EventCategory;
  qualifier: string;
  pending: boolean;
};

export async function getOrgEvents(orgId: string): Promise<OrgEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, title, description, starts_at, location, category, status, qualifier")
    .eq("org_id", orgId)
    .order("starts_at", { ascending: true, nullsFirst: false });

  return (data ?? []).map((e) => ({
    id: e.id,
    day: e.starts_at
      ? new Date(e.starts_at).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "Date TBD",
    title: e.title,
    timePlace: [
      e.starts_at
        ? new Date(e.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "Time to be confirmed",
      e.location,
    ]
      .filter(Boolean)
      .join(" · "),
    category: e.category as EventCategory,
    qualifier: e.qualifier ?? "",
    pending: e.status === "pending",
  }));
}
