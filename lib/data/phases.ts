import { createClient } from "@/lib/supabase/server";

export type PhaseOption = { id: string; label: string; remaining: number };

export async function getPhaseOptionsForProject(projectId: string): Promise<PhaseOption[]> {
  const supabase = await createClient();

  const [{ data: phases }, { data: expenses }] = await Promise.all([
    supabase
      .from("phases")
      .select("id, title, budget_target, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("expenses")
      .select("phase_id, amount")
      .eq("project_id", projectId)
      .eq("status", "approved"),
  ]);

  const spentByPhase = new Map<string, number>();
  for (const e of expenses ?? []) {
    if (e.phase_id) {
      spentByPhase.set(e.phase_id, (spentByPhase.get(e.phase_id) ?? 0) + Number(e.amount));
    }
  }

  return (phases ?? []).map((phase, i) => ({
    id: phase.id,
    label: `Phase ${i + 1} — ${phase.title}`,
    remaining: Number(phase.budget_target) - (spentByPhase.get(phase.id) ?? 0),
  }));
}

export type PhaseTask = { id: string; title: string; done: boolean; sortOrder: number };

export type ProjectPhaseDetail = {
  id: string;
  title: string;
  description: string;
  budgetTarget: number;
  raised: number;
  spent: number;
  sortOrder: number;
  hasActivity: boolean;
  tasks: PhaseTask[];
};

export async function getProjectPhaseDetails(projectId: string): Promise<ProjectPhaseDetail[]> {
  const supabase = await createClient();

  const [{ data: phases }, { data: donations }, { data: expenses }] = await Promise.all([
    supabase
      .from("phases")
      .select("id, title, description, budget_target, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase.from("donations").select("phase_id, amount").eq("project_id", projectId),
    supabase
      .from("expenses")
      .select("phase_id, amount")
      .eq("project_id", projectId)
      .eq("status", "approved"),
  ]);

  const phaseIds = (phases ?? []).map((p) => p.id);
  const { data: taskRows } = phaseIds.length
    ? await supabase
        .from("phase_tasks")
        .select("id, phase_id, title, done, sort_order")
        .in("phase_id", phaseIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const tasksByPhase = new Map<string, PhaseTask[]>();
  for (const t of taskRows ?? []) {
    const list = tasksByPhase.get(t.phase_id) ?? [];
    list.push({ id: t.id, title: t.title, done: t.done, sortOrder: t.sort_order });
    tasksByPhase.set(t.phase_id, list);
  }

  const raisedByPhase = new Map<string, number>();
  for (const d of donations ?? []) {
    if (d.phase_id) raisedByPhase.set(d.phase_id, (raisedByPhase.get(d.phase_id) ?? 0) + Number(d.amount));
  }

  const spentByPhase = new Map<string, number>();
  for (const e of expenses ?? []) {
    if (e.phase_id) spentByPhase.set(e.phase_id, (spentByPhase.get(e.phase_id) ?? 0) + Number(e.amount));
  }

  return (phases ?? []).map((phase) => {
    const raised = raisedByPhase.get(phase.id) ?? 0;
    const spent = spentByPhase.get(phase.id) ?? 0;
    return {
      id: phase.id,
      title: phase.title,
      description: phase.description ?? "",
      budgetTarget: Number(phase.budget_target),
      raised,
      spent,
      sortOrder: phase.sort_order,
      hasActivity: raised > 0 || spent > 0,
      tasks: tasksByPhase.get(phase.id) ?? [],
    };
  });
}

export type ProjectWithPhases = { projectId: string; projectTitle: string; phases: PhaseOption[] };

export async function getPhaseOptionsForOrg(orgId: string): Promise<ProjectWithPhases[]> {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const results = await Promise.all(
    (projects ?? []).map(async (project) => ({
      projectId: project.id,
      projectTitle: project.title,
      phases: await getPhaseOptionsForProject(project.id),
    }))
  );

  return results;
}
