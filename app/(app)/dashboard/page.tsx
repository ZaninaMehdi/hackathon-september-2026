import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatUsd } from "@/lib/mock/project";
import { requireMemberContext } from "@/lib/auth/session";
import { formatPercentOfGoal, getOrgOverview } from "@/lib/data/dashboard";
import { getPhaseOptionsForOrg } from "@/lib/data/phases";
import { DashboardActionBar } from "@/components/dashboard/DashboardActionBar";
import { ExternalLinkIcon } from "@/components/dashboard/NavIcons";
import { NewProjectButton } from "@/components/dashboard/NewProjectButton";
import { buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function DashboardOverviewPage() {
  const context = await requireMemberContext();
  const { stats, projects, recentDonations, approvedExpenses } = await getOrgOverview(context.orgId);

  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");
  const expenseProjects = canManage ? await getPhaseOptionsForOrg(context.orgId) : [];

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-hairline px-4 py-5 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between min-[900px]:px-6">
        <div className="min-w-0">
          <p className="font-mono text-micro font-medium uppercase tracking-[0.08em] text-muted">
            Overview
          </p>
          <h1 className="mt-1 font-display text-display font-bold tracking-[-0.03em] text-ink">
            {context.orgName}
          </h1>
          <p className="mt-1 text-meta text-body">
            {projects.length} campaign{projects.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 min-[900px]:pt-1">
          {/* Not gated on canManage — every member can look at what the
              community sees, they just can't change it. */}
          {context.orgSlug && (
            <Link
              href={`/${context.orgSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Opens ${context.orgName}'s public page in a new tab`}
              className={buttonClasses({ variant: "secondary" })}
            >
              <ExternalLinkIcon />
              View live page
            </Link>
          )}
          {canManage && <DashboardActionBar projects={expenseProjects} />}
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4 min-[900px]:p-6">
        <div className="grid grid-cols-1 gap-2 min-[900px]:grid-cols-3">
          <StatCard
            eyebrow="Raised"
            figure={formatUsd(stats.raised.amount)}
            caption={stats.raised.caption}
            percent={stats.raised.percent}
          />
          <StatCard
            eyebrow="Still to raise"
            figure={formatUsd(stats.remaining.amount)}
            caption={stats.remaining.caption}
          />
          <StatCard
            eyebrow="On hand"
            figure={formatUsd(stats.onHand.amount)}
            caption={stats.onHand.caption}
          />
          <StatCard
            eyebrow="Last 30 days"
            figure={formatUsd(stats.thisMonth.amount)}
            caption={stats.thisMonth.caption}
            trend={stats.thisMonth.trend}
          />
          <StatCard
            eyebrow="Donors"
            figure={stats.donors.amount.toLocaleString("en-US")}
            caption={stats.donors.caption}
          />
          <StatCard
            eyebrow="Spent & documented"
            figure={formatUsd(stats.spent.amount)}
            caption={stats.spent.caption}
          />
        </div>

        {/* Projects grid */}
        <div>
          <div className="mb-2.5 flex items-baseline gap-3">
            <h2 className="text-subhead font-semibold text-ink">Campaigns</h2>
            {canManage && (
              <NewProjectButton className={buttonClasses({ variant: "ghost", size: "sm", className: "ml-auto text-accent" })}>
                New campaign
              </NewProjectButton>
            )}
          </div>
          {projects.length === 0 ? (
            <EmptyState
              icon="projects"
              title="No campaigns yet"
              description="Create your first campaign and break it into phases to start tracking donations and expenses."
              action={
                canManage ? (
                  <NewProjectButton className={buttonClasses({ size: "lg" })}>
                    Create a campaign
                  </NewProjectButton>
                ) : null
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-2 min-[1200px]:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex flex-col gap-2.5 rounded-lg border border-hairline bg-surface-raised p-4 shadow-card transition-shadow duration-150 hover:shadow-lift"
                >
                  {project.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.coverImageUrl}
                      alt=""
                      className="-mx-4 -mt-4 h-28 w-[calc(100%+2rem)] rounded-t-lg object-cover"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="truncate text-copy font-semibold text-ink">{project.title}</span>
                    {project.status === "closed" && (
                      <Badge variant="draft" compact className="shrink-0">
                        closed
                      </Badge>
                    )}
                    {project.goal > 0 && project.raised > project.goal && (
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
                  <ProgressBar
                    raised={project.raised}
                    target={project.goal}
                    label={`${formatUsd(project.raised)} of ${formatUsd(project.goal)}`}
                  />
                  <div className="flex items-center justify-between font-mono text-[11.5px] text-muted">
                    <span>
                      {formatUsd(project.raised)} raised
                      {project.goal > 0 && ` · ${Math.round((project.raised / project.goal) * 100)}%`}
                    </span>
                    <span>{project.phaseCount} phases</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Two side-by-side lists — stack below 900px */}
        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
          <div>
            <h2 className="mb-2.5 text-subhead font-semibold text-ink">Recent donations</h2>
            {recentDonations.length === 0 ? (
              <EmptyState
                icon="donations"
                title="No donations yet"
                description="Share a project's public page and gifts will appear here as they come in."
                compact
              />
            ) : (
              <div className="rounded-lg border border-hairline">
                {recentDonations.map((donation, i) => (
                  <div
                    key={donation.id}
                    className={`flex items-center gap-2 px-3.5 py-3 text-meta ${
                      i !== recentDonations.length - 1 ? "border-b border-hairline-soft" : ""
                    }`}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold text-ink">{donation.donor}</span>
                      <span className="truncate text-[11px] text-muted">{donation.projectTitle}</span>
                    </div>
                    <span className="ml-auto whitespace-nowrap font-mono text-ink">
                      {formatUsd(donation.amount)}
                    </span>
                    <span className="w-[52px] shrink-0 text-right font-mono text-[11px] text-muted">
                      {donation.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-2.5 text-subhead font-semibold text-ink">Expenses</h2>
            {approvedExpenses.length === 0 ? (
              <EmptyState
                icon="expenses"
                title="No expenses logged yet"
                description="Every expense you log is published with its receipt on the public page."
                compact
              />
            ) : (
              <div className="rounded-lg border border-hairline">
                {approvedExpenses.map((expense, i) => (
                  <Link
                    key={expense.id}
                    href={`/dashboard/expenses/${expense.id}`}
                    className={`flex items-center gap-2.5 px-3.5 py-3 text-meta transition-colors hover:bg-surface-sunken ${
                      i !== approvedExpenses.length - 1 ? "border-b border-hairline-soft" : ""
                    }`}
                  >
                    <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-accent">
                      <svg width="7" height="7" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path
                          d="M1.5 5.2L3.8 7.5L8.5 2.5"
                          className="stroke-on-accent"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-ink">{expense.title}</span>
                      <span className="truncate text-[11px] text-muted">{expense.projectTitle}</span>
                    </div>
                    <span className="ml-auto whitespace-nowrap font-mono text-ink">
                      {formatUsd(expense.amount)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  eyebrow,
  figure,
  caption,
  percent,
  trend,
}: {
  eyebrow: string;
  figure: string;
  caption: string;
  percent?: number | null;
  trend?: { label: string; up: boolean } | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface-raised px-3 py-2.5 shadow-card">
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.07em] text-muted">
        {eyebrow}
      </span>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="font-mono text-[20px] font-medium tracking-[-0.01em] text-ink">{figure}</span>
        {percent != null && (
          <span className="rounded-pill bg-accent-wash px-2 py-[3px] font-mono text-[10px] font-semibold text-accent">
            {formatPercentOfGoal(percent)}
          </span>
        )}
        {trend && (
          <span
            className={`rounded-pill px-2 py-[3px] font-mono text-[10px] font-semibold ${
              trend.up ? "bg-success-wash text-success" : "bg-danger-wash text-danger"
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>
      <span className="text-micro text-body">{caption}</span>
    </div>
  );
}
