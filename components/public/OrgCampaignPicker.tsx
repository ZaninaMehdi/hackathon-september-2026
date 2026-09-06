"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DonateForm } from "@/components/public/DonateForm";
import { formatUsd } from "@/lib/mock/project";
import type { PublicProjectSummary } from "@/lib/data/project";

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
  const selected = openCampaigns.find((project) => project.id === selectedId) ?? null;

  return (
    <section id="campaigns" className="flex flex-col gap-3 px-[18px] pb-2">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-subhead font-semibold text-ink">Ongoing campaigns</h2>
        <p className="text-meta text-body">
          Select a campaign to donate. You don&apos;t need an account.
        </p>
      </div>

      {openCampaigns.length === 0 && (
        <p className="rounded-lg border border-hairline bg-surface-raised px-4 py-3.5 text-sm text-body">
          No open campaigns right now.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {openCampaigns.map((project) => {
          const selectedCard = project.id === selectedId;
          const percent = project.goal > 0 ? Math.round((project.raised / project.goal) * 100) : 0;

          return (
            <div
              key={project.id}
              className={`flex flex-col gap-3 rounded-lg border bg-surface-raised p-3.5 shadow-card ${
                selectedCard ? "border-2 border-accent bg-accent-tint" : "border-hairline"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedId(project.id)}
                className="flex flex-col gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="flex items-center gap-3">
                  {project.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.coverImageUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-md object-cover"
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
                  <span className="min-w-0 truncate font-sans text-copy font-semibold text-ink">
                    {project.title}
                  </span>
                  {percent > 100 && (
                    <Badge variant="success" compact className="shrink-0">
                      Over goal
                    </Badge>
                  )}
                  {project.isZakatEligible && (
                    <Badge variant="confirmed" compact className="shrink-0">
                      Zakat-eligible
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <p className="line-clamp-2 pl-[30px] text-meta leading-[1.55] text-body">
                    {project.description}
                  </p>
                )}
                <div className="pl-[30px]">
                  <ProgressBar
                    raised={project.raised}
                    target={project.goal}
                    label={`${formatUsd(project.raised)} of ${formatUsd(project.goal)}, ${percent} percent`}
                  />
                  <div className="mt-1.5 font-mono text-micro text-muted">
                    {formatUsd(project.raised)} of {formatUsd(project.goal)} · {percent}%
                  </div>
                </div>
              </button>

              {selectedCard && (
                <div className="flex flex-col gap-2.5 border-t border-hairline-soft pt-3">
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
      </div>

      {closedCampaigns.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.04em] text-muted">
            Closed
          </span>
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

      {selected && (
        <p className="text-center text-micro text-body">
          Giving to {selected.title}. Stripe collects your email for the receipt.
        </p>
      )}
    </section>
  );
}
