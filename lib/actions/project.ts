"use server";

import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { generateUniqueSlug } from "@/lib/utils/slug";

export type CreateProjectInput = {
  title: string;
  description: string;
  phases: { name: string; budget: number }[];
};

export async function createProject(input: CreateProjectInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const totalGoal = input.phases.reduce((sum, p) => sum + p.budget, 0);

  const slug = await generateUniqueSlug(input.title, async (candidate) => {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", candidate)
      .maybeSingle();
    return Boolean(data);
  });

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      org_id: context.orgId,
      title: input.title,
      slug,
      description: input.description || null,
      total_goal: totalGoal,
      created_by: context.memberId,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Failed to create project.");
  }

  if (input.phases.length > 0) {
    const { error: phasesError } = await supabase.from("phases").insert(
      input.phases.map((phase, index) => ({
        project_id: project.id,
        org_id: context.orgId,
        title: phase.name,
        budget_target: phase.budget,
        sort_order: index,
      }))
    );

    if (phasesError) {
      throw new Error(phasesError.message);
    }
  }

  redirect("/dashboard");
}
