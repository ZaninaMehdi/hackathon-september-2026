import { requireMemberContext } from "@/lib/auth/session";
import { getOrgEvents } from "@/lib/data/events";
import { EventsListClient } from "@/components/events/EventsListClient";

export default async function EventsPage() {
  const context = await requireMemberContext();
  const events = await getOrgEvents(context.orgId);
  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");

  return <EventsListClient events={events} canManage={canManage} />;
}
