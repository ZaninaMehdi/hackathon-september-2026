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

// Dev-only bypass, ON BY DEFAULT for every clone of this repo: login is
// skipped entirely and every request acts as the first member/org found in
// the database (with admin rights). Set DISABLE_AUTH=false in .env.local to
// restore real auth for testing the login flow itself. Before deploying
// anywhere real, set DISABLE_AUTH=false in that environment's config — do
// not rely on removing this code, since a forgotten env var elsewhere would
// silently leave every page open with no login.
export const AUTH_DISABLED = process.env.DISABLE_AUTH !== "false";

export async function getStaffNav(): Promise<{ href: string; label: string }> {
  if (AUTH_DISABLED) {
    return { href: "/dashboard", label: "Dashboard" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { href: "/dashboard", label: "Dashboard" };
  }

  return { href: "/login", label: "Staff sign in" };
}

async function getDevMemberContext(): Promise<MemberContext | null> {
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, user_id, email, org_id, organizations(name, slug)")
    .not("org_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (!member || !member.org_id) return null;

  const { data: roleRows } = await supabase
    .from("roles")
    .select("role")
    .eq("member_id", member.id);

  const org = Array.isArray(member.organizations) ? member.organizations[0] : member.organizations;

  return {
    userId: member.user_id,
    email: member.email,
    memberId: member.id,
    orgId: member.org_id,
    orgName: org?.name ?? "",
    orgSlug: org?.slug ?? "",
    roles: (roleRows ?? []).map((r) => r.role).length > 0 ? (roleRows ?? []).map((r) => r.role) : ["admin"],
  };
}

/**
 * Requires a logged-in user who belongs to an org. Redirects to /login if
 * not authenticated, or /onboarding if authenticated but orgless.
 */
export async function requireMemberContext(): Promise<MemberContext> {
  if (AUTH_DISABLED) {
    const devContext = await getDevMemberContext();
    if (devContext) return devContext;
    redirect("/onboarding");
  }

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
  if (AUTH_DISABLED) return context;
  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");
  if (!canManage) {
    redirect("/dashboard");
  }
  return context;
}
