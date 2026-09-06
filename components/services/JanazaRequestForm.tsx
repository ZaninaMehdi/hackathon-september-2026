"use client";

import { useState } from "react";
import Link from "next/link";
import { submitJanazaRequest } from "@/lib/actions/janaza";
import type { JanazaSkill, ServiceRequestItem } from "@/lib/data/services";
import { formatPriceRange, JANAZA_PRICE } from "@/lib/data/service-prices";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MemberSkillsForm } from "@/components/services/MemberSkillsForm";
import { ServicePrice } from "@/components/services/ServicePrice";

function defaultNeededBy() {
  const soon = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}T${pad(soon.getHours())}:${pad(soon.getMinutes())}`;
}

export function JanazaRequestForm({
  ownRequests,
  skills,
}: {
  ownRequests: ServiceRequestItem[];
  skills: JanazaSkill[];
}) {
  const [neededBy, setNeededBy] = useState(defaultNeededBy);
  const [details, setDetails] = useState("");
  const [broadcastCrossOrg, setBroadcastCrossOrg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const janazaRequests = ownRequests.filter((request) => request.serviceType === "janaza");

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitJanazaRequest({
        neededBy: new Date(neededBy).toISOString(),
        details,
        broadcastCrossOrg,
      });
    } catch (err) {
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw err;
      setError(err instanceof Error ? err.message : "Could not submit the request.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 p-4 min-[900px]:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">Janaza</h1>
        <p className="text-meta text-body">
          Urgent funeral request. Salat and ghusl are broadcast and claimed; transport and cemetery are
          coordinated by an admin.
        </p>
        <ServicePrice price={JANAZA_PRICE} />
      </header>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-meta font-medium text-ink">Needed by</span>
          <input
            type="datetime-local"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
            className="rounded-lg border border-border bg-white px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-meta font-medium text-ink">Details</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Family name, location, and any timing notes"
            className="min-h-[120px] rounded-lg border border-border bg-white px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex items-start gap-2 rounded-lg border border-hairline bg-white px-3.5 py-3">
          <input
            type="checkbox"
            checked={broadcastCrossOrg}
            onChange={(e) => setBroadcastCrossOrg(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-meta text-body">
            Also notify skilled volunteers in other organizations. Use this when time is critical.
          </span>
        </label>
        {error && <p className="text-meta text-danger">{error}</p>}
        <Button
          size="lg"
          disabled={submitting || details.trim().length === 0}
          onClick={handleSubmit}
        >
          {submitting ? "Sending…" : "Send urgent request"}
        </Button>
      </div>

      <MemberSkillsForm initialSkills={skills} />

      {janazaRequests.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-ink">Your requests</h2>
          {janazaRequests.map((request) => (
            <Link
              key={request.id}
              href={`/services/janaza/${request.id}`}
              className="flex flex-col gap-1 rounded-lg border border-hairline bg-white p-3.5"
            >
              <div className="flex items-center gap-2">
                <Badge variant={request.status}>{request.status}</Badge>
                <span className="text-meta text-body">
                  Open checklist · {formatPriceRange(JANAZA_PRICE)}
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
