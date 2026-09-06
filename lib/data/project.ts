import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PhaseStatus = "complete" | "in_progress" | "not_started" | "pending_approval";

export type PublicPhase = {
  id: string;
  index: number;
  name: string;
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
  project: { id: string; slug: string; title: string; description: string | null };
  raised: number;
  goal: number;
  spent: number;
  activePhaseLabel: string;
  activePhaseId: string | null;
  phases: PublicPhase[];
  expenses: PublicExpense[];
  expensesTotal: number;
};

export async function getPublicProject(
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
    .select("id, slug, title, description, total_goal, org_id")
    .eq("slug", projectSlug)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: phaseRows }, { data: donationRows }, { data: expenseRows }] = await Promise.all([
    supabase
      .from("phases")
      .select("id, title, budget_target, sort_order")
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
    },
    raised: totalRaised,
    goal: Number(project.total_goal),
    spent: totalSpent,
    activePhaseLabel: activePhase?.name ?? "",
    activePhaseId: activePhase?.id ?? null,
    phases: publicPhases,
    expenses: publicExpenses,
    expensesTotal: expenses.length,
  };
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
