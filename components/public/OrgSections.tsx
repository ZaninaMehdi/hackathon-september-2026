"use client";

import Link from "next/link";
import { useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EventRegisterButton } from "@/components/public/EventRegisterButton";
import { GuestServiceForm } from "@/components/public/GuestServiceForm";
import { formatUsd } from "@/lib/mock/project";
import type { PublicProjectSummary } from "@/lib/data/project";
import type { OrgEvent } from "@/lib/data/events";

type SectionKey = "projects" | "events" | "services";

type OrgSectionsProps = {
  orgId: string;
  orgSlug: string;
  projects: PublicProjectSummary[];
  totalRaised: number;
  totalGoal: number;
  events: OrgEvent[];
  nikahPrice: number | null;
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
  projects,
  totalRaised,
  totalGoal,
  events,
  nikahPrice,
}: OrgSectionsProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>("projects");
  const percent = totalGoal > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0;
  const nikahPriceLabel = formatPrice(nikahPrice);

  function toggle(section: SectionKey) {
    setOpenSection((current) => (current === section ? null : section));
  }

  return (
    <div className="flex flex-col gap-3 px-[18px] pb-10">
      {/* Projects */}
      <div className="rounded-lg border border-hairline bg-surface-raised">
        <button
          type="button"
          onClick={() => toggle("projects")}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3.5 text-left transition-colors outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="flex flex-col">
            <span className="font-sans text-subhead font-semibold text-ink">Projects</span>
            <span className="font-mono text-micro text-muted">
              {formatUsd(totalRaised)} raised of {formatUsd(totalGoal)} · {percent}%
            </span>
          </div>
          <span className="ml-auto text-body">{openSection === "projects" ? "▲" : "▼"}</span>
        </button>

        {openSection === "projects" && (
          <div className="flex flex-col gap-2.5 border-t border-hairline-soft px-4 pb-4 pt-3.5">
            {projects.length === 0 && (
              <p className="text-sm text-body">No projects have been published yet.</p>
            )}
            {projects.map((project) => {
              const projectPercent =
                project.goal > 0 ? Math.round((project.raised / project.goal) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href={`/${orgSlug}/${project.slug}`}
                  className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-3.5 shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate font-sans text-copy font-semibold text-ink">
                      {project.title}
                    </span>
                    {project.status === "closed" && (
                      <Badge variant="draft" compact className="shrink-0">
                        closed
                      </Badge>
                    )}
                    {projectPercent > 100 && (
                      <Badge variant="success" compact className="shrink-0">
                        Over goal
                      </Badge>
                    )}
                  </div>
                  {project.description && (
                    <p className="line-clamp-2 text-meta leading-[1.55] text-body">
                      {project.description}
                    </p>
                  )}
                  <ProgressBar
                    raised={project.raised}
                    target={project.goal}
                    label={`${formatUsd(project.raised)} of ${formatUsd(project.goal)}, ${projectPercent} percent`}
                  />
                  <div className="flex items-center justify-between font-mono text-micro text-muted">
                    <span>
                      {formatUsd(project.raised)} of {formatUsd(project.goal)} · {projectPercent}%
                    </span>
                    <span>{project.phaseCount} phases</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

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
              <p className="text-sm text-body">No upcoming events right now.</p>
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
      <div className="rounded-lg border border-hairline bg-surface-raised">
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
                Tell us a bit about your ceremony and preferred date — our officiants will follow
                up to confirm availability.
              </p>
              <GuestServiceForm orgId={orgId} serviceType="nikah" priceLabel={nikahPriceLabel} />
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
