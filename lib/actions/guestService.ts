"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type GuestServiceInquiryInput = {
  orgId: string;
  serviceType: "nikah" | "janaza";
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  preferredDate: string;
  details: string;
};

export async function submitGuestServiceInquiry(input: GuestServiceInquiryInput) {
  if (!input.guestName.trim() || !input.guestEmail.trim()) {
    throw new Error("Name and email are required.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("guest_service_inquiries").insert({
    org_id: input.orgId,
    service_type: input.serviceType,
    guest_name: input.guestName.trim(),
    guest_email: input.guestEmail.trim(),
    guest_phone: input.guestPhone.trim() || null,
    preferred_date: input.preferredDate || null,
    details: input.details.trim() || null,
  });

  if (error) throw new Error(error.message);
}
