import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stubSms } from "@/lib/services/notify";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: expiredCount, error: expireError } = await supabase.rpc("expire_held_nikah_requests");
  if (expireError) {
    return NextResponse.json({ error: expireError.message }, { status: 500 });
  }

  const { data: generatedCount, error: generateError } = await supabase.rpc(
    "generate_availability_slots",
    { p_weeks: 4, p_officiant_id: null }
  );
  if (generateError) {
    return NextResponse.json({ error: generateError.message }, { status: 500 });
  }

  if ((expiredCount ?? 0) > 0) {
    stubSms("nikah_expired_batch", { expiredCount });
  }

  return NextResponse.json({
    expired: expiredCount ?? 0,
    generated: generatedCount ?? 0,
  });
}
