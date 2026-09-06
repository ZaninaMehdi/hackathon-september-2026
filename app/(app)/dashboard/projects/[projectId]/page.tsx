import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUsd } from "@/lib/mock/project";
import { requireMemberContext } from "@/lib/auth/session";
import { getDashboardData, getLatestOrgProject } from "@/lib/data/dashboard";
import { getPhaseOptionsForProject, type ProjectWithPhases } from "@/lib/data/phases";
import { DashboardActionBar } from "@/components/dashboard/DashboardActionBar";

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

  let expenseProjects: ProjectWithPhases[] = [];
  if (canManage) {
    const phases = await getPhaseOptionsForProject(project.id);
    expenseProjects = [{ projectId: project.id, projectTitle: project.title, phases }];
  }

  return (
    <>
      <div className="flex items-center gap-4 border-b border-hairline px-4 py-4.5 min-[900px]:px-6">
        <div className="flex flex-col">
          <Link href="/dashboard" className="text-[12px] font-semibold text-accent">
            ← Overview
          </Link>
          <h1 className="text-[19px] font-bold tracking-[-0.02em] text-ink">{project.title}</h1>
          <span className="text-xs text-body">{project.phaseCount} phases</span>
        </div>
        {canManage && <DashboardActionBar projects={expenseProjects} />}
      </div>

      <div className="flex flex-col gap-5 p-4 min-[900px]:p-6">
        <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-3">
          <StatCard eyebrow="Raised" figure={formatUsd(stats.raised.amount)} caption={stats.raised.caption} />
          <StatCard eyebrow="Spent" figure={formatUsd(stats.spent.amount)} caption={stats.spent.caption} />
          <StatCard eyebrow="On hand" figure={formatUsd(stats.onHand.amount)} caption={stats.onHand.caption} />
        </div>

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
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-[13px] ${
                      i !== recentDonations.length - 1 ? "border-b border-hairline-soft" : ""
                    }`}
                  >
                    <span className="truncate font-semibold text-ink">{donation.donor}</span>
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
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] hover:bg-surface-sunken ${
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
}: {
  eyebrow: string;
  figure: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col gap-[5px] rounded-lg border border-hairline p-3.5">
      <span className="text-[11.5px] font-semibold uppercase text-muted">{eyebrow}</span>
      <span className="font-mono text-[21px] font-medium text-ink">{figure}</span>
      <span className="text-[11.5px] text-body">{caption}</span>
    </div>
  );
}
