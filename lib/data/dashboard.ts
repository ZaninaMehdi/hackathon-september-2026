import { createClient } from "@/lib/supabase/server";

export type OrgProject = {
  id: string;
  title: string;
  totalGoal: number;
  phaseCount: number;
};

export async function getOrgProjects(
  orgId: string
): Promise<{ id: string; title: string; totalGoal: number; createdAt: string }[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("id, title, total_goal, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    totalGoal: Number(p.total_goal),
    createdAt: p.created_at,
  }));
}

export async function getLatestOrgProject(
  orgId: string,
  projectId?: string
): Promise<OrgProject | null> {
  const supabase = await createClient();

  const query = supabase.from("projects").select("id, title, total_goal").eq("org_id", orgId);

  const { data: project } = projectId
    ? await query.eq("id", projectId).maybeSingle()
    : await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (!project) return null;

  const { count } = await supabase
    .from("phases")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);

  return {
    id: project.id,
    title: project.title,
    totalGoal: Number(project.total_goal),
    phaseCount: count ?? 0,
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
    raised: { amount: number; caption: string };
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
      supabase.from("projects").select("id, title, total_goal").eq("id", projectId).maybeSingle(),
      supabase.from("phases").select("id, title").eq("project_id", projectId),
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
      raised: { amount: totalRaised, caption: `${allDonations.length} gifts` },
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
  raised: number;
  goal: number;
  spent: number;
  phaseCount: number;
};

export type OrgOverview = {
  stats: {
    raised: { amount: number; caption: string };
    spent: { amount: number; caption: string };
    onHand: { amount: number; caption: string };
  };
  projects: ProjectSummary[];
  recentDonations: DonationRow[];
  approvedExpenses: PostedExpenseRow[];
};

export async function getOrgOverview(orgId: string): Promise<OrgOverview> {
  const supabase = await createClient();

  const [{ data: projects }, { data: phases }, { data: donations }, { data: expenses }] =
    await Promise.all([
      supabase.from("projects").select("id, title, total_goal").eq("org_id", orgId),
      supabase.from("phases").select("id, project_id").eq("org_id", orgId),
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
  for (const phase of allPhases) {
    phaseCountByProject.set(phase.project_id, (phaseCountByProject.get(phase.project_id) ?? 0) + 1);
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
    raised: donationsByProject.get(p.id) ?? 0,
    goal: Number(p.total_goal),
    spent: spentByProject.get(p.id) ?? 0,
    phaseCount: phaseCountByProject.get(p.id) ?? 0,
  }));

  const totalRaised = allDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalSpent = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
      raised: { amount: totalRaised, caption: `${allDonations.length} gifts` },
      spent: { amount: totalSpent, caption: `${allExpenses.length} expenses` },
      onHand: {
        amount: totalRaised - totalSpent,
        caption: `across ${allProjects.length} project${allProjects.length === 1 ? "" : "s"}`,
      },
    },
    projects: projectSummaries,
    recentDonations,
    approvedExpenses: approvedExpenseRows,
  };
}
