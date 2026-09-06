import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MemberContext = {
  userId: string;
  email: string | null;
  memberId: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
  roles: string[];
};

/**
 * Requires a logged-in user who belongs to an org. Redirects to /login if
 * not authenticated, or /onboarding if authenticated but orgless.
 */
export async function requireMemberContext(): Promise<MemberContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, org_id, organizations(name, slug)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member || !member.org_id) {
    redirect("/onboarding");
  }

  const { data: roleRows } = await supabase
    .from("roles")
    .select("role")
    .eq("member_id", member.id);

  const org = Array.isArray(member.organizations) ? member.organizations[0] : member.organizations;

  return {
    userId: user.id,
    email: user.email ?? null,
    memberId: member.id,
    orgId: member.org_id,
    orgName: org?.name ?? "",
    orgSlug: org?.slug ?? "",
    roles: (roleRows ?? []).map((r) => r.role),
  };
}

/**
 * Same as requireMemberContext, but also redirects to /dashboard if the
 * member doesn't hold an admin/treasurer role (Step 4's role check).
 */
export async function requireAdminContext(): Promise<MemberContext> {
  const context = await requireMemberContext();
  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");
  if (!canManage) {
    redirect("/dashboard");
  }
  return context;
}
