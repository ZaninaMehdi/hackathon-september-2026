import { createClient } from "@/lib/supabase/server";

export type ServiceType = "nikah" | "janaza";
export type RequestStatus = "pending" | "confirmed" | "declined" | "expired";

export type OfficiantSummary = {
  id: string;
  orgId: string;
  memberId: string;
  email: string;
  name: string;
  services: ServiceType[];
};

export type OpenSlot = {
  id: string;
  officiantId: string;
  startsAt: string;
  endsAt: string;
  label: string;
  dateKey: string;
  dateLabel: string;
  weekdayLabel: string;
  dayNumber: string;
  timeLabel: string;
};

export type RecurringWindow = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type ServiceRequestItem = {
  id: string;
  orgId: string;
  serviceType: ServiceType;
  status: RequestStatus;
  details: string | null;
  neededBy: string | null;
  slotStartsAt: string | null;
  slotEndsAt: string | null;
  officiantId: string | null;
  officiantName: string | null;
  requesterName: string | null;
  createdAt: string;
};

export type OrgMemberOption = {
  id: string;
  email: string;
  name: string;
  isOfficiant: boolean;
};

export type JanazaTaskRole = "salat" | "ghusl" | "transport" | "cemetery";
export type JanazaTaskStatus = "open" | "claimed" | "confirmed";
export type JanazaSkill = "salat" | "ghusl";

export type JanazaTask = {
  id: string;
  requestId: string;
  role: JanazaTaskRole;
  status: JanazaTaskStatus;
  claimedBy: string | null;
  claimantName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
  claimedAt: string | null;
  confirmedAt: string | null;
};

export type JanazaOverview = {
  request: ServiceRequestItem;
  tasks: JanazaTask[];
};

export type ClaimableJanazaTask = JanazaTask & {
  details: string | null;
  neededBy: string | null;
  requesterName: string;
};

export type OfficiantInbox = {
  officiant: OfficiantSummary;
  recurring: RecurringWindow[];
  pendingNikah: ServiceRequestItem[];
  janazaBroadcasts: ServiceRequestItem[];
};

type MemberEmbed = { email: string | null; full_name: string | null } | null;

function memberLabel(member: MemberEmbed, fallback = "Member") {
  return member?.full_name?.trim() || member?.email || fallback;
}

const UTC_DATE = { timeZone: "UTC" } as const;

function formatTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...UTC_DATE,
  });
  const endTime = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...UTC_DATE,
  });
  return `${startTime}–${endTime}`;
}

function formatSlotRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const day = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...UTC_DATE,
  });
  return `${day} · ${formatTimeRange(startsAt, endsAt)}`;
}

function mapOfficiant(row: {
  id: string;
  org_id: string;
  member_id: string;
  services: string[] | null;
  members: MemberEmbed | MemberEmbed[];
}): OfficiantSummary {
  const member = Array.isArray(row.members) ? row.members[0] : row.members;
  return {
    id: row.id,
    orgId: row.org_id,
    memberId: row.member_id,
    email: member?.email ?? "",
    name: memberLabel(member, "Officiant"),
    services: (row.services ?? []).filter((s): s is ServiceType => s === "nikah" || s === "janaza"),
  };
}

export async function getOfficiantForMember(memberId: string): Promise<OfficiantSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("officiants")
    .select("id, org_id, member_id, services, members(email, full_name)")
    .eq("member_id", memberId)
    .limit(1)
    .maybeSingle();

  return data ? mapOfficiant(data) : null;
}

export async function getOfficiantsForService(
  orgId: string,
  serviceType: ServiceType
): Promise<OfficiantSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("officiants")
    .select("id, org_id, member_id, services, members(email, full_name)")
    .eq("org_id", orgId)
    .contains("services", [serviceType])
    .order("created_at", { ascending: true });

  return (data ?? []).map(mapOfficiant);
}

export async function getOpenSlots(officiantId: string): Promise<OpenSlot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_slots")
    .select("id, officiant_id, starts_at, ends_at")
    .eq("officiant_id", officiantId)
    .eq("status", "open")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  return (data ?? []).map((slot) => {
    const start = new Date(slot.starts_at);
    return {
      id: slot.id,
      officiantId: slot.officiant_id,
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      label: formatSlotRange(slot.starts_at, slot.ends_at),
      dateKey: start.toISOString().slice(0, 10),
      dateLabel: start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        ...UTC_DATE,
      }),
      weekdayLabel: start.toLocaleDateString("en-US", { weekday: "short", ...UTC_DATE }),
      dayNumber: start.toLocaleDateString("en-US", { day: "numeric", ...UTC_DATE }),
      timeLabel: formatTimeRange(slot.starts_at, slot.ends_at),
    };
  });
}

export async function getOrgNikahPrice(orgId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("nikah_price").eq("id", orgId).maybeSingle();
  if (data?.nikah_price == null) return null;
  const amount = Number(data.nikah_price);
  return Number.isFinite(amount) ? amount : null;
}

export async function getRequesterRequests(memberId: string): Promise<ServiceRequestItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("id, org_id, service_type, status, details, needed_by, officiant_id, created_at, availability_slots(starts_at, ends_at)")
    .eq("requested_by", memberId)
    .order("created_at", { ascending: false });

  const officiantIds = [...new Set((data ?? []).map((row) => row.officiant_id).filter((id): id is string => Boolean(id)))];
  const officiantNames = new Map<string, string>();

  if (officiantIds.length > 0) {
    const { data: officiantRows } = await supabase
      .from("officiants")
      .select("id, member_id")
      .in("id", officiantIds);
    const memberIds = (officiantRows ?? []).map((row) => row.member_id);
    const names = await memberNamesById(memberIds);
    for (const row of officiantRows ?? []) {
      officiantNames.set(row.id, names.get(row.member_id) ?? "Officiant");
    }
  }

  return (data ?? []).map((row) => {
    const slot = Array.isArray(row.availability_slots) ? row.availability_slots[0] : row.availability_slots;

    return {
      id: row.id,
      orgId: row.org_id,
      serviceType: row.service_type as ServiceType,
      status: row.status as RequestStatus,
      details: row.details,
      neededBy: row.needed_by,
      slotStartsAt: slot?.starts_at ?? null,
      slotEndsAt: slot?.ends_at ?? null,
      officiantId: row.officiant_id,
      officiantName: row.officiant_id ? officiantNames.get(row.officiant_id) ?? null : null,
      requesterName: null,
      createdAt: row.created_at,
    };
  });
}

export async function getRecurringAvailability(officiantId: string): Promise<RecurringWindow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("officiant_recurring_availability")
    .select("id, day_of_week, start_time, end_time")
    .eq("officiant_id", officiantId)
    .order("day_of_week", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    dayOfWeek: row.day_of_week,
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
  }));
}

const INBOX_REQUEST_SELECT =
  "id, org_id, service_type, status, details, needed_by, officiant_id, created_at, requested_by, availability_slots(starts_at, ends_at)";

type InboxRequestRow = {
  id: string;
  org_id: string;
  service_type: string;
  status: string;
  details: string | null;
  needed_by: string | null;
  officiant_id: string | null;
  created_at: string;
  requested_by: string;
  availability_slots?: { starts_at: string; ends_at: string } | { starts_at: string; ends_at: string }[] | null;
};

async function memberNamesById(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();

  const supabase = await createClient();
  const { data } = await supabase.from("members").select("id, email, full_name").in("id", unique);
  return new Map((data ?? []).map((member) => [member.id, memberLabel(member)]));
}

function mapInboxRequest(row: InboxRequestRow, requesterName: string | null): ServiceRequestItem {
  const slot = Array.isArray(row.availability_slots) ? row.availability_slots[0] : row.availability_slots;

  return {
    id: row.id,
    orgId: row.org_id,
    serviceType: row.service_type as ServiceType,
    status: row.status as RequestStatus,
    details: row.details,
    neededBy: row.needed_by,
    slotStartsAt: slot?.starts_at ?? null,
    slotEndsAt: slot?.ends_at ?? null,
    officiantId: row.officiant_id,
    officiantName: null,
    requesterName,
    createdAt: row.created_at,
  };
}

export async function getOfficiantInbox(officiant: OfficiantSummary): Promise<OfficiantInbox> {
  const supabase = await createClient();
  const offersJanaza = officiant.services.includes("janaza");

  const [recurring, pendingNikahResult, orgJanazaResult, notifiedIdsResult] = await Promise.all([
    getRecurringAvailability(officiant.id),
    supabase
      .from("service_requests")
      .select(INBOX_REQUEST_SELECT)
      .eq("officiant_id", officiant.id)
      .eq("service_type", "nikah")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    offersJanaza
      ? supabase
          .from("service_requests")
          .select(INBOX_REQUEST_SELECT)
          .eq("org_id", officiant.orgId)
          .eq("service_type", "janaza")
          .in("status", ["pending", "confirmed"])
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] as InboxRequestRow[] }),
    offersJanaza
      ? supabase
          .from("service_notifications")
          .select("service_request_id")
          .eq("recipient_member_id", officiant.memberId)
          .eq("kind", "janaza_broadcast")
      : Promise.resolve({ data: [] as { service_request_id: string | null }[] }),
  ]);

  const notifiedIds = (notifiedIdsResult.data ?? [])
    .map((n) => n.service_request_id)
    .filter((id): id is string => Boolean(id));

  let crossOrg: InboxRequestRow[] = [];
  if (notifiedIds.length > 0) {
    const { data } = await supabase
      .from("service_requests")
      .select(INBOX_REQUEST_SELECT)
      .in("id", notifiedIds)
      .eq("service_type", "janaza")
      .in("status", ["pending", "confirmed"]);
    crossOrg = (data ?? []) as InboxRequestRow[];
  }

  const pendingNikahRows = (pendingNikahResult.data ?? []) as InboxRequestRow[];
  const janazaRows = [...((orgJanazaResult.data ?? []) as InboxRequestRow[]), ...crossOrg];
  const names = await memberNamesById([
    ...pendingNikahRows.map((row) => row.requested_by),
    ...janazaRows.map((row) => row.requested_by),
  ]);

  const janazaById = new Map<string, ServiceRequestItem>();
  for (const row of janazaRows) {
    janazaById.set(row.id, mapInboxRequest(row, names.get(row.requested_by) ?? "Member"));
  }

  return {
    officiant,
    recurring,
    pendingNikah: pendingNikahRows.map((row) =>
      mapInboxRequest(row, names.get(row.requested_by) ?? "Member")
    ),
    janazaBroadcasts: Array.from(janazaById.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    ),
  };
}

export async function getMemberSkills(memberId: string): Promise<JanazaSkill[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("member_skills").select("skill").eq("member_id", memberId);
  const skills = new Set(
    (data ?? []).map((row) => row.skill).filter((skill): skill is JanazaSkill => skill === "salat" || skill === "ghusl")
  );

  const officiant = await getOfficiantForMember(memberId);
  if (officiant?.services.includes("janaza")) {
    skills.add("salat");
  }

  return [...skills];
}

function mapJanazaTask(
  row: {
    id: string;
    service_request_id: string;
    role: string;
    status: string;
    claimed_by: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    notes: string | null;
    claimed_at: string | null;
    confirmed_at: string | null;
  },
  claimantName: string | null
): JanazaTask {
  return {
    id: row.id,
    requestId: row.service_request_id,
    role: row.role as JanazaTaskRole,
    status: row.status as JanazaTaskStatus,
    claimedBy: row.claimed_by,
    claimantName,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    notes: row.notes,
    claimedAt: row.claimed_at,
    confirmedAt: row.confirmed_at,
  };
}

const TASK_ORDER: JanazaTaskRole[] = ["salat", "ghusl", "transport", "cemetery"];

function sortTasks(tasks: JanazaTask[]) {
  return [...tasks].sort((a, b) => TASK_ORDER.indexOf(a.role) - TASK_ORDER.indexOf(b.role));
}

export async function getJanazaOverview(requestId: string): Promise<JanazaOverview | null> {
  const supabase = await createClient();
  const { data: requestRow } = await supabase
    .from("service_requests")
    .select("id, org_id, service_type, status, details, needed_by, officiant_id, created_at, requested_by")
    .eq("id", requestId)
    .eq("service_type", "janaza")
    .maybeSingle();

  if (!requestRow) return null;

  const { data: taskRows } = await supabase
    .from("janaza_tasks")
    .select(
      "id, service_request_id, role, status, claimed_by, contact_name, contact_phone, notes, claimed_at, confirmed_at"
    )
    .eq("service_request_id", requestId);

  const names = await memberNamesById([
    requestRow.requested_by,
    ...(taskRows ?? []).map((row) => row.claimed_by).filter((id): id is string => Boolean(id)),
  ]);

  return {
    request: {
      id: requestRow.id,
      orgId: requestRow.org_id,
      serviceType: "janaza",
      status: requestRow.status as RequestStatus,
      details: requestRow.details,
      neededBy: requestRow.needed_by,
      slotStartsAt: null,
      slotEndsAt: null,
      officiantId: requestRow.officiant_id,
      officiantName: null,
      requesterName: names.get(requestRow.requested_by) ?? "Member",
      createdAt: requestRow.created_at,
    },
    tasks: sortTasks(
      (taskRows ?? []).map((row) => mapJanazaTask(row, row.claimed_by ? names.get(row.claimed_by) ?? null : null))
    ),
  };
}

export async function getClaimableJanazaTasks(
  memberId: string,
  skills: JanazaSkill[],
  orgId?: string
): Promise<ClaimableJanazaTask[]> {
  if (skills.length === 0) return [];

  const supabase = await createClient();
  const { data: taskRows } = await supabase
    .from("janaza_tasks")
    .select(
      "id, service_request_id, role, status, claimed_by, contact_name, contact_phone, notes, claimed_at, confirmed_at"
    )
    .in("role", skills)
    .in("status", ["open", "claimed", "confirmed"])
    .limit(80);

  const requestIds = [...new Set((taskRows ?? []).map((row) => row.service_request_id))];
  if (requestIds.length === 0) return [];

  const { data: requestRows } = await supabase
    .from("service_requests")
    .select("id, org_id, details, needed_by, requested_by, created_at")
    .in("id", requestIds)
    .eq("service_type", "janaza");

  const requests = new Map((requestRows ?? []).map((row) => [row.id, row]));
  const names = await memberNamesById([
    ...(requestRows ?? []).map((row) => row.requested_by),
    ...(taskRows ?? []).map((row) => row.claimed_by).filter((id): id is string => Boolean(id)),
  ]);

  const result: ClaimableJanazaTask[] = [];
  for (const row of taskRows ?? []) {
    const request = requests.get(row.service_request_id);
    if (!request) continue;
    if (orgId && request.org_id !== orgId) continue;
    result.push({
      ...mapJanazaTask(row, row.claimed_by ? names.get(row.claimed_by) ?? null : null),
      details: request.details,
      neededBy: request.needed_by,
      requesterName: names.get(request.requested_by) ?? "Member",
    });
  }
  return result;
}

export async function getOfficiantPendingCount(memberId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const [{ data: member }, officiant, skills] = await Promise.all([
      supabase.from("members").select("org_id").eq("id", memberId).maybeSingle(),
      getOfficiantForMember(memberId),
      getMemberSkills(memberId),
    ]);

    let nikahCount = 0;
    if (officiant) {
      const inbox = await getOfficiantInbox(officiant);
      nikahCount = inbox.pendingNikah.length;
    }

    const claimable = await getClaimableJanazaTasks(memberId, skills, member?.org_id ?? officiant?.orgId);
    const openTasks = claimable.filter((task) => task.status === "open").length;
    return nikahCount + openTasks;
  } catch {
    return 0;
  }
}

export async function getOrgMembersForDesignate(orgId: string): Promise<OrgMemberOption[]> {
  const supabase = await createClient();
  const [{ data: members }, { data: officiantRows }] = await Promise.all([
    supabase.from("members").select("id, email, full_name").eq("org_id", orgId).order("email"),
    supabase.from("officiants").select("member_id").eq("org_id", orgId),
  ]);

  const officiantIds = new Set((officiantRows ?? []).map((row) => row.member_id));

  return (members ?? []).map((member) => ({
    id: member.id,
    email: member.email,
    name: member.full_name?.trim() || member.email,
    isOfficiant: officiantIds.has(member.id),
  }));
}
