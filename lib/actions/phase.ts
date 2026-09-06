"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

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

export type CreatePhaseInput = {
  projectId: string;
  title: string;
  description: string;
  budgetTarget: number;
};

export async function createPhase(input: CreatePhaseInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, org_id")
    .eq("id", input.projectId)
    .maybeSingle();

  if (!project || project.org_id !== context.orgId) {
    throw new Error("Project not found.");
  }

  const { count } = await supabase
    .from("phases")
    .select("id", { count: "exact", head: true })
    .eq("project_id", input.projectId);

  const { error } = await supabase.from("phases").insert({
    project_id: input.projectId,
    org_id: context.orgId,
    title: input.title,
    description: input.description || null,
    budget_target: input.budgetTarget,
    sort_order: count ?? 0,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${input.projectId}`);
  revalidatePath("/dashboard");
}

export type UpdatePhaseInput = {
  phaseId: string;
  title: string;
  description: string;
  budgetTarget: number;
};

export async function updatePhase(input: UpdatePhaseInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const phase = await getOwnedPhase(supabase, context.orgId, input.phaseId);

  const { error } = await supabase
    .from("phases")
    .update({
      title: input.title,
      description: input.description || null,
      budget_target: input.budgetTarget,
    })
    .eq("id", input.phaseId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${phase.project_id}`);
  revalidatePath("/dashboard");
}

export async function deletePhase(phaseId: string) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const phase = await getOwnedPhase(supabase, context.orgId, phaseId);

  const [{ count: donationCount }, { count: expenseCount }] = await Promise.all([
    supabase.from("donations").select("id", { count: "exact", head: true }).eq("phase_id", phaseId),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("phase_id", phaseId),
  ]);

  if ((donationCount ?? 0) > 0 || (expenseCount ?? 0) > 0) {
    throw new Error("This phase has donations or expenses recorded — it can't be deleted.");
  }

  const { error } = await supabase.from("phases").delete().eq("id", phaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${phase.project_id}`);
  revalidatePath("/dashboard");
}
