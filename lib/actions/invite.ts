"use server";

import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteMember(email: string, role: "admin" | "treasurer" | "member" = "treasurer") {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { error: insertError } = await supabase.from("invites").insert({
    org_id: context.orgId,
    email,
    role,
    invited_by: context.memberId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      throw new Error(`${email} already has a pending invite.`);
    }
    throw new Error(insertError.message);
  }

  const admin = createAdminClient();
  const { error: emailError } = await admin.auth.admin.inviteUserByEmail(email);

  if (emailError) {
    // The invite row still exists so the org membership resolves correctly
    // once they do get in; surface the email failure so the admin can retry.
    throw new Error(`Invite saved, but the email failed to send: ${emailError.message}`);
  }
}
