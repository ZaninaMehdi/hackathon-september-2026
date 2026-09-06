import Link from "next/link";
import { Mark } from "@/components/brand/Mark";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ReceiptThumb } from "@/components/ui/ReceiptThumb";
import { DonateFooter } from "@/components/public/DonateFooter";
import { formatUsd } from "@/lib/mock/project";
import { getPublicProject } from "@/lib/data/project";

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectId: string }>;
}) {
  const { orgSlug, projectId } = await params;
  const data = await getPublicProject(orgSlug, projectId);

  const reassurance = `${data.phases.length} phase${data.phases.length === 1 ? "" : "s"}. Every approved expense is posted here with its receipt.`;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-surface pb-[110px]">
      {/* Org header */}
      <header className="flex items-center gap-2.5 border-b border-hairline px-[18px] py-3.5">
        <Mark size={26} />
        <div className="flex flex-col">
          <span className="font-sans text-[14px] font-semibold text-ink">{data.org.name}</span>
        </div>
        <Link
          href="/verified"
          className="ml-auto inline-flex items-center rounded-pill bg-accent-wash px-2 py-[5px] font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-accent"
        >
          Verified books
        </Link>
      </header>

      {/* Title block */}
      <section className="flex flex-col gap-4 px-[18px] py-[22px]">
        <h1 className="font-sans text-2xl font-bold leading-[1.2] tracking-[-0.025em] text-ink">
          {data.project.title}
        </h1>
        <p className="font-sans text-sm leading-[1.6] text-body">
          {data.project.description || reassurance}
        </p>
      </section>

      {/* Money block */}
      <section className="mx-[18px] flex items-end justify-between rounded-lg bg-accent-tint p-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-2xl font-medium text-ink">
            {formatUsd(data.raised)}
          </span>
          <span className="text-[11.5px] text-body">raised of {formatUsd(data.goal)} goal</span>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="font-mono text-base font-medium text-ink">{formatUsd(data.spent)}</span>
          <span className="text-[11.5px] text-body">spent &amp; documented</span>
        </div>
      </section>

      {/* Phases */}
      <section className="flex flex-col gap-3.5 px-[18px] pt-6">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.04em] text-muted">
          Phases
        </span>
        {data.phases.length === 0 && (
          <p className="text-sm text-body">No phases have been set up for this project yet.</p>
        )}
        {data.phases.map((phase) => {
          const percent =
            phase.target > 0 ? Math.min(100, Math.round((phase.raised / phase.target) * 100)) : 0;
          const label = phase.status === "complete" ? "text-ink" : "text-body";

          return (
            <div key={phase.id} className="flex flex-col gap-[7px]">
              <div className="flex items-center gap-2">
                <StatusDot status={phase.status} size={18} />
                <span className={`font-sans text-sm font-semibold ${label}`}>
                  {phase.index} · {phase.name}
                </span>
                <span className="ml-auto font-mono text-xs text-body">{percent}%</span>
              </div>
              <ProgressBar
                raised={phase.raised}
                target={phase.target}
                label={`${formatUsd(phase.raised)} of ${formatUsd(phase.target)}, ${percent} percent`}
              />
              <span className="font-mono text-[11px] text-muted">
                {formatUsd(phase.raised)} of {formatUsd(phase.target)} · {phase.caption}
              </span>
            </div>
          );
        })}
      </section>

      {/* Expenses */}
      <section className="mt-6 flex flex-col gap-3 border-t border-hairline px-[18px] py-[18px]">
        <div className="flex items-center">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.04em] text-muted">
            Approved expenses
          </span>
          {data.expensesTotal > 4 && (
            <Link
              href={`/${orgSlug}/${projectId}/expenses`}
              className="ml-auto font-sans text-[12.5px] font-semibold text-accent"
            >
              See all {data.expensesTotal}
            </Link>
          )}
        </div>

        {data.expenses.length === 0 && (
          <p className="text-sm text-body">
            No expenses posted yet. The first recorded expense appears here.
          </p>
        )}

        {data.expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-raised p-3"
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

      <DonateFooter
        orgSlug={data.org.slug}
        projectId={data.project.id}
        phaseId={data.activePhaseId}
        phaseLabel={data.activePhaseLabel}
      />
    </div>
  );
}
