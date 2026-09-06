import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_DISABLED } from "@/lib/auth/session";

export default async function Home() {
  if (AUTH_DISABLED) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  

  redirect(user ? "/dashboard" : "/login");
}
