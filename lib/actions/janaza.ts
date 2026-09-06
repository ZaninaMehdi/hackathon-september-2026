"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext, requireMemberContext } from "@/lib/auth/session";
import type { JanazaSkill, JanazaTaskRole, JanazaTaskStatus } from "@/lib/data/services";
import { notify, stubSms } from "@/lib/services/notify";
import { createClient } from "@/lib/supabase/server";

function revalidateJanazaPaths(requestId?: string) {
  revalidatePath("/services");
  revalidatePath("/services/janaza");
  revalidatePath("/dashboard/officiant");
  if (requestId) {
    revalidatePath(`/services/janaza/${requestId}`);
  }
}

const MANUAL_ROLES: JanazaTaskRole[] = ["transport", "cemetery"];
const CLAIMABLE_ROLES: JanazaSkill[] = ["salat", "ghusl"];

async function membersWithSkill(orgId: string, skill: JanazaSkill, crossOrg: boolean) {
  const supabase = await createClient();
  const { data: skillRows } = await supabase.from("member_skills").select("member_id").eq("skill", skill);
  const skillIds = new Set((skillRows ?? []).map((row) => row.member_id));

  if (skill === "salat") {
    let officiantQuery = supabase.from("officiants").select("member_id, org_id").contains("services", ["janaza"]);
    if (!crossOrg) officiantQuery = officiantQuery.eq("org_id", orgId);
    const { data: officiants } = await officiantQuery;
    for (const officiant of officiants ?? []) {
      skillIds.add(officiant.member_id);
    }
  }

  if (skillIds.size === 0) return [];

  let memberQuery = supabase.from("members").select("id, org_id").in("id", [...skillIds]);
  if (!crossOrg) memberQuery = memberQuery.eq("org_id", orgId);
  const { data: members } = await memberQuery;
  return members ?? [];
}

export async function saveMemberSkills(skills: JanazaSkill[]) {
  const context = await requireMemberContext();
  const supabase = await createClient();
  const unique = CLAIMABLE_ROLES.filter((skill) => skills.includes(skill));

  const { error: deleteError } = await supabase.from("member_skills").delete().eq("member_id", context.memberId);
  if (deleteError) throw new Error(deleteError.message);

  if (unique.length > 0) {
    const { error: insertError } = await supabase.from("member_skills").insert(
      unique.map((skill) => ({ member_id: context.memberId, skill }))
    );
    if (insertError) throw new Error(insertError.message);
  }

  revalidateJanazaPaths();
}

export async function submitJanazaRequest(input: {
  neededBy: string;
  details: string;
  broadcastCrossOrg?: boolean;
}) {
  const context = await requireMemberContext();
  const supabase = await createClient();

  const neededBy = new Date(input.neededBy);
  if (Number.isNaN(neededBy.getTime())) {
    throw new Error("Enter a valid date and time.");
  }

  const details = input.details.trim();
  if (!details) {
    throw new Error("Add a short description of what is needed.");
  }

  const { data: request, error } = await supabase
    .from("service_requests")
    .insert({
      org_id: context.orgId,
      service_type: "janaza",
      slot_id: null,
      officiant_id: null,
      requested_by: context.memberId,
      status: "pending",
      needed_by: neededBy.toISOString(),
      details,
    })
    .select("id")
    .single();

  if (error || !request) {
    throw new Error(error?.message ?? "Could not submit the janaza request.");
  }

  for (const skill of CLAIMABLE_ROLES) {
    const recipients = await membersWithSkill(context.orgId, skill, Boolean(input.broadcastCrossOrg));
    for (const recipient of recipients) {
      await notify(supabase, {
        recipientMemberId: recipient.id,
        orgId: recipient.org_id,
        serviceRequestId: request.id,
        kind: "janaza_task_broadcast",
        body: `Urgent janaza ${skill} needed by ${neededBy.toISOString()}.`,
      });
    }
  }

  revalidateJanazaPaths(request.id);
  redirect(`/services/janaza/${request.id}`);
}

export async function claimJanazaTask(taskId: string) {
  const context = await requireMemberContext();
  const supabase = await createClient();

  const { data: claimed, error } = await supabase.rpc("claim_janaza_task", {
    p_task_id: taskId,
    p_member_id: context.memberId,
  });

  if (error) throw new Error(error.message);
  if (!claimed) {
    throw new Error("This task is already covered.");
  }

  const { data: task } = await supabase
    .from("janaza_tasks")
    .select("service_request_id")
    .eq("id", taskId)
    .maybeSingle();

  stubSms("janaza_task_claimed", { taskId, memberId: context.memberId });
  revalidateJanazaPaths(task?.service_request_id);
}

export async function confirmJanazaTask(taskId: string) {
  const context = await requireMemberContext();
  const supabase = await createClient();

  const { data: confirmed, error } = await supabase.rpc("confirm_janaza_task", {
    p_task_id: taskId,
    p_member_id: context.memberId,
  });

  if (error) throw new Error(error.message);
  if (!confirmed) {
    throw new Error("This task could not be confirmed.");
  }

  const { data: task } = await supabase
    .from("janaza_tasks")
    .select("service_request_id")
    .eq("id", taskId)
    .maybeSingle();

  revalidateJanazaPaths(task?.service_request_id);
}

export async function updateJanazaCoordination(input: {
  taskId: string;
  contactName: string;
  contactPhone: string;
  notes: string;
  status: JanazaTaskStatus;
}) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("janaza_tasks")
    .select("id, role, service_request_id, service_requests!inner(org_id)")
    .eq("id", input.taskId)
    .maybeSingle();

  if (!task || !MANUAL_ROLES.includes(task.role as JanazaTaskRole)) {
    throw new Error("Only transport and cemetery tasks are coordinated manually.");
  }

  const request = Array.isArray(task.service_requests) ? task.service_requests[0] : task.service_requests;
  if (request?.org_id !== context.orgId) {
    throw new Error("This request belongs to another organization.");
  }

  if (!["open", "claimed", "confirmed"].includes(input.status)) {
    throw new Error("Invalid status.");
  }

  const { error } = await supabase
    .from("janaza_tasks")
    .update({
      contact_name: input.contactName.trim() || null,
      contact_phone: input.contactPhone.trim() || null,
      notes: input.notes.trim() || null,
      status: input.status,
      claimed_by: input.status === "open" ? null : context.memberId,
      claimed_at: input.status === "open" ? null : new Date().toISOString(),
      confirmed_at: input.status === "confirmed" ? new Date().toISOString() : null,
    })
    .eq("id", input.taskId);

  if (error) throw new Error(error.message);

  if (input.status === "confirmed") {
    await supabase.rpc("sync_janaza_request_status", { p_request_id: task.service_request_id });
  }

  revalidateJanazaPaths(task.service_request_id);
}
