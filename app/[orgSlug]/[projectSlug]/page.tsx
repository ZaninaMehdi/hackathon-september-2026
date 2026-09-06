import Link from "next/link";
import type { Metadata } from "next";
import { Mark } from "@/components/brand/Mark";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ReceiptThumb } from "@/components/ui/ReceiptThumb";
import { DonateFooter } from "@/components/public/DonateFooter";
import { formatUsd } from "@/lib/mock/project";
import { getPublicProject, getPublicProjectSafe } from "@/lib/data/project";

type ProjectPageParams = { orgSlug: string; projectSlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<ProjectPageParams>;
}): Promise<Metadata> {
  const { orgSlug, projectSlug } = await params;
  const data = await getPublicProjectSafe(orgSlug, projectSlug);

  if (!data) {
    return { title: "Project not found — Amanah" };
  }

  const percent = data.goal > 0 ? Math.round((data.raised / data.goal) * 100) : 0;
  const title = `${data.project.title} — ${data.org.name}`;
  const description = `${formatUsd(data.raised)} raised of ${formatUsd(data.goal)} goal (${percent}%). Every expense is posted here with its receipt.`;

  return {
    title,
    description,
    openGraph: { title, description, siteName: "Amanah", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}) {
  const { orgSlug, projectSlug } = await params;
  const data = await getPublicProject(orgSlug, projectSlug);

  const reassurance = `${data.phases.length} phase${data.phases.length === 1 ? "" : "s"}. Every approved expense is posted here with its receipt.`;
  const isAcceptingDonations = data.project.status === "active";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-surface pb-[110px] min-[900px]:max-w-[980px] min-[900px]:pb-10">
      {/* Org header */}
      <header className="flex items-center gap-2.5 border-b border-hairline px-[18px] py-3.5 min-[900px]:px-8 min-[900px]:py-4">
        <Mark size={26} />
        <div className="flex flex-col">
          <span className="font-display text-[15px] font-semibold tracking-[0.01em] text-ink">
            {data.org.name}
          </span>
        </div>
        <Link
          href="/verified"
          className="ml-auto inline-flex items-center rounded-pill bg-accent-wash px-2 py-[5px] font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-accent"
        >
          Verified books
        </Link>
      </header>

      {data.project.status !== "active" && (
        <div className="border-b border-hairline bg-neutral-wash px-[18px] py-2.5 text-center font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-body">
          {data.project.status === "closed" ? "Project closed" : "Project archived"}
        </div>
      )}

      <div className="min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_320px] min-[900px]:items-start min-[900px]:gap-10 min-[900px]:px-8 min-[900px]:pt-2">
        <div className="min-w-0">
      {/* Title block */}
      <section className="flex flex-col gap-4 px-[18px] py-[22px] min-[900px]:px-0">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold leading-[1.2] tracking-[-0.025em] text-ink min-[900px]:text-display">
            {data.project.title}
          </h1>
          {data.project.isZakatEligible && (
            <Badge variant="confirmed" compact className="shrink-0">
              Zakat-eligible
            </Badge>
          )}
        </div>
        <p className="font-sans text-copy leading-[1.65] text-body">
          {data.project.description || reassurance}
        </p>
      </section>

      {/* Money block */}
      <section className="mx-[18px] flex items-end justify-between rounded-lg bg-accent-tint p-4 min-[900px]:mx-0 min-[900px]:p-5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-2xl font-medium text-ink min-[900px]:text-[30px]">
            {formatUsd(data.raised)}
          </span>
          <span className="text-meta text-body">raised of {formatUsd(data.goal)} goal</span>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="font-mono text-base font-medium text-ink">{formatUsd(data.spent)}</span>
          <span className="text-meta text-body">spent &amp; documented</span>
        </div>
      </section>

      {/* Phases */}
      <section className="flex flex-col gap-3.5 px-[18px] pt-6 min-[900px]:px-0">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.04em] text-muted">
          Phases
        </span>
        {data.phases.length === 0 && (
          <EmptyState
            icon="phases"
            title="No phases yet"
            description="This project hasn't been broken into funding phases yet. Check back soon."
            compact
          />
        )}
        {data.phases.map((phase) => {
          const rawPercent =
            phase.target > 0 ? Math.round((phase.raised / phase.target) * 100) : 0;
          const percent = Math.min(100, rawPercent);
          const label = phase.status === "complete" ? "text-ink" : "text-body";

          return (
            <div key={phase.id} className="flex flex-col gap-[7px]">
              <div className="flex items-center gap-2">
                <StatusDot status={phase.status} size={18} />
                <span className={`font-sans text-[14px] font-semibold ${label}`}>
                  {phase.index} · {phase.name}
                </span>
                {rawPercent > 100 && (
                  <Badge variant="success" compact>
                    +{rawPercent - 100}% over
                  </Badge>
                )}
                <span className="ml-auto font-mono text-meta text-body">{rawPercent}%</span>
              </div>
              {phase.description && (
                <p className="pl-[26px] text-meta leading-[1.55] text-body">
                  {phase.description}
                </p>
              )}
              <ProgressBar
                raised={phase.raised}
                target={phase.target}
                label={`${formatUsd(phase.raised)} of ${formatUsd(phase.target)}, ${percent} percent`}
              />
              <span className="font-mono text-micro text-muted">
                {formatUsd(phase.raised)} of {formatUsd(phase.target)} · {phase.caption}
              </span>
            </div>
          );
        })}
      </section>

      {/* Expenses */}
      <section className="mt-6 flex flex-col gap-3 border-t border-hairline px-[18px] py-[18px] min-[900px]:px-0">
        <div className="flex items-center">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.04em] text-muted">
            Approved expenses
          </span>
          {data.expensesTotal > 4 && (
            <Link
              href={`/${orgSlug}/${projectSlug}/expenses`}
              className="ml-auto font-sans text-[12.5px] font-semibold text-accent"
            >
              See all {data.expensesTotal}
            </Link>
          )}
        </div>

        {data.expenses.length === 0 && (
          <EmptyState
            icon="expenses"
            title="No expenses posted yet"
            description="Every approved expense shows up here with its receipt attached."
            compact
          />
        )}

        {data.expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-raised p-3 shadow-card"
          >
            <ReceiptThumb size={44} radius="rounded-sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-sans text-[13.5px] font-semibold text-ink">
                {expense.title}
              </span>
              <span className="truncate text-[11.5px] text-body">
                {expense.phaseLabel} · {expense.date}
              </span>
              <Badge variant="approved" compact>
                Approved
              </Badge>
            </div>
            <span className="whitespace-nowrap font-mono text-sm font-medium text-ink">
              {formatUsd(expense.amount)}
            </span>
          </div>
        ))}
      </section>
        </div>

        {/* Desktop: donate panel rides alongside the content instead of pinned. */}
        <DonateFooter
          variant="card"
          className="hidden min-[900px]:block"
          orgSlug={data.org.slug}
          projectId={data.project.id}
          projectSlug={data.project.slug}
          phaseId={data.activePhaseId}
          phaseLabel={data.activePhaseLabel}
          isAcceptingDonations={isAcceptingDonations}
        />
      </div>

      <DonateFooter
        className="min-[900px]:hidden"
        orgSlug={data.org.slug}
        projectId={data.project.id}
        projectSlug={data.project.slug}
        phaseId={data.activePhaseId}
        phaseLabel={data.activePhaseLabel}
        isAcceptingDonations={isAcceptingDonations}
      />
    </div>
  );
}
