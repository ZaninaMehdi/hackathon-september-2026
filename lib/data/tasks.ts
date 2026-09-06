import { createClient } from "@/lib/supabase/server";

export type TaskStatus = "todo" | "in_progress" | "done";

export type OrgTask = {
  id: string;
  title: string;
  status: TaskStatus;
  phaseId: string;
  phaseTitle: string;
  projectId: string;
  projectTitle: string;
};

export async function getOrgTasks(orgId: string): Promise<OrgTask[]> {
  const supabase = await createClient();

  const { data: taskRows } = await supabase
    .from("phase_tasks")
    .select("id, title, status, phase_id, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  const phaseIds = Array.from(new Set((taskRows ?? []).map((t) => t.phase_id)));
  const { data: phaseRows } = phaseIds.length
    ? await supabase.from("phases").select("id, title, project_id").in("id", phaseIds)
    : { data: [] as { id: string; title: string; project_id: string }[] };

  const projectIds = Array.from(new Set((phaseRows ?? []).map((p) => p.project_id)));
  const { data: projectRows } = projectIds.length
    ? await supabase.from("projects").select("id, title").in("id", projectIds)
    : { data: [] as { id: string; title: string }[] };

  const phaseById = new Map((phaseRows ?? []).map((p) => [p.id, p]));
  const projectTitleById = new Map((projectRows ?? []).map((p) => [p.id, p.title]));

  return (taskRows ?? []).map((t) => {
    const phase = phaseById.get(t.phase_id);
    return {
      id: t.id,
      title: t.title,
      status: t.status as TaskStatus,
      phaseId: t.phase_id,
      phaseTitle: phase?.title ?? "",
      projectId: phase?.project_id ?? "",
      projectTitle: phase ? (projectTitleById.get(phase.project_id) ?? "") : "",
    };
  });
}
