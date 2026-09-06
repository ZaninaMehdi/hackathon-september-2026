"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CreateEventInput = {
  title: string;
  location: string;
  startsAt: string | null;
  category: "community" | "fundraising" | "life_event" | "construction";
  qualifier: string;
};

export async function createEvent(input: CreateEventInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { error } = await supabase.from("events").insert({
    org_id: context.orgId,
    title: input.title,
    location: input.location || null,
    starts_at: input.startsAt,
    category: input.category,
    status: input.startsAt ? "confirmed" : "pending",
    qualifier: input.qualifier || null,
    created_by: context.memberId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/events");
}
