import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationKind =
  | "nikah_request"
  | "nikah_confirmed"
  | "nikah_declined"
  | "nikah_expired"
  | "janaza_broadcast"
  | "janaza_claimed"
  | "janaza_covered"
  | "janaza_task_broadcast"
  | "janaza_task_claimed"
  | "janaza_task_covered";

export type NotifyInput = {
  recipientMemberId: string;
  orgId: string;
  serviceRequestId: string;
  kind: NotificationKind;
  body: string;
};

export function stubSms(event: string, payload: unknown) {
  // TODO: send SMS via a provider (Twilio, etc.)
  console.log("[services:sms-stub]", event, payload);
}

export async function notify(supabase: SupabaseClient, input: NotifyInput) {
  stubSms(input.kind, {
    toMemberId: input.recipientMemberId,
    body: input.body,
    serviceRequestId: input.serviceRequestId,
  });

  const { error } = await supabase.from("service_notifications").insert({
    recipient_member_id: input.recipientMemberId,
    org_id: input.orgId,
    service_request_id: input.serviceRequestId,
    kind: input.kind,
    body: input.body,
  });

  if (error) {
    throw new Error(error.message);
  }
}
