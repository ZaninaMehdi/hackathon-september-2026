"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";

type DonateFormProps = {
  orgSlug: string;
  projectId: string;
  projectSlug: string;
  phaseId: string | null;
  phaseLabel: string;
  isAcceptingDonations: boolean;
  buttonLabel?: string;
};

export function DonateForm({
  orgSlug,
  projectId,
  projectSlug,
  phaseId,
  phaseLabel,
  isAcceptingDonations,
  buttonLabel,
}: DonateFormProps) {
  const amountId = useId();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDonate() {
    if (!phaseId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, phaseId, phaseLabel, projectId, projectSlug, orgSlug }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
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
        {buttonLabel ?? `Donate to ${phaseLabel}`}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
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
