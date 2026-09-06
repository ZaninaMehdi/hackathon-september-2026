"use client";

import { useState } from "react";
import { designateOfficiant, registerAsOfficiant, updateOfficiantServices } from "@/lib/actions/officiant";
import { claimJanazaTask, confirmJanazaTask } from "@/lib/actions/janaza";
import { confirmNikahRequest, declineNikahRequest } from "@/lib/actions/nikah";
import type {
  ClaimableJanazaTask,
  JanazaSkill,
  OfficiantInbox,
  OfficiantSummary,
  OrgMemberOption,
  RecurringWindow,
  ServiceRequestItem,
  ServiceType,
} from "@/lib/data/services";
import { AvailabilityGrid } from "@/components/services/AvailabilityGrid";
import { MemberSkillsForm } from "@/components/services/MemberSkillsForm";
import { NikahPriceForm } from "@/components/services/NikahPriceForm";
import { PendingCountBadge } from "@/components/services/PendingCountBadge";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const SERVICE_OPTIONS: { id: ServiceType; label: string }[] = [
  { id: "nikah", label: "Nikah" },
  { id: "janaza", label: "Janaza" },
];

function formatNeededBy(value: string | null) {
  if (!value) return "Time not set";
  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSlot(request: ServiceRequestItem) {
  if (!request.slotStartsAt || !request.slotEndsAt) return "Slot held";
  const start = new Date(request.slotStartsAt);
  return start.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function ServiceChecks({
  value,
  onChange,
}: {
  value: ServiceType[];
  onChange: (next: ServiceType[]) => void;
}) {
  return (
    <div className="flex gap-3">
      {SERVICE_OPTIONS.map((option) => {
        const checked = value.includes(option.id);
        return (
          <label key={option.id} className="flex items-center gap-2 text-[13.5px] text-ink">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                onChange(checked ? value.filter((item) => item !== option.id) : [...value, option.id]);
              }}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

function RegisterPanel({ title, submitLabel, onSubmit }: { title: string; submitLabel: string; onSubmit: (services: ServiceType[]) => Promise<void> }) {
  const [services, setServices] = useState<ServiceType[]>(["nikah", "janaza"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-white p-4">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <ServiceChecks value={services} onChange={setServices} />
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <button
        type="button"
        disabled={submitting || services.length === 0}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          try {
            await onSubmit(services);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save officiant.");
          } finally {
            setSubmitting(false);
          }
        }}
        className="rounded-lg bg-accent py-3 text-[15px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

function DesignatePanel({ members }: { members: OrgMemberOption[] }) {
  const eligible = members.filter((member) => !member.isOfficiant);
  const [memberId, setMemberId] = useState(eligible[0]?.id ?? "");
  const [services, setServices] = useState<ServiceType[]>(["nikah", "janaza"]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (eligible.length === 0) {
    return <p className="text-[13.5px] text-body">Every member in this organization is already an officiant.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
      >
        {eligible.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <ServiceChecks value={services} onChange={setServices} />
      {message && <p className="text-[12.5px] text-accent">{message}</p>}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <button
        type="button"
        disabled={submitting || !memberId}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          setMessage(null);
          try {
            await designateOfficiant(memberId, services);
            setMessage("Officiant added.");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not designate officiant.");
          } finally {
            setSubmitting(false);
          }
        }}
        className="rounded-lg border border-border bg-white py-3 text-[15px] font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Designate officiant"}
      </button>
    </div>
  );
}

function NikahInbox({ requests }: { requests: ServiceRequestItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0) {
    return <p className="text-[13.5px] text-body">No pending nikah requests.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {requests.map((request) => (
        <div key={request.id} className="flex flex-col gap-2 rounded-lg border border-hairline bg-white p-3.5">
          <div className="flex items-center gap-2">
            <Badge variant="pending">Pending</Badge>
            <span className="text-[13.5px] font-medium text-ink">{request.requesterName}</span>
          </div>
          <p className="text-[12.5px] text-body">{formatSlot(request)}</p>
          {request.details && <p className="text-[13px] text-ink">{request.details}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busyId === request.id}
              onClick={async () => {
                setBusyId(request.id);
                setError(null);
                try {
                  await confirmNikahRequest(request.id);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not confirm.");
                } finally {
                  setBusyId(null);
                }
              }}
              className="flex-1 rounded-lg bg-accent py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              disabled={busyId === request.id}
              onClick={async () => {
                setBusyId(request.id);
                setError(null);
                try {
                  await declineNikahRequest(request.id);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not decline.");
                } finally {
                  setBusyId(null);
                }
              }}
              className="flex-1 rounded-lg border border-border bg-white py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}

function JanazaInbox({ tasks, memberId }: { tasks: ClaimableJanazaTask[]; memberId: string }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <p className="text-[13.5px] text-body">No salat or ghusl broadcasts right now.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => {
        const covered = task.status !== "open";
        return (
          <div key={task.id} className="flex flex-col gap-2 rounded-lg border border-hairline bg-white p-3.5">
            <div className="flex items-center gap-2">
              <Badge variant={task.status === "confirmed" ? "confirmed" : "pending"}>{task.role}</Badge>
              <span className="text-[13.5px] font-medium text-ink">{task.requesterName}</span>
            </div>
            <p className="text-[12.5px] text-body">Needed by {formatNeededBy(task.neededBy)}</p>
            {task.details && <p className="text-[13px] text-ink">{task.details}</p>}
            <Link href={`/services/janaza/${task.requestId}`} className="text-[12.5px] font-semibold text-accent">
              Open checklist
            </Link>
            {covered ? (
              <p className="text-[12.5px] font-medium text-accent">
                {task.status === "confirmed" ? "Confirmed" : "Already covered"}
                {task.claimantName ? ` · ${task.claimantName}` : ""}
              </p>
            ) : (
              <button
                type="button"
                disabled={busyId === task.id}
                onClick={async () => {
                  setBusyId(task.id);
                  setError(null);
                  try {
                    await claimJanazaTask(task.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not claim this task.");
                  } finally {
                    setBusyId(null);
                  }
                }}
                className="rounded-lg bg-accent py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
              >
                {busyId === task.id ? "Claiming…" : "I’ll do it"}
              </button>
            )}
            {task.status === "claimed" && task.claimedBy === memberId && (
              <button
                type="button"
                disabled={busyId === task.id}
                onClick={async () => {
                  setBusyId(task.id);
                  setError(null);
                  try {
                    await confirmJanazaTask(task.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not confirm this task.");
                  } finally {
                    setBusyId(null);
                  }
                }}
                className="rounded-lg border border-border bg-white py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-50"
              >
                Mark confirmed
              </button>
            )}
          </div>
        );
      })}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}

function OfferedServices({ officiant }: { officiant: OfficiantSummary }) {
  const [services, setServices] = useState<ServiceType[]>(officiant.services);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <ServiceChecks value={services} onChange={setServices} />
      {message && <p className="text-[12.5px] text-accent">{message}</p>}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <button
        type="button"
        disabled={submitting || services.length === 0}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          setMessage(null);
          try {
            await updateOfficiantServices(services);
            setMessage("Services updated.");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update services.");
          } finally {
            setSubmitting(false);
          }
        }}
        className="rounded-lg border border-border bg-white py-3 text-[15px] font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Update services"}
      </button>
    </div>
  );
}

export function OfficiantDashboardClient({
  inbox,
  recurring,
  canManage,
  members,
  pendingCount,
  skills,
  claimableTasks,
  memberId,
  nikahPrice,
}: {
  inbox: OfficiantInbox | null;
  recurring: RecurringWindow[];
  canManage: boolean;
  members: OrgMemberOption[];
  pendingCount: number;
  skills: JanazaSkill[];
  claimableTasks: ClaimableJanazaTask[];
  memberId: string;
  nikahPrice: number | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-4 min-[900px]:p-6">
      <header className="flex items-center gap-2">
        <div className="flex flex-col">
          <h1 className="text-[19px] font-bold tracking-[-0.02em] text-ink">Officiant desk</h1>
          <p className="text-[13.5px] text-body">Confirm nikah holds, claim janaza broadcasts, and set weekly hours.</p>
        </div>
        <div className="ml-auto">
          <PendingCountBadge count={pendingCount} />
        </div>
      </header>

      {!inbox && (
        <RegisterPanel
          title="Register as an officiant"
          submitLabel="Register myself"
          onSubmit={registerAsOfficiant}
        />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-ink">Janaza tasks</h2>
        <JanazaInbox tasks={claimableTasks} memberId={memberId} />
      </section>
      <MemberSkillsForm initialSkills={skills} />

      {inbox && (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">Pending nikah</h2>
            <NikahInbox requests={inbox.pendingNikah} />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">Services you offer</h2>
            <OfferedServices officiant={inbox.officiant} />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">Weekly availability</h2>
            <AvailabilityGrid recurring={recurring} />
          </section>
        </>
      )}

      {canManage && (
        <>
          <section className="flex flex-col gap-2">
            <NikahPriceForm initialAmount={nikahPrice} />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">Designate an officiant</h2>
            <DesignatePanel members={members} />
          </section>
        </>
      )}
    </div>
  );
}
