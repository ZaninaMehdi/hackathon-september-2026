"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueSlug } from "@/lib/utils/slug";

export type OnboardingPhaseInput = { name: string; budget: number };

export type CreateOrgAndProjectInput = {
  orgName: string;
  orgSlug: string;
  orgType: string;
  projectTitle: string;
  phases: OnboardingPhaseInput[];
  inviteEmails: string[];
};

export async function createOrgAndProject(input: CreateOrgAndProjectInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to create an organization.");
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error("No member record found for this user.");
  }

  if (member.org_id) {
    throw new Error("This user already belongs to an organization.");
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: input.orgName, slug: input.orgSlug, org_type: input.orgType })
    .select("id, slug")
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization.");
  }

  const { error: updateMemberError } = await supabase
    .from("members")
    .update({ org_id: org.id })
    .eq("id", member.id);

  if (updateMemberError) {
    throw new Error(updateMemberError.message);
  }

  const { error: roleError } = await supabase
    .from("roles")
    .insert({ org_id: org.id, member_id: member.id, role: "admin" });

  if (roleError) {
    throw new Error(roleError.message);
  }

  const projectSlug = await generateUniqueSlug(input.projectTitle, async (candidate) => {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", org.id)
      .eq("slug", candidate)
      .maybeSingle();
    return Boolean(data);
  });

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      org_id: org.id,
      title: input.projectTitle,
      slug: projectSlug,
      created_by: member.id,
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
        org_id: org.id,
        title: phase.name,
        budget_target: phase.budget,
        sort_order: index,
      }))
    );

    if (phasesError) {
      throw new Error(phasesError.message);
    }
  }

  if (input.inviteEmails.length > 0) {
    const admin = createAdminClient();

    await supabase.from("invites").insert(
      input.inviteEmails.map((email) => ({
        org_id: org.id,
        email,
        role: "treasurer",
        invited_by: member.id,
      }))
    );

    // Best-effort: a failed invite email shouldn't block onboarding, since
    // the invite row already reserves their org membership for later.
    await Promise.allSettled(
      input.inviteEmails.map((email) => admin.auth.admin.inviteUserByEmail(email))
    );
  }

  redirect("/dashboard");
}
