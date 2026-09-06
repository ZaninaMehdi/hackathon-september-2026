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
