"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  applyTimeOfDay,
  generateOccurrenceStarts,
  type RecurrenceFrequency,
  type SeriesScope,
} from "@/lib/events/recurrence";

export type CreateEventInput = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  price: number;
  recurrence: RecurrenceFrequency | null;
  recurrenceUntil: string | null;
};

export type UpdateEventInput = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  price: number;
  scope: SeriesScope;
};

function assertEventInput(input: {
  title: string;
  startsAt: string;
  endsAt: string;
  price: number;
}) {
  if (!input.title.trim()) throw new Error("Title is required.");
  if (!input.startsAt) throw new Error("A start date and time are required.");
  if (!input.endsAt) throw new Error("An end date and time are required.");
  if (new Date(input.endsAt).getTime() <= new Date(input.startsAt).getTime()) {
    throw new Error("End time must be after the start time.");
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error("Price must be zero or greater.");
  }
}

function sharedFields(input: {
  title: string;
  description: string;
  location: string;
  price: number;
}) {
  return {
    title: input.title.trim(),
    description: input.description.trim() || null,
    location: input.location.trim() || null,
    price: input.price,
    status: "confirmed" as const,
    qualifier: null,
  };
}

export async function createEvent(input: CreateEventInput) {
  assertEventInput(input);
  const context = await requireAdminContext();
  const supabase = await createClient();

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const durationMs = endsAt.getTime() - startsAt.getTime();
  const base = {
    org_id: context.orgId,
    ...sharedFields(input),
    category: "community",
    created_by: context.memberId,
  };

  if (!input.recurrence) {
    const { error } = await supabase.from("events").insert({
      ...base,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      series_id: null,
      recurrence: null,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/events");
    return;
  }

  if (!input.recurrenceUntil) {
    throw new Error("Choose an end date for the recurring series.");
  }

  // Interpret YYYY-MM-DD as a local calendar day.
  const untilParts = input.recurrenceUntil.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const until = untilParts
    ? new Date(Number(untilParts[1]), Number(untilParts[2]) - 1, Number(untilParts[3]), 23, 59, 59, 999)
    : new Date(input.recurrenceUntil);
  if (Number.isNaN(until.getTime())) {
    throw new Error("Choose a valid end date for the recurring series.");
  }
  if (until.getTime() < startsAt.getTime()) {
    throw new Error("The series end date must be on or after the first event.");
  }

  const occurrenceStarts = generateOccurrenceStarts(startsAt, input.recurrence, until);
  if (occurrenceStarts.length === 0) {
    throw new Error("No occurrences fell within the selected range.");
  }

  const seriesId = randomUUID();
  const rows = occurrenceStarts.map((start) => ({
    ...base,
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + durationMs).toISOString(),
    series_id: seriesId,
    recurrence: input.recurrence,
  }));

  const { error } = await supabase.from("events").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/events");
}

export async function updateEvent(input: UpdateEventInput) {
  assertEventInput(input);
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("events")
    .select("id, org_id, starts_at, ends_at, series_id")
    .eq("id", input.id)
    .eq("org_id", context.orgId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!current) throw new Error("Event not found.");

  const fields = sharedFields(input);
  const nextStart = new Date(input.startsAt);
  const nextEnd = new Date(input.endsAt);
  const durationMs = nextEnd.getTime() - nextStart.getTime();

  if (!current.series_id || input.scope === "this") {
    const { error } = await supabase
      .from("events")
      .update({
        ...fields,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
      })
      .eq("id", input.id)
      .eq("org_id", context.orgId);
    if (error) throw new Error(error.message);
    revalidatePath("/events");
    return;
  }

  let query = supabase
    .from("events")
    .select("id, starts_at, ends_at")
    .eq("org_id", context.orgId)
    .eq("series_id", current.series_id);

  if (input.scope === "following") {
    query = query.gte("starts_at", current.starts_at);
  }

  const { data: targets, error: listError } = await query;
  if (listError) throw new Error(listError.message);

  for (const target of targets ?? []) {
    const originalStart = new Date(target.starts_at);
    const updatedStart = applyTimeOfDay(originalStart, nextStart);
    const updatedEnd = new Date(updatedStart.getTime() + durationMs);
    const { error } = await supabase
      .from("events")
      .update({
        ...fields,
        starts_at: updatedStart.toISOString(),
        ends_at: updatedEnd.toISOString(),
      })
      .eq("id", target.id)
      .eq("org_id", context.orgId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/events");
}

export async function deleteEvent(id: string, scope: SeriesScope = "this") {
  if (!id) throw new Error("Event id is required.");
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("events")
    .select("id, org_id, starts_at, series_id")
    .eq("id", id)
    .eq("org_id", context.orgId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!current) throw new Error("Event not found.");

  if (!current.series_id || scope === "this") {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("org_id", context.orgId);
    if (error) throw new Error(error.message);
    revalidatePath("/events");
    return;
  }

  let query = supabase
    .from("events")
    .delete()
    .eq("org_id", context.orgId)
    .eq("series_id", current.series_id);

  if (scope === "following") {
    query = query.gte("starts_at", current.starts_at);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);

  revalidatePath("/events");
}
