"use client";

import { useState } from "react";

type EventRegisterButtonProps = {
  eventId: string;
  orgSlug: string;
  priceLabel: string;
};

export function EventRegisterButton({ eventId, orgSlug, priceLabel }: EventRegisterButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/events/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, attendeeName: name, attendeeEmail: email, orgSlug }),
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-accent-hover"
      >
        Register — {priceLabel}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] text-ink"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email for your receipt"
        className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] text-ink"
      />
      <button
        type="button"
        disabled={loading || email.trim().length === 0}
        onClick={handleRegister}
        className="w-full rounded-md bg-accent py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Redirecting…" : `Continue to payment — ${priceLabel}`}
      </button>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
