import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only contexts with no user session
// (e.g. the Stripe webhook) that still need to write to the database.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_HACKATHON_SUPABASE_URL!,
    process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY!
  );
}
