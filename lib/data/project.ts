import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/actions/project";

export type PhaseStatus = "complete" | "in_progress" | "not_started" | "pending_approval";

export const getPublicOrgBySlug = cache(async function getPublicOrgBySlug(orgSlug: string) {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  return org;
});

export type PublicPhase = {
  id: string;
  index: number;
  name: string;
  description: string;
  raised: number;
  target: number;
  status: PhaseStatus;
  caption: string;
};

export type PublicExpense = {
  id: string;
  title: string;
  phaseLabel: string;
  date: string;
  amount: number;
};

export type PublicProjectData = {
  org: { id: string; name: string; slug: string };
  project: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    status: ProjectStatus;
  };
  raised: number;
  goal: number;
  spent: number;
  activePhaseLabel: string;
  activePhaseId: string | null;
  phases: PublicPhase[];
  expenses: PublicExpense[];
  expensesTotal: number;
};

export type PublicProjectSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  raised: number;
  goal: number;
  phaseCount: number;
};

export type PublicOrgHome = {
  org: { id: string; name: string; slug: string };
  projects: PublicProjectSummary[];
  totalRaised: number;
  totalGoal: number;
};

export const getPublicOrgHome = cache(async function getPublicOrgHome(
  orgSlug: string
): Promise<PublicOrgHome> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  const [{ data: projects }, { data: phases }, { data: donations }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, slug, title, description, status")
      .eq("org_id", org.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    supabase.from("phases").select("project_id, budget_target").eq("org_id", org.id),
    supabase.from("donations").select("project_id, amount").eq("org_id", org.id),
  ]);

  const goalByProject = new Map<string, number>();
  const phaseCountByProject = new Map<string, number>();
  for (const p of phases ?? []) {
    goalByProject.set(p.project_id, (goalByProject.get(p.project_id) ?? 0) + Number(p.budget_target));
    phaseCountByProject.set(p.project_id, (phaseCountByProject.get(p.project_id) ?? 0) + 1);
  }

  const raisedByProject = new Map<string, number>();
  for (const d of donations ?? []) {
    raisedByProject.set(d.project_id, (raisedByProject.get(d.project_id) ?? 0) + Number(d.amount));
  }

  const projectSummaries: PublicProjectSummary[] = (projects ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    status: p.status as ProjectStatus,
    raised: raisedByProject.get(p.id) ?? 0,
    goal: goalByProject.get(p.id) ?? 0,
    phaseCount: phaseCountByProject.get(p.id) ?? 0,
  }));

  return {
    org: { id: org.id, name: org.name, slug: org.slug },
    projects: projectSummaries,
    totalRaised: projectSummaries.reduce((sum, p) => sum + p.raised, 0),
    totalGoal: projectSummaries.reduce((sum, p) => sum + p.goal, 0),
  };
});

export const getPublicProject = cache(async function getPublicProject(
  orgSlug: string,
  projectSlug: string
): Promise<PublicProjectData> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, title, description, status, org_id")
    .eq("slug", projectSlug)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: phaseRows }, { data: donationRows }, { data: expenseRows }] = await Promise.all([
    supabase
      .from("phases")
      .select("id, title, description, budget_target, sort_order")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true }),
    supabase.from("donations").select("amount, phase_id").eq("project_id", project.id),
    supabase
      .from("expenses")
      .select("id, description, amount, phase_id, created_at")
      .eq("project_id", project.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  const phases = phaseRows ?? [];
  const donations = donationRows ?? [];
  const expenses = expenseRows ?? [];

  const raisedByPhase = new Map<string, number>();
  let totalRaised = 0;
  for (const d of donations) {
    totalRaised += Number(d.amount);
    if (d.phase_id) {
      raisedByPhase.set(d.phase_id, (raisedByPhase.get(d.phase_id) ?? 0) + Number(d.amount));
    }
  }

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalGoal = phases.reduce((sum, p) => sum + Number(p.budget_target), 0);
  const phaseTitleById = new Map(phases.map((p) => [p.id, p.title]));

  const publicPhases: PublicPhase[] = phases.map((phase, i) => {
    const raised = raisedByPhase.get(phase.id) ?? 0;
    const target = Number(phase.budget_target);
    const complete = target > 0 && raised >= target;
    let status: PhaseStatus = "not_started";
    let caption = "not started";
    if (complete) {
      status = "complete";
      caption = "closed";
    } else if (raised > 0) {
      status = "in_progress";
      caption = "in progress";
    }
    return {
      id: phase.id,
      index: i + 1,
      name: phase.title,
      description: phase.description ?? "",
      raised,
      target,
      status,
      caption,
    };
  });

  const activePhase =
    publicPhases.find((p) => p.status === "in_progress") ??
    publicPhases.find((p) => p.status === "not_started") ??
    null;

  const publicExpenses: PublicExpense[] = expenses.slice(0, 4).map((e) => ({
    id: e.id,
    title: e.description ?? "Expense",
    phaseLabel: e.phase_id ? (phaseTitleById.get(e.phase_id) ?? "") : "",
    date: new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount: Number(e.amount),
  }));

  return {
    org: { id: org.id, name: org.name, slug: org.slug },
    project: {
      id: project.id,
      slug: project.slug,
      title: project.title,
      description: project.description,
      status: project.status as ProjectStatus,
    },
    raised: totalRaised,
    goal: totalGoal,
    spent: totalSpent,
    activePhaseLabel: activePhase?.name ?? "",
    activePhaseId: activePhase?.id ?? null,
    phases: publicPhases,
    expenses: publicExpenses,
    expensesTotal: expenses.length,
  };
});

export async function getPublicProjectSafe(
  orgSlug: string,
  projectSlug: string
): Promise<PublicProjectData | null> {
  try {
    return await getPublicProject(orgSlug, projectSlug);
  } catch {
    return null;
  }
}

export type LedgerEntry = { id: string; title: string; phaseLabel: string; date: string; amount: number };

export async function getProjectLedger(
  orgSlug: string,
  projectSlug: string
): Promise<{ org: { name: string }; project: { title: string }; entries: LedgerEntry[] }> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("slug", projectSlug)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: phases }, { data: expenseRows }] = await Promise.all([
    supabase.from("phases").select("id, title").eq("project_id", project.id),
    supabase
      .from("expenses")
      .select("id, description, amount, phase_id, created_at")
      .eq("project_id", project.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  const phaseTitleById = new Map((phases ?? []).map((p) => [p.id, p.title]));

  return {
    org: { name: org.name },
    project: { title: project.title },
    entries: (expenseRows ?? []).map((e) => ({
      id: e.id,
      title: e.description ?? "Expense",
      phaseLabel: e.phase_id ? (phaseTitleById.get(e.phase_id) ?? "") : "",
      date: new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: Number(e.amount),
    })),
  };
}
