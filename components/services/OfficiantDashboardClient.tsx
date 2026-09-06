"use client";

import { useState } from "react";
import { claimJanazaTask, confirmJanazaTask } from "@/lib/actions/janaza";
import { confirmNikahRequest, declineNikahRequest } from "@/lib/actions/nikah";
import type {
  ClaimableJanazaTask,
  GuestServiceInquiry,
  OfficiantInbox,
  ServiceRequestItem,
} from "@/lib/data/services";
import { PendingCountBadge } from "@/components/services/PendingCountBadge";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import Link from "next/link";

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

function NikahInbox({ requests }: { requests: ServiceRequestItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0) {
    return <p className="text-meta text-body">No pending nikah requests.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {requests.map((request) => (
        <div key={request.id} className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-3.5">
          <div className="flex items-center gap-2">
            <Badge variant="pending">Pending</Badge>
            <span className="text-meta font-medium text-ink">{request.requesterName}</span>
          </div>
          <p className="text-meta text-body">{formatSlot(request)}</p>
          {request.details && <p className="text-meta text-ink">{request.details}</p>}
          <div className="flex gap-2">
            <Button
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
              className="flex-1"
            >
              Confirm
            </Button>
            <Button
              variant="dangerSoft"
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
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </div>
      ))}
      {error && <p className="text-meta text-danger">{error}</p>}
    </div>
  );
}

function JanazaInbox({ tasks, memberId }: { tasks: ClaimableJanazaTask[]; memberId: string }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <p className="text-meta text-body">No salat or ghusl broadcasts right now.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => {
        const covered = task.status !== "open";
        return (
          <div key={task.id} className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-3.5">
            <div className="flex items-center gap-2">
              <Badge variant={task.status === "confirmed" ? "confirmed" : "pending"}>{task.role}</Badge>
              <span className="text-meta font-medium text-ink">{task.requesterName}</span>
            </div>
            <p className="text-meta text-body">Needed by {formatNeededBy(task.neededBy)}</p>
            {task.details && <p className="text-meta text-ink">{task.details}</p>}
            <Link
              href={`/services/janaza/${task.requestId}`}
              className={buttonClasses({
                variant: "ghost",
                size: "sm",
                className: "self-start -ml-3 text-accent",
              })}
            >
              Open checklist
            </Link>
            {covered ? (
              <p className="text-meta font-medium text-accent">
                {task.status === "confirmed" ? "Confirmed" : "Already covered"}
                {task.claimantName ? ` · ${task.claimantName}` : ""}
              </p>
            ) : (
              <Button
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
              >
                {busyId === task.id ? "Claiming…" : "I’ll do it"}
              </Button>
            )}
            {task.status === "claimed" && task.claimedBy === memberId && (
              <Button
                variant="secondary"
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
              >
                Mark confirmed
              </Button>
            )}
          </div>
        );
      })}
      {error && <p className="text-meta text-danger">{error}</p>}
    </div>
  );
}

function GuestInbox({ inquiries }: { inquiries: GuestServiceInquiry[] }) {
  if (inquiries.length === 0) {
    return <p className="text-meta text-body">No new community requests.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {inquiries.map((inquiry) => (
        <div key={inquiry.id} className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface-raised p-3.5">
          <div className="flex items-center gap-2">
            <Badge variant="pending">{inquiry.serviceType}</Badge>
            <span className="font-sans text-copy font-semibold text-ink">{inquiry.guestName}</span>
          </div>
          <p className="text-meta text-body">{inquiry.guestEmail}</p>
          {inquiry.guestPhone && <p className="text-meta text-body">{inquiry.guestPhone}</p>}
          {inquiry.preferredDate && (
            <p className="font-mono text-micro text-muted">Preferred {inquiry.preferredDate}</p>
          )}
          {inquiry.details && <p className="text-meta text-body">{inquiry.details}</p>}
        </div>
      ))}
    </div>
  );
}

export function OfficiantDashboardClient({
  inbox,
  pendingCount,
  claimableTasks,
  memberId,
  guestInquiries,
}: {
  inbox: OfficiantInbox | null;
  pendingCount: number;
  claimableTasks: ClaimableJanazaTask[];
  memberId: string;
  guestInquiries: GuestServiceInquiry[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-4 min-[900px]:p-6">
      <header className="flex items-center gap-2">
        <div className="flex flex-col">
          <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">Services</h1>
          <p className="text-meta text-body">Incoming nikah and janaza bookings.</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/dashboard/officiant" className="text-meta font-semibold text-body">
            Settings
          </Link>
          <PendingCountBadge count={pendingCount} />
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-ink">Community requests</h2>
        <GuestInbox inquiries={guestInquiries} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-ink">Pending nikah</h2>
        <NikahInbox requests={inbox?.pendingNikah ?? []} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-ink">Janaza tasks</h2>
        <JanazaInbox tasks={claimableTasks} memberId={memberId} />
      </section>
    </div>
  );
}
