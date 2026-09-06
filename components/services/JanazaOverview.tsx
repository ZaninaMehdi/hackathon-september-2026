"use client";

import { useState } from "react";
import { claimJanazaTask, confirmJanazaTask, updateJanazaCoordination } from "@/lib/actions/janaza";
import type { JanazaOverview, JanazaSkill, JanazaTask, JanazaTaskStatus } from "@/lib/data/services";
import { JANAZA_PRICE, JANAZA_TASK_PRICES } from "@/lib/data/service-prices";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
        {error && <p className="text-meta text-danger">{error}</p>}
        <Button
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
        >
          {busy ? "Claiming…" : "I’ll do it"}
        </Button>
      </div>
    );
  }

  if (task.status === "claimed" && canConfirm) {
    return (
      <div className="flex flex-col gap-2">
        {error && <p className="text-meta text-danger">{error}</p>}
        <Button
          variant="secondary"
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
        >
          {busy ? "Confirming…" : "Mark confirmed"}
        </Button>
      </div>
    );
  }

  if (task.status !== "open") {
    return (
      <p className="text-meta font-medium text-accent">
        {task.status === "confirmed" ? "Confirmed" : "Already covered"}
        {task.claimantName ? ` · ${task.claimantName}` : ""}
      </p>
    );
  }

  return <p className="text-meta text-body">Waiting for a volunteer with this skill.</p>;
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
        className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <input
        type="tel"
        value={contactPhone}
        onChange={(e) => setContactPhone(e.target.value)}
        placeholder="Contact phone"
        className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes from the call"
        className="min-h-[72px] rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as JanazaTaskStatus)}
        className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        <option value="open">Open</option>
        <option value="claimed">Claimed</option>
        <option value="confirmed">Confirmed</option>
      </select>
      {message && <p className="text-meta text-accent">{message}</p>}
      {error && <p className="text-meta text-danger">{error}</p>}
      <Button
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
      >
        {busy ? "Saving…" : "Save contact"}
      </Button>
    </div>
  );
}

function ManualTaskReadout({ task }: { task: JanazaTask }) {
  if (!task.contactName && !task.contactPhone && !task.notes) {
    return <p className="text-meta text-body">No contact recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-0.5 text-meta text-body">
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
          <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">Janaza checklist</h1>
          <Badge variant={request.status}>{request.status}</Badge>
        </div>
        <p className="text-meta text-body">
          Requested by {request.requesterName ?? "a member"} · needed by {formatNeededBy(request.neededBy)}
        </p>
        {request.details && <p className="text-copy text-ink">{request.details}</p>}
        <ServicePrice price={JANAZA_PRICE} />
      </header>

      <ol className="flex flex-col gap-3">
        {tasks.map((task) => {
          const copy = ROLE_COPY[task.role];
          const claimable = task.role === "salat" || task.role === "ghusl";
          return (
            <li key={task.id} className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-raised p-4">
              <div className="flex items-start gap-3">
                <StatusDot status={taskDotStatus(task.status)} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-copy font-semibold text-ink">{copy.title}</span>
                    <Badge variant={task.status === "confirmed" ? "confirmed" : "pending"}>{task.status}</Badge>
                  </div>
                  <p className="text-meta text-body">{copy.blurb}</p>
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
