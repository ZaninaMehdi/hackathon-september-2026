import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { formatUsd } from "@/lib/mock/project";
import { requireMemberContext } from "@/lib/auth/session";
import { getDashboardData, getLatestOrgProject } from "@/lib/data/dashboard";
import { getProjectPhaseDetails, type ProjectWithPhases } from "@/lib/data/phases";
import { AddExpenseButton } from "@/components/dashboard/AddExpenseButton";
import { ShareProjectModal } from "@/components/dashboard/ShareProjectModal";
import { ProjectManageMenu } from "@/components/dashboard/ProjectManageMenu";
import { PhaseManager } from "@/components/dashboard/PhaseManager";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requireMemberContext();
  const project = await getLatestOrgProject(context.orgId, projectId);

  if (!project) notFound();

  const { stats, recentDonations, approvedExpenses } = await getDashboardData(
    context.orgId,
    project.id
  );

  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");
  const phaseDetails = await getProjectPhaseDetails(project.id);

  const expenseProjects: ProjectWithPhases[] = canManage
    ? [
        {
          projectId: project.id,
          projectTitle: project.title,
          phases: phaseDetails.map((p) => ({
            id: p.id,
            label: p.title,
            remaining: p.budgetTarget - p.spent,
          })),
        },
      ]
    : [];

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/${context.orgSlug}/${project.slug}`;

  return (
    <>
      <div className="flex items-center gap-4 border-b border-hairline px-4 py-4.5 min-[900px]:px-6">
        <div className="flex flex-col">
          <Link
            href="/dashboard"
            className={buttonClasses({
              variant: "ghost",
              size: "sm",
              className: "-ml-3 self-start text-accent",
            })}
          >
            ← Overview
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
              {project.title}
            </h1>
            {project.status !== "active" && (
              <Badge variant="draft" compact className="shrink-0">
                {project.status}
              </Badge>
            )}
          </div>
          <span className="text-xs text-body">{project.phaseCount} phases</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ShareProjectModal publicUrl={publicUrl} />
          {canManage && <AddExpenseButton projects={expenseProjects} />}
          {canManage && (
            <ProjectManageMenu
              projectId={project.id}
              status={project.status}
              hasFinancialActivity={stats.raised.amount > 0 || stats.spent.amount > 0}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4 min-[900px]:p-6">
        <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-3">
          <StatCard
            eyebrow="Raised"
            figure={formatUsd(stats.raised.amount)}
            caption={stats.raised.caption}
            percent={stats.raised.percent}
          />
          <StatCard eyebrow="Spent" figure={formatUsd(stats.spent.amount)} caption={stats.spent.caption} />
          <StatCard eyebrow="On hand" figure={formatUsd(stats.onHand.amount)} caption={stats.onHand.caption} />
        </div>

        <PhaseManager projectId={project.id} phases={phaseDetails} canManage={canManage} />

        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
          <div>
            <h2 className="mb-2.5 text-sm font-bold text-ink">Recent donations</h2>
            {recentDonations.length === 0 ? (
              <p className="rounded-lg border border-hairline p-4 text-sm text-body">
                No donations yet.
              </p>
            ) : (
              <div className="rounded-lg border border-hairline">
                {recentDonations.map((donation, i) => (
                  <div
                    key={donation.id}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-meta ${
                      i !== recentDonations.length - 1 ? "border-b border-hairline-soft" : ""
                    }`}
                  >
                    <span className="truncate font-semibold text-ink">{donation.donor}</span>
                    <span className="ml-auto whitespace-nowrap font-mono text-ink">
                      {formatUsd(donation.amount)}
                    </span>
                    <span className="w-[52px] shrink-0 text-right font-mono text-micro text-muted">
                      {donation.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-2.5 text-sm font-bold text-ink">Expenses</h2>
            {approvedExpenses.length === 0 ? (
              <p className="rounded-lg border border-hairline p-4 text-sm text-body">
                No expenses logged yet.
              </p>
            ) : (
              <div className="rounded-lg border border-hairline">
                {approvedExpenses.map((expense, i) => (
                  <Link
                    key={expense.id}
                    href={`/dashboard/expenses/${expense.id}`}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 text-meta hover:bg-surface-sunken ${
                      i !== approvedExpenses.length - 1 ? "border-b border-hairline-soft" : ""
                    }`}
                  >
                    <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-accent">
                      <svg width="7" height="7" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path
                          d="M1.5 5.2L3.8 7.5L8.5 2.5"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="truncate text-ink">{expense.title}</span>
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
}: {
  eyebrow: string;
  figure: string;
  caption: string;
  percent?: number | null;
}) {
  return (
    <div className="flex flex-col gap-[5px] rounded-lg border border-hairline p-3.5">
      <span className="text-micro font-semibold uppercase text-muted">{eyebrow}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[21px] font-medium text-ink">{figure}</span>
        {percent != null && (
          <span className="rounded-pill bg-accent-wash px-2 py-[2px] font-mono text-micro font-semibold text-accent">
            {percent}% of goal
          </span>
        )}
      </div>
      <span className="text-micro text-body">{caption}</span>
    </div>
  );
}
