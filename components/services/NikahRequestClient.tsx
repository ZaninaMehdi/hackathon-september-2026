"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { requestNikahSlot } from "@/lib/actions/nikah";
import type { OfficiantSummary, OpenSlot, ServiceRequestItem } from "@/lib/data/services";
import { formatNikahFee } from "@/lib/data/service-prices";
import { Badge } from "@/components/ui/Badge";
import { RadioCard } from "@/components/ui/RadioCard";
import { NikahFee } from "@/components/services/ServicePrice";
import { NikahSlotPicker } from "@/components/services/NikahSlotPicker";

function statusCopy(status: ServiceRequestItem["status"]) {
  if (status === "expired" || status === "declined") {
    return "Pick another slot.";
  }
  if (status === "pending") return "Waiting for the officiant to confirm.";
  return "Confirmed.";
}

export function NikahRequestClient({
  officiants,
  selectedOfficiantId,
  slots,
  ownRequests,
  nikahPrice,
}: {
  officiants: OfficiantSummary[];
  selectedOfficiantId: string | null;
  slots: OpenSlot[];
  ownRequests: ServiceRequestItem[];
  nikahPrice: number | null;
}) {
  const router = useRouter();
  const selected = officiants.find((item) => item.id === selectedOfficiantId) ?? null;
  const [slotId, setSlotId] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const nikahRequests = useMemo(
    () => ownRequests.filter((request) => request.serviceType === "nikah"),
    [ownRequests]
  );
  const feeLabel = formatNikahFee(nikahPrice);

  function selectOfficiant(id: string) {
    setSlotId("");
    setError(null);
    setMessage(null);
    router.push(`/services/nikah?officiantId=${id}`);
  }

  async function handleRequest() {
    if (!slotId) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await requestNikahSlot(slotId, details);
      setMessage("Request sent. The slot is held until the officiant confirms.");
      setDetails("");
      setSlotId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request that slot.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 p-4 min-[900px]:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[19px] font-bold tracking-[-0.02em] text-ink">Nikah</h1>
        <p className="text-[13.5px] text-body">
          Choose an officiant, pick a day, then a time. The slot stays held until they confirm or 24 hours
          pass.
        </p>
        <NikahFee amount={nikahPrice} />
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-ink">Officiants</h2>
        {officiants.length === 0 ? (
          <p className="rounded-lg border border-hairline p-4 text-[13.5px] text-body">
            No officiants in this organization offer nikah yet.
          </p>
        ) : (
          officiants.map((officiant) => (
            <RadioCard
              key={officiant.id}
              selected={selected?.id === officiant.id}
              label={officiant.name}
              meta={feeLabel}
              onClick={() => selectOfficiant(officiant.id)}
            />
          ))
        )}
      </section>

      {selected && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink">Pick a day and time</h2>
          {slots.length === 0 ? (
            <p className="rounded-lg border border-hairline p-4 text-[13.5px] text-body">
              {selected.name} has no open slots. Ask them to set weekly hours.
            </p>
          ) : (
            <NikahSlotPicker slots={slots} selectedSlotId={slotId} onSelect={setSlotId} />
          )}
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Names, venue, or notes for the officiant"
            className="min-h-[96px] rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
          />
          {message && <p className="text-[12.5px] text-accent">{message}</p>}
          {error && <p className="text-[12.5px] text-danger">{error}</p>}
          <button
            type="button"
            disabled={submitting || !slotId}
            onClick={handleRequest}
            className="rounded-lg bg-accent py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Holding slot…" : "Request this slot"}
          </button>
        </section>
      )}

      {nikahRequests.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-ink">Your requests</h2>
          {nikahRequests.map((request) => (
            <div key={request.id} className="flex flex-col gap-1 rounded-lg border border-hairline bg-white p-3.5">
              <div className="flex items-center gap-2">
                <Badge variant={request.status}>{request.status}</Badge>
                <span className="text-[13.5px] font-medium text-ink">
                  {request.officiantName ?? "Officiant"}
                </span>
              </div>
              <p className="text-[12.5px] text-body">
                {statusCopy(request.status)} · {feeLabel}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
