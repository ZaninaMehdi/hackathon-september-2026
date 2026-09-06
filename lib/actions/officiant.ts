"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext, requireMemberContext } from "@/lib/auth/session";
import type { ServiceType } from "@/lib/data/services";
import { getOfficiantForMember } from "@/lib/data/services";
import { createClient } from "@/lib/supabase/server";

const SERVICE_TYPES: ServiceType[] = ["nikah", "janaza"];

export type DayAvailabilityInput = {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

function revalidateServicePaths() {
  revalidatePath("/services");
  revalidatePath("/services/nikah");
  revalidatePath("/services/janaza");
  revalidatePath("/dashboard/officiant");
}

function normalizeServices(services: ServiceType[]) {
  const unique = SERVICE_TYPES.filter((service) => services.includes(service));
  if (unique.length === 0) {
    throw new Error("Choose at least one service.");
  }
  return unique;
}

async function requireCurrentOfficiant() {
  const context = await requireMemberContext();
  const officiant = await getOfficiantForMember(context.memberId);
  if (!officiant) {
    throw new Error("You are not registered as an officiant.");
  }
  return { context, officiant };
}

async function insertOfficiant(orgId: string, memberId: string, services: ServiceType[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("officiants").insert({
    org_id: orgId,
    member_id: memberId,
    services,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("That member is already an officiant.");
    }
    throw new Error(error.message);
  }
}

export async function registerAsOfficiant(services: ServiceType[]) {
  const context = await requireMemberContext();
  await insertOfficiant(context.orgId, context.memberId, normalizeServices(services));
  revalidateServicePaths();
}

export async function designateOfficiant(memberId: string, services: ServiceType[]) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .eq("org_id", context.orgId)
    .maybeSingle();

  if (!member) {
    throw new Error("Member not found in this organization.");
  }

  await insertOfficiant(context.orgId, memberId, normalizeServices(services));
  revalidateServicePaths();
}

export async function updateOfficiantServices(services: ServiceType[]) {
  const { officiant } = await requireCurrentOfficiant();
  const supabase = await createClient();

  const { error } = await supabase
    .from("officiants")
    .update({ services: normalizeServices(services) })
    .eq("id", officiant.id);

  if (error) throw new Error(error.message);
  revalidateServicePaths();
}

export async function saveRecurringAvailability(days: DayAvailabilityInput[]) {
  const { officiant } = await requireCurrentOfficiant();
  const supabase = await createClient();

  const enabled = days.filter((day) => day.enabled);
  for (const day of enabled) {
    if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      throw new Error("Invalid day of week.");
    }
    if (day.startTime >= day.endTime) {
      throw new Error("End time must be after start time.");
    }
  }

  const { error: deleteError } = await supabase
    .from("officiant_recurring_availability")
    .delete()
    .eq("officiant_id", officiant.id);

  if (deleteError) throw new Error(deleteError.message);

  if (enabled.length > 0) {
    const { error: insertError } = await supabase.from("officiant_recurring_availability").insert(
      enabled.map((day) => ({
        officiant_id: officiant.id,
        day_of_week: day.dayOfWeek,
        start_time: day.startTime,
        end_time: day.endTime,
      }))
    );
    if (insertError) throw new Error(insertError.message);
  }

  const { error: clearSlotsError } = await supabase
    .from("availability_slots")
    .delete()
    .eq("officiant_id", officiant.id)
    .eq("status", "open")
    .gt("starts_at", new Date().toISOString());

  if (clearSlotsError) throw new Error(clearSlotsError.message);

  const { error: generateError } = await supabase.rpc("generate_availability_slots", {
    p_weeks: 4,
    p_officiant_id: officiant.id,
  });

  if (generateError) throw new Error(generateError.message);
  revalidateServicePaths();
}
