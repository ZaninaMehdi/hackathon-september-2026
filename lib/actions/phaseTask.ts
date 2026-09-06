"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/data/tasks";

function revalidateTaskPaths(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/tasks");
}

async function getOwnedPhase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  phaseId: string
) {
  const { data: phase } = await supabase
    .from("phases")
    .select("id, org_id, project_id")
    .eq("id", phaseId)
    .maybeSingle();

  if (!phase || phase.org_id !== orgId) {
    throw new Error("Phase not found.");
  }

  return phase;
}

async function getOwnedTask(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  taskId: string
) {
  const { data: task } = await supabase
    .from("phase_tasks")
    .select("id, org_id, phase_id, phases(project_id)")
    .eq("id", taskId)
    .maybeSingle();

  if (!task || task.org_id !== orgId) {
    throw new Error("Task not found.");
  }

  const projectId = (task.phases as unknown as { project_id: string } | null)?.project_id;
  if (!projectId) throw new Error("Task not found.");

  return { ...task, projectId };
}

export async function createPhaseTask(phaseId: string, title: string) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const phase = await getOwnedPhase(supabase, context.orgId, phaseId);

  const { count } = await supabase
    .from("phase_tasks")
    .select("id", { count: "exact", head: true })
    .eq("phase_id", phaseId);

  const { error } = await supabase.from("phase_tasks").insert({
    phase_id: phaseId,
    org_id: context.orgId,
    title,
    sort_order: count ?? 0,
  });

  if (error) throw new Error(error.message);

  revalidateTaskPaths(phase.project_id);
}

export async function setPhaseTaskStatus(taskId: string, status: TaskStatus) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const task = await getOwnedTask(supabase, context.orgId, taskId);

  const { error } = await supabase.from("phase_tasks").update({ status }).eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidateTaskPaths(task.projectId);
}

export async function deletePhaseTask(taskId: string) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const task = await getOwnedTask(supabase, context.orgId, taskId);

  const { error } = await supabase.from("phase_tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidateTaskPaths(task.projectId);
}
