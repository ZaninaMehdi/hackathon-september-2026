import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatUsd } from "@/lib/mock/project";
import type { FeaturedCampaign } from "@/lib/data/project";

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-on-accent"
    >
      <circle cx="6" cy="6" r="6" className="fill-success" />
      <path
        d="M3.4 6.15 5.15 7.9 8.6 4.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeaturedCampaignCard({ campaign }: { campaign: FeaturedCampaign }) {
  const href = `/${campaign.orgSlug}/${campaign.slug}`;
  const percent = campaign.goal > 0 ? Math.round((campaign.raised / campaign.goal) * 100) : 0;

  return (
    <Link
      href={href}
      className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface-raised p-5 shadow-lift outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-modal focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-sans text-copy font-semibold text-ink">
            {campaign.orgName}
            <span className="font-normal text-muted"> · {campaign.title}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-pill bg-accent-wash px-2 py-[3px] font-mono text-[10px] font-medium tracking-[0.06em] text-accent uppercase">
          Live
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-display text-head font-bold tracking-[-0.02em] text-ink">
          {formatUsd(campaign.raised)}
          {campaign.goal > 0 && (
            <span className="ml-1.5 font-sans text-meta font-medium text-muted">
              of {formatUsd(campaign.goal)}
            </span>
          )}
        </p>
        {campaign.goal > 0 && (
          <ProgressBar
            raised={campaign.raised}
            target={campaign.goal}
            label={`${percent}% of ${campaign.title} goal`}
          />
        )}
        <p className="font-mono text-micro text-muted">
          {campaign.phaseCount > 0
            ? `Phase ${campaign.phaseIndex} of ${campaign.phaseCount}`
            : "Open campaign"}
          {campaign.donorCount > 0
            ? ` · ${campaign.donorCount} donor${campaign.donorCount === 1 ? "" : "s"}`
            : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-hairline-soft pt-3.5">
        <p className="font-mono text-[10px] font-medium tracking-[0.08em] text-muted uppercase">
          Where the last gifts went
        </p>
        {campaign.expenses.length === 0 ? (
          <p className="text-meta text-body">
            No approved expenses yet. Every one that posts will show up here with its receipt.
          </p>
        ) : (
          <ul className="flex list-none flex-col gap-2.5">
            {campaign.expenses.map((expense) => (
              <li key={expense.id} className="flex items-start gap-2.5">
                <CheckIcon />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-meta font-medium text-ink">{expense.title}</p>
                  <p className="text-micro text-muted">
                    {expense.hasReceipt ? "Approved · receipt attached" : "Approved"}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-meta text-ink">{formatUsd(expense.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-micro leading-[1.5] text-muted">
        Every approved expense is published back to the campaign with its receipt, so you can see
        where the money went.
      </p>
    </Link>
  );
}
