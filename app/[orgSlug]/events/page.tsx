import type { Metadata } from "next";
import { EventRegisterButton } from "@/components/public/EventRegisterButton";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicPage } from "@/components/public/PublicPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { getStaffNav } from "@/lib/auth/session";
import { getPublicOrgBySlug } from "@/lib/data/project";
import { getPublicUpcomingEvents } from "@/lib/data/events";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  const org = await getPublicOrgBySlug(orgSlug);

  const title = `Upcoming events — ${org.name}`;
  return { title, openGraph: { title, siteName: "Amanah", type: "website" } };
}

export default async function PublicEventsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getPublicOrgBySlug(orgSlug);
  const [events, staff] = await Promise.all([
    getPublicUpcomingEvents(org.id),
    getStaffNav(),
  ]);

  return (
    <PublicPage>
      <PublicHeader
        title={org.name}
        titleHref={`/${orgSlug}`}
        logoUrl={org.logoUrl}
        staffHref={staff.href}
        staffLabel={staff.label}
        showVerified
        backHref={`/${orgSlug}`}
        backLabel="Back to organization"
      />

      <section className="flex flex-col gap-1 px-[18px] py-[22px] min-[900px]:px-8 min-[900px]:py-10">
        <h1 className="font-sans text-2xl font-bold leading-[1.2] tracking-[-0.025em] text-ink min-[900px]:font-display min-[900px]:text-display">
          Upcoming events
        </h1>
        <p className="max-w-[62ch] font-sans text-sm leading-[1.6] text-body">
          Free events are open to everyone. Paid events can be registered for below.
        </p>
      </section>

      <section className="flex flex-col gap-3 px-[18px] pb-10 min-[720px]:grid min-[720px]:grid-cols-2 min-[720px]:px-8">
        {events.length === 0 && (
          <div className="min-[720px]:col-span-2">
            <EmptyState
              icon="events"
              title="No upcoming events"
              description="Check back soon — classes, fundraisers and gatherings will be listed here."
            />
          </div>
        )}

        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-4"
          >
            <div className="flex items-start gap-2">
              <div className="flex flex-col">
                <span className="font-sans text-[15px] font-semibold text-ink">{event.title}</span>
                <span className="font-mono text-[11.5px] text-muted">
                  {event.day} · {event.timePlace}
                </span>
              </div>
              <span
                className={`ml-auto shrink-0 rounded-pill px-2 py-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.04em] ${
                  event.isFree ? "bg-accent-wash text-accent" : "bg-neutral-wash text-body"
                }`}
              >
                {event.priceLabel}
              </span>
            </div>

            {event.description && (
              <p className="text-[12.5px] leading-[1.5] text-body">{event.description}</p>
            )}

            {!event.isFree && (
              <EventRegisterButton eventId={event.id} orgSlug={orgSlug} priceLabel={event.priceLabel} />
            )}
          </div>
        ))}
      </section>
    </PublicPage>
  );
}
