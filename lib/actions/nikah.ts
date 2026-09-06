"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext, requireMemberContext } from "@/lib/auth/session";
import { getOfficiantForMember } from "@/lib/data/services";
import { stubSms } from "@/lib/services/notify";
import { createClient } from "@/lib/supabase/server";

function revalidateServicePaths() {
  revalidatePath("/services");
  revalidatePath("/services/nikah");
  revalidatePath("/dashboard/officiant");
}

export async function requestNikahSlot(slotId: string, details: string) {
  const context = await requireMemberContext();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("hold_nikah_slot", {
    p_slot_id: slotId,
    p_requested_by: context.memberId,
    p_details: details.trim() || null,
  });

  if (error) throw new Error(error.message);

  stubSms("nikah_request", {
    requestId: data,
    requesterMemberId: context.memberId,
    slotId,
  });

  revalidateServicePaths();
}

async function respondToNikah(requestId: string, accept: boolean) {
  const context = await requireMemberContext();
  const officiant = await getOfficiantForMember(context.memberId);
  if (!officiant) {
    throw new Error("You are not registered as an officiant.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_nikah_request", {
    p_request_id: requestId,
    p_officiant_id: officiant.id,
    p_accept: accept,
  });

  if (error) throw new Error(error.message);

  stubSms(accept ? "nikah_confirmed" : "nikah_declined", {
    requestId,
    officiantId: officiant.id,
  });

  revalidateServicePaths();
}

export async function confirmNikahRequest(requestId: string) {
  await respondToNikah(requestId, true);
}

export async function declineNikahRequest(requestId: string) {
  await respondToNikah(requestId, false);
}

export async function saveOrgNikahPrice(amount: number) {
  const context = await requireAdminContext();
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid nikah fee.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ nikah_price: Math.round(amount * 100) / 100 })
    .eq("id", context.orgId);

  if (error) throw new Error(error.message);
  revalidateServicePaths();
}
