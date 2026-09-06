import { createClient } from "@/lib/supabase/server";

export type OrgProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
};

export async function getOrgProfile(orgId: string): Promise<OrgProfile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("organizations")
    .select("id, name, slug, description, logo_url, cover_image_url")
    .eq("id", orgId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    logoUrl: data.logo_url,
    coverImageUrl: data.cover_image_url,
  };
}

export type OrgMember = {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  emailNotificationsEnabled: boolean;
};

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = await createClient();

  const [{ data: members }, { data: roleRows }] = await Promise.all([
    supabase
      .from("members")
      .select("id, email, full_name, email_notifications_enabled")
      .eq("org_id", orgId)
      .order("email", { ascending: true }),
    supabase.from("roles").select("member_id, role").eq("org_id", orgId),
  ]);

  const rolesByMember = new Map<string, string[]>();
  for (const r of roleRows ?? []) {
    const list = rolesByMember.get(r.member_id) ?? [];
    list.push(r.role);
    rolesByMember.set(r.member_id, list);
  }

  return (members ?? []).map((m) => ({
    id: m.id,
    email: m.email,
    fullName: m.full_name,
    roles: rolesByMember.get(m.id) ?? [],
    emailNotificationsEnabled: m.email_notifications_enabled,
  }));
}
