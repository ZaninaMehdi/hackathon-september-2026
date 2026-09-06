"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueSlug } from "@/lib/utils/slug";

async function uploadCoverImage(pathPrefix: string, file: File): Promise<string> {
  const admin = createAdminClient();
  const path = `${pathPrefix}/${Date.now()}-${file.name}`;
  const { error } = await admin.storage.from("media").upload(path, file);
  if (error) throw new Error(error.message);
  return admin.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export type CreateProjectInput = {
  title: string;
  description: string;
  phases: { name: string; budget: number }[];
  isZakatEligible: boolean;
  coverImageFile: File | null;
};

export async function createProject(input: CreateProjectInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const slug = await generateUniqueSlug(input.title, async (candidate) => {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", candidate)
      .maybeSingle();
    return Boolean(data);
  });

  const coverImageUrl = input.coverImageFile
    ? await uploadCoverImage(`campaigns/${context.orgId}`, input.coverImageFile)
    : null;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      org_id: context.orgId,
      title: input.title,
      slug,
      description: input.description || null,
      created_by: context.memberId,
      is_zakat_eligible: input.isZakatEligible,
      cover_image_url: coverImageUrl,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Failed to create campaign.");
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

export type ProjectStatus = "active" | "closed" | "archived";

async function assertOwnsProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  projectId: string
) {
  const { data: project } = await supabase
    .from("projects")
    .select("id, org_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.org_id !== orgId) {
    throw new Error("Campaign not found.");
  }
}

export async function setProjectStatus(projectId: string, status: ProjectStatus) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  await assertOwnsProject(supabase, context.orgId, projectId);

  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
}

export type UpdateProjectInput = {
  projectId: string;
  title: string;
  description: string;
  coverImageFile: File | null;
  removeCoverImage: boolean;
};

export async function updateProject(input: UpdateProjectInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  await assertOwnsProject(supabase, context.orgId, input.projectId);

  let coverImageUrl: string | undefined;
  if (input.coverImageFile) {
    coverImageUrl = await uploadCoverImage(
      `campaigns/${context.orgId}`,
      input.coverImageFile
    );
  } else if (input.removeCoverImage) {
    coverImageUrl = null as unknown as string;
  }

  const { error } = await supabase
    .from("projects")
    .update({
      title: input.title,
      description: input.description || null,
      ...(coverImageUrl !== undefined ? { cover_image_url: coverImageUrl } : {}),
    })
    .eq("id", input.projectId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${input.projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
}

export async function setProjectZakatEligible(projectId: string, isZakatEligible: boolean) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  await assertOwnsProject(supabase, context.orgId, projectId);

  const { error } = await supabase
    .from("projects")
    .update({ is_zakat_eligible: isZakatEligible })
    .eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
}

/**
 * Hard-deletes a project. Only permitted when it has zero donations and
 * zero expenses — once real money has moved, the record can only be
 * archived (see setProjectStatus), never destroyed.
 */
export async function deleteProject(projectId: string) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  await assertOwnsProject(supabase, context.orgId, projectId);

  const [{ count: donationCount }, { count: expenseCount }] = await Promise.all([
    supabase
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
  ]);

  if ((donationCount ?? 0) > 0 || (expenseCount ?? 0) > 0) {
    throw new Error(
      "This campaign has donations or expenses recorded — archive it instead of deleting."
    );
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);

  redirect("/dashboard");
}
