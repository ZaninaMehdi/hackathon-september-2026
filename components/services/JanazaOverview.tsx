"use client";

import { useState } from "react";
import { claimJanazaTask, confirmJanazaTask, updateJanazaCoordination } from "@/lib/actions/janaza";
import type { JanazaOverview, JanazaSkill, JanazaTask, JanazaTaskStatus } from "@/lib/data/services";
import { JANAZA_PRICE, JANAZA_TASK_PRICES } from "@/lib/data/service-prices";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { ServicePrice } from "@/components/services/ServicePrice";

const ROLE_COPY: Record<JanazaTask["role"], { title: string; blurb: string }> = {
  salat: { title: "Salat", blurb: "Broadcast to members with the salat skill. First to claim wins." },
  ghusl: { title: "Ghusl", blurb: "Broadcast to members with the ghusl skill. First to claim wins." },
  transport: { title: "Transport", blurb: "Admin records the driver or funeral-home contact after calling." },
  cemetery: { title: "Cemetery", blurb: "Admin records the burial plot or cemetery contact after calling." },
};

function taskDotStatus(status: JanazaTaskStatus) {
  if (status === "confirmed") return "complete" as const;
  if (status === "claimed") return "in_progress" as const;
  return "not_started" as const;
}

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

function ClaimableTaskActions({
  task,
  canClaim,
  canConfirm,
}: {
  task: JanazaTask;
  canClaim: boolean;
  canConfirm: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (task.status === "open" && canClaim) {
    return (
      <div className="flex flex-col gap-2">
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await claimJanazaTask(task.id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not claim this task.");
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-lg bg-accent py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Claiming…" : "I’ll do it"}
        </button>
      </div>
    );
  }

  if (task.status === "claimed" && canConfirm) {
    return (
      <div className="flex flex-col gap-2">
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await confirmJanazaTask(task.id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not confirm this task.");
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-lg border border-border bg-white py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-50"
        >
          {busy ? "Confirming…" : "Mark confirmed"}
        </button>
      </div>
    );
  }

  if (task.status !== "open") {
    return (
      <p className="text-[12.5px] font-medium text-accent">
        {task.status === "confirmed" ? "Confirmed" : "Already covered"}
        {task.claimantName ? ` · ${task.claimantName}` : ""}
      </p>
    );
  }

  return <p className="text-[12.5px] text-body">Waiting for a volunteer with this skill.</p>;
}

function CoordinationFields({ task }: { task: JanazaTask }) {
  const [contactName, setContactName] = useState(task.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(task.contactPhone ?? "");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [status, setStatus] = useState<JanazaTaskStatus>(task.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Contact name"
        className="rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] text-ink"
      />
      <input
        type="tel"
        value={contactPhone}
        onChange={(e) => setContactPhone(e.target.value)}
        placeholder="Contact phone"
        className="rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] text-ink"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes from the call"
        className="min-h-[72px] rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] text-ink"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as JanazaTaskStatus)}
        className="rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] text-ink"
      >
        <option value="open">Open</option>
        <option value="claimed">Claimed</option>
        <option value="confirmed">Confirmed</option>
      </select>
      {message && <p className="text-[12.5px] text-accent">{message}</p>}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          setMessage(null);
          try {
            await updateJanazaCoordination({
              taskId: task.id,
              contactName,
              contactPhone,
              notes,
              status,
            });
            setMessage("Coordination saved.");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save coordination.");
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-lg bg-accent py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save contact"}
      </button>
    </div>
  );
}

function ManualTaskReadout({ task }: { task: JanazaTask }) {
  if (!task.contactName && !task.contactPhone && !task.notes) {
    return <p className="text-[12.5px] text-body">No contact recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-0.5 text-[12.5px] text-body">
      {task.contactName && <span>{task.contactName}</span>}
      {task.contactPhone && <span>{task.contactPhone}</span>}
      {task.notes && <span>{task.notes}</span>}
    </div>
  );
}

export function JanazaOverviewClient({
  overview,
  skills,
  memberId,
  canManage,
}: {
  overview: JanazaOverview;
  skills: JanazaSkill[];
  memberId: string;
  canManage: boolean;
}) {
  const { request, tasks } = overview;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-4 min-[900px]:p-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-[19px] font-bold tracking-[-0.02em] text-ink">Janaza checklist</h1>
          <Badge variant={request.status}>{request.status}</Badge>
        </div>
        <p className="text-[13.5px] text-body">
          Requested by {request.requesterName ?? "a member"} · needed by {formatNeededBy(request.neededBy)}
        </p>
        {request.details && <p className="text-[14px] text-ink">{request.details}</p>}
        <ServicePrice price={JANAZA_PRICE} />
      </header>

      <ol className="flex flex-col gap-3">
        {tasks.map((task) => {
          const copy = ROLE_COPY[task.role];
          const claimable = task.role === "salat" || task.role === "ghusl";
          return (
            <li key={task.id} className="flex flex-col gap-3 rounded-lg border border-hairline bg-white p-4">
              <div className="flex items-start gap-3">
                <StatusDot status={taskDotStatus(task.status)} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-ink">{copy.title}</span>
                    <Badge variant={task.status === "confirmed" ? "confirmed" : "pending"}>{task.status}</Badge>
                  </div>
                  <p className="text-[12.5px] text-body">{copy.blurb}</p>
                  <ServicePrice price={JANAZA_TASK_PRICES[task.role]} compact />
                </div>
              </div>
              {claimable ? (
                <ClaimableTaskActions
                  task={task}
                  canClaim={task.role === "salat" || task.role === "ghusl" ? skills.includes(task.role) : false}
                  canConfirm={canManage || task.claimedBy === memberId}
                />
              ) : canManage ? (
                <CoordinationFields task={task} />
              ) : (
                <ManualTaskReadout task={task} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
