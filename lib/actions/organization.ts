"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext, requireMemberContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function uploadOrgImage(orgId: string, kind: "logo" | "cover", file: File): Promise<string> {
  const admin = createAdminClient();
  const path = `orgs/${orgId}/${kind}-${Date.now()}-${file.name}`;
  const { error } = await admin.storage.from("media").upload(path, file);
  if (error) throw new Error(error.message);
  return admin.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export type UpdateOrgProfileInput = {
  name: string;
  description: string;
  logoFile: File | null;
  removeLogo: boolean;
  coverFile: File | null;
  removeCover: boolean;
};

export async function updateOrgProfile(input: UpdateOrgProfileInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  let logoUrl: string | undefined;
  if (input.logoFile) {
    logoUrl = await uploadOrgImage(context.orgId, "logo", input.logoFile);
  } else if (input.removeLogo) {
    logoUrl = null as unknown as string;
  }

  let coverUrl: string | undefined;
  if (input.coverFile) {
    coverUrl = await uploadOrgImage(context.orgId, "cover", input.coverFile);
  } else if (input.removeCover) {
    coverUrl = null as unknown as string;
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name: input.name,
      description: input.description || null,
      ...(logoUrl !== undefined ? { logo_url: logoUrl } : {}),
      ...(coverUrl !== undefined ? { cover_image_url: coverUrl } : {}),
    })
    .eq("id", context.orgId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
  revalidatePath(`/${context.orgSlug}`);
}

export async function setMemberRole(memberId: string, role: "admin" | "treasurer" | "member") {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, org_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!member || member.org_id !== context.orgId) {
    throw new Error("Member not found.");
  }

  const { error: deleteError } = await supabase
    .from("roles")
    .delete()
    .eq("org_id", context.orgId)
    .eq("member_id", memberId);

  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase
    .from("roles")
    .insert({ org_id: context.orgId, member_id: memberId, role });

  if (insertError) throw new Error(insertError.message);

  revalidatePath("/dashboard/settings");
}

export async function updateMyPreferences(input: { emailNotificationsEnabled: boolean }) {
  const context = await requireMemberContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("members")
    .update({ email_notifications_enabled: input.emailNotificationsEnabled })
    .eq("id", context.memberId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
}
