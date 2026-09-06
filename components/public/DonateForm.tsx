"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatUsd } from "@/lib/mock/project";
import type { DonatablePhase } from "@/lib/data/project";

type DonateFormProps = {
  orgSlug: string;
  projectId: string;
  projectSlug: string;
  phaseId: string | null;
  phaseLabel: string;
  isAcceptingDonations: boolean;
  buttonLabel?: string;
  /** When a campaign has more than one open phase, lets the donor pick which one to fund. */
  phases?: DonatablePhase[];
};

export function DonateForm({
  orgSlug,
  projectId,
  projectSlug,
  phaseId,
  phaseLabel,
  isAcceptingDonations,
  buttonLabel,
  phases,
}: DonateFormProps) {
  const amountId = useId();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(phaseId);

  const openPhases = (phases ?? []).filter((p) => !p.isComplete);
  const selectedPhase = openPhases.find((p) => p.id === selectedPhaseId);
  const effectivePhaseId = openPhases.length > 1 ? selectedPhaseId : phaseId;
  const effectivePhaseLabel = openPhases.length > 1 ? (selectedPhase?.label ?? phaseLabel) : phaseLabel;

  async function handleDonate() {
    if (!effectivePhaseId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          phaseId: effectivePhaseId,
          phaseLabel: effectivePhaseLabel,
          projectId,
          projectSlug,
          orgSlug,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  if (!isAcceptingDonations) {
    return (
      <Button variant="secondary" size="lg" fullWidth disabled>
        This campaign is closed to new donations
      </Button>
    );
  }

  if (!phaseId) {
    return (
      <Button variant="secondary" size="lg" fullWidth disabled>
        No active phase yet
      </Button>
    );
  }

  if (!open) {
    return (
      <Button size="lg" fullWidth onClick={() => setOpen(true)}>
        {buttonLabel ?? `Donate to ${effectivePhaseLabel}`}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {openPhases.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.04em] text-muted">
            Choose a phase
          </span>
          {openPhases.map((phase) => {
            const selected = phase.id === selectedPhaseId;
            return (
              <button
                type="button"
                key={phase.id}
                onClick={() => setSelectedPhaseId(phase.id)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-meta transition-colors ${
                  selected ? "border-accent bg-accent-tint" : "border-border bg-surface-raised"
                }`}
              >
                <span className="font-semibold text-ink">{phase.label}</span>
                <span className="font-mono text-micro text-muted">
                  {formatUsd(phase.raised)} of {formatUsd(phase.target)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-md border border-border bg-surface-raised px-3.5 transition-colors focus-within:border-accent">
          <span className="font-mono text-copy text-muted">$</span>
          <label htmlFor={amountId} className="sr-only">
            Donation amount in dollars
          </label>
          <input
            id={amountId}
            type="text"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full bg-transparent py-3 pl-1 font-mono text-copy text-ink outline-none"
          />
        </div>
        <Button size="lg" onClick={handleDonate} disabled={loading}>
          {loading ? "Redirecting…" : "Continue"}
        </Button>
      </div>
      {error && <p className="text-center text-meta text-danger">{error}</p>}
    </div>
  );
}
