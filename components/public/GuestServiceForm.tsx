"use client";

import { useMemo, useState } from "react";
import { submitGuestServiceInquiry, type GuestServiceInquiryInput } from "@/lib/actions/guestService";
import { NikahSlotPicker } from "@/components/services/NikahSlotPicker";
import type { OfficiantSummary, OpenSlot } from "@/lib/data/services";

type GuestServiceFormProps = {
  orgId: string;
  serviceType: GuestServiceInquiryInput["serviceType"];
  priceLabel: string;
  officiants?: OfficiantSummary[];
  slotsByOfficiant?: Record<string, OpenSlot[]>;
};

export function GuestServiceForm({
  orgId,
  serviceType,
  priceLabel,
  officiants = [],
  slotsByOfficiant = {},
}: GuestServiceFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [officiantId, setOfficiantId] = useState(officiants[0]?.id ?? "");
  const [slotId, setSlotId] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = useMemo(() => slotsByOfficiant[officiantId] ?? [], [slotsByOfficiant, officiantId]);
  const selectedSlot = slots.find((slot) => slot.id === slotId) ?? null;
  const selectedOfficiant = officiants.find((item) => item.id === officiantId) ?? null;
  const canSubmit = name.trim().length > 0 && email.trim().length > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const slotNote = selectedSlot
        ? `Requested slot: ${selectedSlot.label}${selectedOfficiant ? ` with ${selectedOfficiant.name}` : ""}`
        : "";
      await submitGuestServiceInquiry({
        orgId,
        serviceType,
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        preferredDate: selectedSlot ? selectedSlot.dateKey : preferredDate,
        details: [slotNote, details].filter(Boolean).join("\n"),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-accent-wash p-3.5 text-[13px] text-accent">
        Request sent — someone from the mosque will reach out to confirm details
        {priceLabel !== "Free" ? ` and payment (${priceLabel})` : ""}.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {serviceType === "nikah" && officiants.length > 0 && (
        <>
          <label className="text-micro font-semibold text-ink">Officiant</label>
          <select
            value={officiantId}
            onChange={(e) => {
              setOfficiantId(e.target.value);
              setSlotId("");
            }}
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13.5px] text-ink"
          >
            {officiants.map((officiant) => (
              <option key={officiant.id} value={officiant.id}>
                {officiant.name}
              </option>
            ))}
          </select>
          {slots.length > 0 ? (
            <NikahSlotPicker slots={slots} selectedSlotId={slotId} onSelect={setSlotId} />
          ) : (
            <p className="text-meta text-body">No open slots yet — leave a preferred date below.</p>
          )}
        </>
      )}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13.5px] text-ink"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13.5px] text-ink"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        className="w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13.5px] text-ink"
      />
      {(!selectedSlot || serviceType === "janaza") && (
        <input
          type="date"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          className="w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13.5px] text-ink"
        />
      )}
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        placeholder="Anything else we should know?"
        className="w-full resize-none rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13.5px] text-ink"
      />
      <button
        type="button"
        disabled={!canSubmit || submitting}
        onClick={handleSubmit}
        className="w-full rounded-md bg-accent py-2.5 text-[13.5px] font-semibold text-on-accent disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Request"}
      </button>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
