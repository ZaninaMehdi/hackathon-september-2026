import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/actions/project";

export type OrgProject = {
  id: string;
  slug: string;
  title: string;
  status: ProjectStatus;
  totalGoal: number;
  phaseCount: number;
  isZakatEligible: boolean;
};

export async function getOrgProjects(
  orgId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {}
): Promise<
  {
    id: string;
    slug: string;
    title: string;
    status: ProjectStatus;
    totalGoal: number;
    createdAt: string;
    isZakatEligible: boolean;
  }[]
> {
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("id, slug, title, status, created_at, is_zakat_eligible")
    .eq("org_id", orgId);

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  const [{ data: projects }, { data: phases }] = await Promise.all([
    query.order("created_at", { ascending: false }),
    supabase.from("phases").select("project_id, budget_target").eq("org_id", orgId),
  ]);

  const goalByProject = new Map<string, number>();
  for (const phase of phases ?? []) {
    goalByProject.set(
      phase.project_id,
      (goalByProject.get(phase.project_id) ?? 0) + Number(phase.budget_target)
    );
  }

  return (projects ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status as ProjectStatus,
    totalGoal: goalByProject.get(p.id) ?? 0,
    createdAt: p.created_at,
    isZakatEligible: p.is_zakat_eligible,
  }));
}

export async function getLatestOrgProject(
  orgId: string,
  projectId?: string
): Promise<OrgProject | null> {
  const supabase = await createClient();

  const query = supabase
    .from("projects")
    .select("id, slug, title, status, is_zakat_eligible")
    .eq("org_id", orgId);

  const { data: project } = projectId
    ? await query.eq("id", projectId).maybeSingle()
    : await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (!project) return null;

  const { data: phases } = await supabase
    .from("phases")
    .select("budget_target")
    .eq("project_id", project.id);

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    status: project.status as ProjectStatus,
    totalGoal: (phases ?? []).reduce((sum, p) => sum + Number(p.budget_target), 0),
    phaseCount: phases?.length ?? 0,
    isZakatEligible: project.is_zakat_eligible,
  };
}

export type DonationRow = {
  id: string;
  donor: string;
  amount: number;
  date: string;
  projectTitle: string;
};
export type PostedExpenseRow = { id: string; title: string; amount: number; projectTitle: string };

export type DashboardData = {
  project: { id: string; title: string; phaseCount: number };
  stats: {
    raised: { amount: number; caption: string; percent: number | null };
    spent: { amount: number; caption: string };
    onHand: { amount: number; caption: string };
  };
  recentDonations: DonationRow[];
  approvedExpenses: PostedExpenseRow[];
};

export async function getDashboardData(orgId: string, projectId: string): Promise<DashboardData> {
  const supabase = await createClient();

  const [{ data: project }, { data: phases }, { data: donations }, { data: expenses }] =
    await Promise.all([
      supabase.from("projects").select("id, title").eq("id", projectId).maybeSingle(),
      supabase.from("phases").select("id, title, budget_target").eq("project_id", projectId),
      supabase
        .from("donations")
        .select("id, amount, donor_email, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("expenses")
        .select("id, description, amount, status, created_at")
        .eq("project_id", projectId)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
    ]);

  const allExpenses = expenses ?? [];
  const allDonations = donations ?? [];
  const totalGoal = (phases ?? []).reduce((sum, p) => sum + Number(p.budget_target), 0);

  const totalRaised = allDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalSpent = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const recentDonations: DonationRow[] = allDonations.slice(0, 4).map((d) => ({
    id: d.id,
    donor: d.donor_email ?? "Anonymous",
    amount: Number(d.amount),
    date: new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    projectTitle: project?.title ?? "",
  }));

  const approvedExpenseRows: PostedExpenseRow[] = allExpenses.slice(0, 4).map((e) => ({
    id: e.id,
    title: e.description ?? "Expense",
    amount: Number(e.amount),
    projectTitle: project?.title ?? "",
  }));

  return {
    project: {
      id: project?.id ?? projectId,
      title: project?.title ?? "",
      phaseCount: phases?.length ?? 0,
    },
    stats: {
      raised: {
        amount: totalRaised,
        caption: `${allDonations.length} gifts`,
        percent: percentOfGoal(totalRaised, totalGoal),
      },
      spent: { amount: totalSpent, caption: `${allExpenses.length} expenses` },
      onHand: {
        amount: totalRaised - totalSpent,
        caption: `across ${phases?.length ?? 0} phase funds`,
      },
    },
    recentDonations,
    approvedExpenses: approvedExpenseRows,
  };
}

export type ProjectSummary = {
  id: string;
  title: string;
  status: ProjectStatus;
  raised: number;
  goal: number;
  spent: number;
  phaseCount: number;
  isZakatEligible: boolean;
};

export type OrgOverviewStat = {
  amount: number;
  caption: string;
  percent?: number | null;
  trend?: { label: string; up: boolean } | null;
};

export type OrgOverview = {
  stats: {
    raised: OrgOverviewStat;
    remaining: OrgOverviewStat;
    onHand: OrgOverviewStat;
    thisMonth: OrgOverviewStat;
    donors: OrgOverviewStat;
    spent: OrgOverviewStat;
  };
  projects: ProjectSummary[];
  recentDonations: DonationRow[];
  approvedExpenses: PostedExpenseRow[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function percentOfGoal(raised: number, goal: number): number | null {
  if (!(goal > 0)) return null;
  return (raised / goal) * 100;
}

export function formatPercentOfGoal(percent: number): string {
  if (percent > 0 && percent < 1) {
    return `${percent < 0.1 ? percent.toFixed(2) : percent.toFixed(1)}% of goal`;
  }
  return `${Math.round(percent)}% of goal`;
}

function moneyWindow(donations: { amount: number; created_at: string }[], fromMs: number, toMs: number) {
  return donations.reduce((sum, donation) => {
    const created = Date.parse(donation.created_at);
    if (created >= fromMs && created < toMs) return sum + Number(donation.amount);
    return sum;
  }, 0);
}

export async function getOrgOverview(orgId: string): Promise<OrgOverview> {
  const supabase = await createClient();

  const [{ data: projects }, { data: phases }, { data: donations }, { data: expenses }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, title, status, is_zakat_eligible")
        .eq("org_id", orgId)
        .neq("status", "archived"),
      supabase.from("phases").select("id, project_id, budget_target").eq("org_id", orgId),
      supabase
        .from("donations")
        .select("id, project_id, amount, donor_email, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("expenses")
        .select("id, project_id, description, amount, status, created_at")
        .eq("org_id", orgId)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
    ]);

  const allProjects = projects ?? [];
  const allPhases = phases ?? [];
  const allDonations = donations ?? [];
  const allExpenses = expenses ?? [];

  const projectTitleById = new Map(allProjects.map((p) => [p.id, p.title]));
  const phaseCountByProject = new Map<string, number>();
  const goalByProject = new Map<string, number>();
  for (const phase of allPhases) {
    phaseCountByProject.set(phase.project_id, (phaseCountByProject.get(phase.project_id) ?? 0) + 1);
    goalByProject.set(
      phase.project_id,
      (goalByProject.get(phase.project_id) ?? 0) + Number(phase.budget_target)
    );
  }

  const donationsByProject = new Map<string, number>();
  for (const d of allDonations) {
    donationsByProject.set(d.project_id, (donationsByProject.get(d.project_id) ?? 0) + Number(d.amount));
  }

  const spentByProject = new Map<string, number>();
  for (const e of allExpenses) {
    spentByProject.set(e.project_id, (spentByProject.get(e.project_id) ?? 0) + Number(e.amount));
  }

  const projectSummaries: ProjectSummary[] = allProjects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status as ProjectStatus,
    raised: donationsByProject.get(p.id) ?? 0,
    goal: goalByProject.get(p.id) ?? 0,
    spent: spentByProject.get(p.id) ?? 0,
    phaseCount: phaseCountByProject.get(p.id) ?? 0,
    isZakatEligible: p.is_zakat_eligible,
  }));

  const totalRaised = allDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalSpent = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const visibleProjectIds = new Set(allProjects.map((project) => project.id));
  const totalGoal = allPhases.reduce((sum, phase) => {
    if (!visibleProjectIds.has(phase.project_id)) return sum;
    return sum + Number(phase.budget_target);
  }, 0);
  const remaining = Math.max(0, totalGoal - totalRaised);
  const uniqueDonors = new Set(
    allDonations.map((donation) => donation.donor_email?.trim().toLowerCase()).filter(Boolean)
  ).size;
  const avgGift = allDonations.length > 0 ? totalRaised / allDonations.length : 0;
  const spendShare = totalRaised > 0 ? Math.round((totalSpent / totalRaised) * 100) : 0;

  const now = Date.now();
  const thisMonthRaised = moneyWindow(allDonations, now - 30 * DAY_MS, now + DAY_MS);
  const priorMonthRaised = moneyWindow(allDonations, now - 60 * DAY_MS, now - 30 * DAY_MS);
  const monthDelta =
    priorMonthRaised > 0
      ? Math.round(((thisMonthRaised - priorMonthRaised) / priorMonthRaised) * 100)
      : null;

  const recentDonations: DonationRow[] = allDonations.slice(0, 6).map((d) => ({
    id: d.id,
    donor: d.donor_email ?? "Anonymous",
    amount: Number(d.amount),
    date: new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    projectTitle: projectTitleById.get(d.project_id) ?? "",
  }));

  const approvedExpenseRows: PostedExpenseRow[] = allExpenses.slice(0, 6).map((e) => ({
    id: e.id,
    title: e.description ?? "Expense",
    amount: Number(e.amount),
    projectTitle: projectTitleById.get(e.project_id) ?? "",
  }));

  return {
    stats: {
      raised: {
        amount: totalRaised,
        caption: `${allDonations.length} gift${allDonations.length === 1 ? "" : "s"} across open books`,
        percent: percentOfGoal(totalRaised, totalGoal),
      },
      remaining: {
        amount: remaining,
        caption:
          totalGoal <= 0
            ? "Set phase goals to track the gap"
            : remaining === 0
              ? "Every published goal is met"
              : `${Math.round((remaining / totalGoal) * 100)}% of the published goal left`,
      },
      onHand: {
        amount: totalRaised - totalSpent,
        caption: `Unspent across ${allProjects.length} campaign${allProjects.length === 1 ? "" : "s"}`,
      },
      thisMonth: {
        amount: thisMonthRaised,
        caption:
          monthDelta == null
            ? priorMonthRaised === 0 && thisMonthRaised === 0
              ? "No gifts in the last 30 days"
              : "No gifts in the prior 30 days to compare"
            : "Last 30 days vs the 30 before",
        trend:
          monthDelta == null
            ? null
            : { label: `${monthDelta > 0 ? "+" : ""}${monthDelta}%`, up: monthDelta >= 0 },
      },
      donors: {
        amount: uniqueDonors,
        caption:
          uniqueDonors === 0
            ? "No identified donors yet"
            : `Avg gift ${avgGift.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`,
      },
      spent: {
        amount: totalSpent,
        caption:
          allExpenses.length === 0
            ? "No posted expenses yet"
            : `${allExpenses.length} receipt${allExpenses.length === 1 ? "" : "s"} · ${spendShare}% of raised`,
      },
    },
    projects: projectSummaries,
    recentDonations,
    approvedExpenses: approvedExpenseRows,
  };
}
