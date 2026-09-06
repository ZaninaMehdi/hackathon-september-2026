"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DonateForm } from "@/components/public/DonateForm";
import { formatUsd } from "@/lib/mock/project";
import type { PublicProjectSummary } from "@/lib/data/project";

const PREVIEW_COUNT = 5;

type OrgCampaignPickerProps = {
  orgSlug: string;
  projects: PublicProjectSummary[];
};

export function OrgCampaignPicker({ orgSlug, projects }: OrgCampaignPickerProps) {
  const openCampaigns = useMemo(
    () => projects.filter((project) => project.status === "active"),
    [projects]
  );
  const closedCampaigns = useMemo(
    () => projects.filter((project) => project.status !== "active"),
    [projects]
  );
  const [selectedId, setSelectedId] = useState(
    openCampaigns.find((project) => project.activePhaseId)?.id ?? openCampaigns[0]?.id ?? ""
  );
  const [showAllOpen, setShowAllOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const selected = openCampaigns.find((project) => project.id === selectedId) ?? null;
  const visibleOpen = showAllOpen ? openCampaigns : openCampaigns.slice(0, PREVIEW_COUNT);
  const hiddenOpen = Math.max(0, openCampaigns.length - PREVIEW_COUNT);

  return (
    <section id="campaigns" className="flex flex-col gap-3">
      <p className="text-meta text-body">
        Select a campaign to donate. You don&apos;t need an account.
      </p>

      {openCampaigns.length === 0 && (
        <p className="rounded-lg border border-hairline bg-surface-raised px-4 py-3.5 text-sm text-body">
          No open campaigns right now.
        </p>
      )}

      <div className="min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_340px] min-[900px]:items-start min-[900px]:gap-8">
        <div className="flex flex-col gap-2">
          {visibleOpen.map((project) => {
            const selectedCard = project.id === selectedId;
            const percent = project.goal > 0 ? Math.round((project.raised / project.goal) * 100) : 0;

            return (
              <div
                key={project.id}
                className={`rounded-lg border bg-surface-raised ${
                  selectedCard ? "border-2 border-accent bg-accent-tint" : "border-hairline"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className="flex w-full items-center gap-3 p-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {project.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.coverImageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span
                      className={`inline-block h-[18px] w-[18px] shrink-0 rounded-full ${
                        selectedCard
                          ? "border-[5px] border-accent bg-surface-raised"
                          : "border-[1.5px] border-border-strong bg-surface-raised"
                      }`}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-sans text-copy font-semibold text-ink">
                        {project.title}
                      </span>
                      {project.isZakatEligible && (
                        <Badge variant="confirmed" compact className="shrink-0">
                          Zakat
                        </Badge>
                      )}
                    </div>
                    <p className="font-mono text-micro text-muted">
                      {formatUsd(project.raised)} of {formatUsd(project.goal)} · {percent}%
                    </p>
                  </div>
                </button>

                {selectedCard && (
                  <div className="flex flex-col gap-2.5 border-t border-hairline-soft px-3.5 pb-3.5 min-[900px]:hidden">
                    <DonateForm
                      orgSlug={orgSlug}
                      projectId={project.id}
                      projectSlug={project.slug}
                      phaseId={project.activePhaseId}
                      phaseLabel={project.activePhaseLabel}
                      isAcceptingDonations
                      buttonLabel={
                        project.activePhaseLabel
                          ? `Donate to ${project.activePhaseLabel}`
                          : "Donate"
                      }
                      phases={project.phases}
                    />
                    <Link
                      href={`/${orgSlug}/${project.slug}`}
                      className="text-center font-sans text-[12.5px] font-semibold text-accent"
                    >
                      See books and expenses
                    </Link>
                  </div>
                )}
              </div>
            );
          })}

          {hiddenOpen > 0 && !showAllOpen && (
            <button
              type="button"
              onClick={() => setShowAllOpen(true)}
              className="self-start font-sans text-[12.5px] font-semibold text-accent"
            >
              Show all {openCampaigns.length} campaigns
            </button>
          )}
          {showAllOpen && hiddenOpen > 0 && (
            <button
              type="button"
              onClick={() => setShowAllOpen(false)}
              className="self-start font-sans text-[12.5px] font-semibold text-accent"
            >
              Show fewer
            </button>
          )}

          {closedCampaigns.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowClosed((current) => !current)}
                className="font-sans text-[12.5px] font-semibold text-body"
              >
                {showClosed ? "Hide" : "Show"} {closedCampaigns.length} closed
              </button>
              {showClosed && (
                <div className="mt-2 flex flex-col gap-2">
                  {closedCampaigns.map((project) => (
                    <Link
                      key={project.id}
                      href={`/${orgSlug}/${project.slug}`}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-surface-raised px-3.5 py-3"
                    >
                      <span className="truncate font-sans text-copy text-ink">{project.title}</span>
                      <Badge variant="draft" compact>
                        closed
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selected && (
          <aside className="sticky top-6 hidden rounded-lg border border-hairline bg-surface-raised p-5 shadow-card min-[900px]:flex min-[900px]:flex-col min-[900px]:gap-3">
            {selected.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.coverImageUrl}
                alt=""
                className="h-[140px] w-full rounded-md object-cover"
              />
            )}
            <div className="flex flex-col gap-1">
              <span className="font-mono text-micro font-medium uppercase tracking-[0.06em] text-accent">
                Give now
              </span>
              <h3 className="font-sans text-subhead font-semibold text-ink">{selected.title}</h3>
              {selected.description && (
                <p className="line-clamp-3 text-meta leading-[1.55] text-body">
                  {selected.description}
                </p>
              )}
            </div>
            <ProgressBar
              raised={selected.raised}
              target={selected.goal}
              label={`${formatUsd(selected.raised)} of ${formatUsd(selected.goal)}`}
            />
            <p className="font-mono text-micro text-muted">
              {formatUsd(selected.raised)} of {formatUsd(selected.goal)}
            </p>
            <DonateForm
              orgSlug={orgSlug}
              projectId={selected.id}
              projectSlug={selected.slug}
              phaseId={selected.activePhaseId}
              phaseLabel={selected.activePhaseLabel}
              isAcceptingDonations
              buttonLabel={
                selected.activePhaseLabel ? `Donate to ${selected.activePhaseLabel}` : "Donate"
              }
              phases={selected.phases}
            />
            <Link
              href={`/${orgSlug}/${selected.slug}`}
              className="text-center font-sans text-[12.5px] font-semibold text-accent"
            >
              See books and expenses
            </Link>
            <p className="text-center text-micro text-body">
              Stripe collects your email for the receipt.
            </p>
          </aside>
        )}
      </div>
    </section>
  );
}
