"use client";

import { useState } from "react";
import { designateOfficiant, registerAsOfficiant, updateOfficiantServices } from "@/lib/actions/officiant";
import type {
  JanazaSkill,
  OfficiantInbox,
  OfficiantSummary,
  OrgMemberOption,
  RecurringWindow,
  ServiceType,
} from "@/lib/data/services";
import { AvailabilityGrid } from "@/components/services/AvailabilityGrid";
import { MemberSkillsForm } from "@/components/services/MemberSkillsForm";
import { NikahPriceForm } from "@/components/services/NikahPriceForm";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const SERVICE_OPTIONS: { id: ServiceType; label: string }[] = [
  { id: "nikah", label: "Nikah" },
  { id: "janaza", label: "Janaza" },
];

function ServiceChecks({
  value,
  onChange,
}: {
  value: ServiceType[];
  onChange: (next: ServiceType[]) => void;
}) {
  return (
    <div className="flex gap-3">
      {SERVICE_OPTIONS.map((option) => {
        const checked = value.includes(option.id);
        return (
          <label key={option.id} className="flex items-center gap-2 text-meta text-ink">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                onChange(checked ? value.filter((item) => item !== option.id) : [...value, option.id]);
              }}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

function RegisterPanel({
  title,
  submitLabel,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  onSubmit: (services: ServiceType[]) => Promise<void>;
}) {
  const [services, setServices] = useState<ServiceType[]>(["nikah", "janaza"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-raised p-4">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <ServiceChecks value={services} onChange={setServices} />
      {error && <p className="text-meta text-danger">{error}</p>}
      <Button
        size="lg"
        disabled={submitting || services.length === 0}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          try {
            await onSubmit(services);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save officiant.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}

function DesignatePanel({ members }: { members: OrgMemberOption[] }) {
  const eligible = members.filter((member) => !member.isOfficiant);
  const [memberId, setMemberId] = useState(eligible[0]?.id ?? "");
  const [services, setServices] = useState<ServiceType[]>(["nikah", "janaza"]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (eligible.length === 0) {
    return <p className="text-meta text-body">Every member in this organization is already an officiant.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="rounded-lg border border-border bg-surface-raised px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        {eligible.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <ServiceChecks value={services} onChange={setServices} />
      {message && <p className="text-meta text-accent">{message}</p>}
      {error && <p className="text-meta text-danger">{error}</p>}
      <Button
        variant="secondary"
        size="lg"
        disabled={submitting || !memberId}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          setMessage(null);
          try {
            await designateOfficiant(memberId, services);
            setMessage("Officiant added.");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not designate officiant.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {submitting ? "Adding…" : "Designate officiant"}
      </Button>
    </div>
  );
}

function OfferedServices({ officiant }: { officiant: OfficiantSummary }) {
  const [services, setServices] = useState<ServiceType[]>(officiant.services);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <ServiceChecks value={services} onChange={setServices} />
      {message && <p className="text-meta text-accent">{message}</p>}
      {error && <p className="text-meta text-danger">{error}</p>}
      <Button
        variant="secondary"
        size="lg"
        disabled={submitting || services.length === 0}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          setMessage(null);
          try {
            await updateOfficiantServices(services);
            setMessage("Services updated.");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update services.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {submitting ? "Saving…" : "Update services"}
      </Button>
    </div>
  );
}

export function OfficiantSettingsClient({
  inbox,
  recurring,
  canManage,
  members,
  skills,
  nikahPrice,
}: {
  inbox: OfficiantInbox | null;
  recurring: RecurringWindow[];
  canManage: boolean;
  members: OrgMemberOption[];
  skills: JanazaSkill[];
  nikahPrice: number | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-4 min-[900px]:p-6">
      <header className="flex flex-col gap-1">
        <Link href="/services" className="text-meta font-semibold text-accent">
          ← Services
        </Link>
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
          Officiant settings
        </h1>
        <p className="text-meta text-body">Hours, skills, fees, and who can officiate.</p>
      </header>

      {!inbox && (
        <RegisterPanel
          title="Register as an officiant"
          submitLabel="Register myself"
          onSubmit={registerAsOfficiant}
        />
      )}

      <MemberSkillsForm initialSkills={skills} />

      {inbox && (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">Services you offer</h2>
            <OfferedServices officiant={inbox.officiant} />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">Weekly availability</h2>
            <AvailabilityGrid recurring={recurring} />
          </section>
        </>
      )}

      {canManage && (
        <>
          <section className="flex flex-col gap-2">
            <NikahPriceForm initialAmount={nikahPrice} />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">Designate an officiant</h2>
            <DesignatePanel members={members} />
          </section>
        </>
      )}
    </div>
  );
}
