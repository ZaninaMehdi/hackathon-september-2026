"use client";

import { useState } from "react";
import { saveOrgNikahPrice } from "@/lib/actions/nikah";
import { formatNikahFee } from "@/lib/data/service-prices";
import { Button } from "@/components/ui/Button";

export function NikahPriceForm({ initialAmount }: { initialAmount: number | null }) {
  const [value, setValue] = useState(initialAmount != null ? String(initialAmount) : "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-white p-4">
      <div>
        <h2 className="text-sm font-bold text-ink">Nikah fee</h2>
        <p className="text-meta text-body">
          Shown to members when they book. Current: {formatNikahFee(initialAmount)}.
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-meta font-medium text-ink">Amount (USD)</span>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="300"
          className="rounded-lg border border-border bg-white px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      {message && <p className="text-meta text-accent">{message}</p>}
      {error && <p className="text-meta text-danger">{error}</p>}
      <Button
        size="lg"
        disabled={submitting || value.trim().length === 0}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          setMessage(null);
          try {
            await saveOrgNikahPrice(Number(value));
            setMessage("Nikah fee saved.");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save the fee.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {submitting ? "Saving…" : "Save nikah fee"}
      </Button>
    </div>
  );
}
