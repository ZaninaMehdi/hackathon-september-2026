"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventRegisterButton } from "@/components/public/EventRegisterButton";
import { GuestServiceForm } from "@/components/public/GuestServiceForm";
import type { OrgEvent } from "@/lib/data/events";
import type { OfficiantSummary, OpenSlot } from "@/lib/data/services";

type SectionKey = "events" | "services";

type OrgSectionsProps = {
  orgId: string;
  orgSlug: string;
  events: OrgEvent[];
  nikahPrice: number | null;
  officiants: OfficiantSummary[];
  slotsByOfficiant: Record<string, OpenSlot[]>;
};

function formatPrice(price: number | null): string {
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
  officiants,
  slotsByOfficiant,
}: OrgSectionsProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const nikahPriceLabel = formatPrice(nikahPrice);

  useEffect(() => {
    if (window.location.hash === "#services") {
      setOpenSection("services");
    }
  }, []);

  function toggle(section: SectionKey) {
    setOpenSection((current) => (current === section ? null : section));
  }

  return (
    <div className="flex flex-col gap-3 px-[18px] pb-10">
      {/* Events */}
      <div className="rounded-lg border border-hairline bg-surface-raised">
        <button
          type="button"
          onClick={() => toggle("events")}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3.5 text-left transition-colors outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="flex flex-col">
            <span className="font-sans text-subhead font-semibold text-ink">Events</span>
            <span className="font-mono text-micro text-muted">
              {events.length} upcoming
            </span>
          </div>
          <span className="ml-auto text-body">{openSection === "events" ? "▲" : "▼"}</span>
        </button>

        {openSection === "events" && (
          <div className="flex flex-col gap-2.5 border-t border-hairline-soft px-4 pb-4 pt-3.5">
            {events.length === 0 && (
              <EmptyState
                icon="events"
                title="No upcoming events"
                description="Classes, fundraisers and gatherings will be listed here."
                compact
              />
            )}
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-3.5 shadow-card"
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col">
                    <span className="font-sans text-copy font-semibold text-ink">
                      {event.title}
                    </span>
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
                  <p className="text-meta leading-[1.55] text-body">{event.description}</p>
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
        )}
      </div>

      {/* Services */}
      <div id="services" className="rounded-lg border border-hairline bg-surface-raised">
        <button
          type="button"
          onClick={() => toggle("services")}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3.5 text-left transition-colors outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="flex flex-col">
            <span className="font-sans text-subhead font-semibold text-ink">Services</span>
            <span className="font-mono text-micro text-muted">Nikah · Janaza</span>
          </div>
          <span className="ml-auto text-body">{openSection === "services" ? "▲" : "▼"}</span>
        </button>

        {openSection === "services" && (
          <div className="flex flex-col gap-3 border-t border-hairline-soft px-4 pb-4 pt-3.5">
            <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-3.5 shadow-card">
              <div className="flex items-center gap-2">
                <span className="font-sans text-copy font-semibold text-ink">Nikah</span>
                <span className="ml-auto shrink-0 rounded-pill bg-neutral-wash px-2 py-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-body">
                  {nikahPriceLabel}
                </span>
              </div>
              <p className="text-meta leading-[1.55] text-body">
                Pick an officiant and a slot if one is open — no account needed. We&apos;ll confirm
                by email.
              </p>
              <GuestServiceForm
                orgId={orgId}
                serviceType="nikah"
                priceLabel={nikahPriceLabel}
                officiants={officiants}
                slotsByOfficiant={slotsByOfficiant}
              />
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-3.5 shadow-card">
              <span className="font-sans text-copy font-semibold text-ink">Janaza</span>
              <p className="text-meta leading-[1.55] text-body">
                For urgent janaza arrangements, share your contact details and we&apos;ll reach out
                right away.
              </p>
              <GuestServiceForm orgId={orgId} serviceType="janaza" priceLabel="Free" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
