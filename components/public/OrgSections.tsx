"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventRegisterButton } from "@/components/public/EventRegisterButton";
import { GuestServiceForm } from "@/components/public/GuestServiceForm";
import type { OrgEvent } from "@/lib/data/events";
import type { OfficiantSummary, OpenSlot } from "@/lib/data/services";

const EVENT_PREVIEW = 4;

type OrgSectionsProps = {
  orgId?: string;
  orgSlug: string;
  events: OrgEvent[];
  nikahPrice?: number | null;
  officiants?: OfficiantSummary[];
  slotsByOfficiant?: Record<string, OpenSlot[]>;
  panel: "events" | "services";
};

function formatPrice(price: number | null | undefined): string {
  if (!price || price <= 0) return "Free";
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function OrgSections({
  orgId,
  orgSlug,
  events,
  nikahPrice,
  officiants = [],
  slotsByOfficiant = {},
  panel,
}: OrgSectionsProps) {
  const nikahPriceLabel = formatPrice(nikahPrice);
  const visibleEvents = events.slice(0, EVENT_PREVIEW);

  if (panel === "events") {
    return (
      <section id="events" className="flex flex-col gap-3">
        <p className="text-meta text-body">
          Free events are open to everyone. Paid events can be registered below.
        </p>

        {events.length === 0 && (
          <EmptyState
            icon="events"
            title="No upcoming events"
            description="Classes, fundraisers and gatherings will be listed here."
            compact
          />
        )}

        <div className="flex flex-col gap-2.5 min-[720px]:grid min-[720px]:grid-cols-2">
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-3.5 shadow-card"
            >
              <div className="flex items-start gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="font-sans text-copy font-semibold text-ink">{event.title}</span>
                  <span className="font-mono text-micro text-muted">
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
                <p className="line-clamp-2 text-meta leading-[1.55] text-body">{event.description}</p>
              )}
              {!event.isFree && (
                <EventRegisterButton
                  eventId={event.id}
                  orgSlug={orgSlug}
                  priceLabel={event.priceLabel}
                />
              )}
            </div>
          ))}
        </div>

        {events.length > EVENT_PREVIEW && (
          <Link
            href={`/${orgSlug}/events`}
            className="self-start font-sans text-[12.5px] font-semibold text-accent"
          >
            See all {events.length} events
          </Link>
        )}
      </section>
    );
  }

  return (
    <section id="services" className="flex flex-col gap-3 min-[720px]:grid min-[720px]:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-3.5 shadow-card">
        <div className="flex items-center gap-2">
          <span className="font-sans text-copy font-semibold text-ink">Nikah</span>
          <span className="ml-auto shrink-0 rounded-pill bg-neutral-wash px-2 py-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-body">
            {nikahPriceLabel}
          </span>
        </div>
        <p className="text-meta leading-[1.55] text-body">
          Pick an officiant and a slot if one is open — no account needed. We&apos;ll confirm by
          email.
        </p>
        {orgId && (
          <GuestServiceForm
            orgId={orgId}
            serviceType="nikah"
            priceLabel={nikahPriceLabel}
            officiants={officiants}
            slotsByOfficiant={slotsByOfficiant}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-3.5 shadow-card">
        <span className="font-sans text-copy font-semibold text-ink">Janaza</span>
        <p className="text-meta leading-[1.55] text-body">
          For urgent janaza arrangements, share your contact details and we&apos;ll reach out right
          away.
        </p>
        {orgId && <GuestServiceForm orgId={orgId} serviceType="janaza" priceLabel="Free" />}
      </div>
    </section>
  );
}
