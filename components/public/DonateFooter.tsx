"use client";

import { useState } from "react";

type DonateFooterProps = {
  orgSlug: string;
  projectId: string;
  phaseId: string | null;
  phaseLabel: string;
};

export function DonateFooter({ orgSlug, projectId, phaseId, phaseLabel }: DonateFooterProps) {
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
        body: JSON.stringify({ amount, phaseId, phaseLabel, projectId, orgSlug }),
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

  return (
    <footer
      className="fixed bottom-0 left-1/2 w-full max-w-[440px] -translate-x-1/2 border-t border-hairline bg-surface px-[18px] pb-[18px] pt-3.5"
      style={{ paddingBottom: "calc(18px + env(safe-area-inset-bottom))" }}
    >
      {!phaseId ? (
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-neutral-wash py-4 font-sans text-[15px] font-semibold text-muted"
        >
          No active phase yet
        </button>
      ) : open ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center rounded-lg border border-border bg-white px-3.5">
              <span className="font-mono text-[15px] text-muted">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full bg-transparent py-3.5 pl-1 font-mono text-[15px] text-ink outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleDonate}
              disabled={loading}
              className="whitespace-nowrap rounded-lg bg-accent px-5 py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Redirecting…" : "Continue"}
            </button>
          </div>
          {error && <p className="text-center text-[12.5px] text-danger">{error}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg bg-accent py-4 font-sans text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Donate to {phaseLabel}
        </button>
      )}
      <p className="mt-2.5 text-center text-[11.5px] leading-[1.5] text-body">
        Funds are held per phase. You&apos;ll get an emailed receipt and a note when your phase
        closes.
      </p>
    </footer>
  );
}
