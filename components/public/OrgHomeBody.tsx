"use client";

import { useState, useSyncExternalStore } from "react";
import { OrgCampaignPicker } from "@/components/public/OrgCampaignPicker";
import { OrgSections } from "@/components/public/OrgSections";
import type { PublicProjectSummary } from "@/lib/data/project";
import type { OrgEvent } from "@/lib/data/events";
import type { OfficiantSummary, OpenSlot } from "@/lib/data/services";

type TabKey = "campaigns" | "events" | "services";

type OrgHomeBodyProps = {
  orgId: string;
  orgSlug: string;
  projects: PublicProjectSummary[];
  events: OrgEvent[];
  nikahPrice: number | null;
  officiants: OfficiantSummary[];
  slotsByOfficiant: Record<string, OpenSlot[]>;
};

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function tabFromHash(): TabKey {
  const hash = window.location.hash;
  if (hash === "#services") return "services";
  if (hash === "#events") return "events";
  return "campaigns";
}

function serverTab(): TabKey {
  return "campaigns";
}

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: "campaigns", label: "Campaigns", hash: "#campaigns" },
  { key: "events", label: "Events", hash: "#events" },
  { key: "services", label: "Services", hash: "#services" },
];

export function OrgHomeBody({
  orgId,
  orgSlug,
  projects,
  events,
  nikahPrice,
  officiants,
  slotsByOfficiant,
}: OrgHomeBodyProps) {
  const hashTab = useSyncExternalStore(subscribeToHash, tabFromHash, serverTab);
  const [choice, setChoice] = useState<TabKey | undefined>(undefined);
  const tab = choice ?? hashTab;
  const openCampaigns = projects.filter((project) => project.status === "active").length;

  function selectTab(next: TabKey, hash: string) {
    setChoice(next);
    window.history.replaceState(null, "", hash);
  }

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-10 min-[900px]:px-8">
      <div
        role="tablist"
        aria-label="Organization sections"
        className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline"
      >
        {TABS.map((item) => {
          const selected = tab === item.key;
          const count =
            item.key === "campaigns"
              ? openCampaigns
              : item.key === "events"
                ? events.length
                : null;

          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(item.key, item.hash)}
              className={`flex flex-col items-start gap-0.5 px-3.5 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                selected ? "bg-accent-tint" : "bg-surface-raised hover:bg-surface-sunken"
              }`}
            >
              <span
                className={`font-sans text-[13.5px] font-semibold ${
                  selected ? "text-accent" : "text-ink"
                }`}
              >
                {item.label}
              </span>
              {count !== null && (
                <span className="font-mono text-micro text-muted">
                  {count} {item.key === "events" ? "upcoming" : "open"}
                </span>
              )}
              {item.key === "services" && (
                <span className="font-mono text-micro text-muted">Nikah · Janaza</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "campaigns" && <OrgCampaignPicker orgSlug={orgSlug} projects={projects} />}
      {tab === "events" && <OrgSections orgSlug={orgSlug} events={events} panel="events" />}
      {tab === "services" && (
        <OrgSections
          orgId={orgId}
          orgSlug={orgSlug}
          events={events}
          nikahPrice={nikahPrice}
          officiants={officiants}
          slotsByOfficiant={slotsByOfficiant}
          panel="services"
        />
      )}
    </div>
  );
}
