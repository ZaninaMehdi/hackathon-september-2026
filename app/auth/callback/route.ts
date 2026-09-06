import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existingMember } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (!existingMember) {
        const { data: invite } = data.user.email
          ? await supabase
              .from("invites")
              .select("id, org_id, role")
              .eq("email", data.user.email)
              .is("accepted_at", null)
              .limit(1)
              .maybeSingle()
          : { data: null };

        const { data: newMember } = await supabase
          .from("members")
          .insert({
            user_id: data.user.id,
            email: data.user.email,
            org_id: invite?.org_id ?? null,
          })
          .select("id")
          .single();

        if (invite && newMember) {
          await supabase
            .from("roles")
            .insert({ org_id: invite.org_id, member_id: newMember.id, role: invite.role });
          await supabase.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
