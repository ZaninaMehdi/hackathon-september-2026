"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type DonateFooterProps = {
  orgSlug: string;
  projectId: string;
  projectSlug: string;
  phaseId: string | null;
  phaseLabel: string;
  isAcceptingDonations: boolean;
  /** "bar" pins to the viewport bottom (mobile); "card" sits in the desktop sidebar. */
  variant?: "bar" | "card";
  className?: string;
};

export function DonateFooter({
  orgSlug,
  projectId,
  projectSlug,
  phaseId,
  phaseLabel,
  isAcceptingDonations,
  variant = "bar",
  className = "",
}: DonateFooterProps) {
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

  const body = (
    <>
      {variant === "card" && (
        <span className="mb-3 block font-mono text-micro font-medium uppercase tracking-[0.07em] text-muted">
          Support this project
        </span>
      )}

      {!isAcceptingDonations ? (
        <Button variant="secondary" size="lg" fullWidth disabled>
          This project is closed to new donations
        </Button>
      ) : !phaseId ? (
        <Button variant="secondary" size="lg" fullWidth disabled>
          No active phase yet
        </Button>
      ) : open ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center rounded-md border border-border bg-surface-raised px-3.5 transition-colors focus-within:border-accent">
              <span className="font-mono text-copy text-muted">$</span>
              <label htmlFor="donate-amount" className="sr-only">
                Donation amount in dollars
              </label>
              <input
                id="donate-amount"
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
      ) : (
        <Button size="lg" fullWidth onClick={() => setOpen(true)}>
          Donate to {phaseLabel}
        </Button>
      )}

      <p className="mt-2.5 text-center text-micro leading-[1.5] text-body">
        Funds are held per phase. You&apos;ll get an emailed receipt and a note when your phase
        closes.
      </p>
    </>
  );

  if (variant === "card") {
    return (
      <aside
        className={`sticky top-6 rounded-xl border border-hairline bg-surface-raised p-5 shadow-lift ${className}`}
      >
        {body}
      </aside>
    );
  }

  return (
    <footer
      className={`fixed bottom-0 left-1/2 w-full max-w-[440px] -translate-x-1/2 border-t border-hairline bg-surface px-[18px] pb-[18px] pt-3.5 ${className}`}
      style={{ paddingBottom: "calc(18px + env(safe-area-inset-bottom))" }}
    >
      {body}
    </footer>
  );
}
