"use client";

import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { RadioCard } from "@/components/ui/RadioCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createOrgAndProject } from "@/lib/actions/onboarding";

const ORG_TYPES = ["Masjid", "Church", "Temple or synagogue", "Community center"];

type Phase = { name: string; budget: number };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function OnboardingWizard({ userEmail }: { userEmail: string | null }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orgType, setOrgType] = useState("Masjid");
  const [orgName, setOrgName] = useState("");

  const [projectName, setProjectName] = useState("");
  const [phases, setPhases] = useState<Phase[]>([
    { name: "", budget: 0 },
    { name: "", budget: 0 },
  ]);

  const [invites, setInvites] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = phases.reduce((sum, p) => sum + p.budget, 0);
  const namedPhases = phases.filter((phase) => phase.name.trim().length > 0);
  const canContinueStep2 = projectName.trim().length > 0 && namedPhases.length > 0;

  function updatePhase(index: number, field: keyof Phase, value: string) {
    setPhases((prev) =>
      prev.map((phase, i) =>
        i === index
          ? { ...phase, [field]: field === "budget" ? Number(value) || 0 : value }
          : phase
      )
    );
  }

  function addPhase() {
    setPhases((prev) => [...prev, { name: "", budget: 0 }]);
  }

  function removePhase(index: number) {
    setPhases((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function finishOnboarding(inviteEmails: string[]) {
    setSubmitting(true);
    setError(null);
    try {
      await createOrgAndProject({
        orgName: orgName.trim(),
        orgSlug: slugify(orgName),
        orgType,
        projectTitle: projectName.trim(),
        phases: namedPhases,
        inviteEmails,
      });
    } catch (err) {
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  function addInvite() {
    if (!inviteEmail.trim()) return;
    setInvites((prev) => [...prev, inviteEmail.trim()]);
    setInviteEmail("");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-surface">
      <header className="flex items-center gap-3 px-[18px] py-4">
        {step === 1 ? (
          <Logo size="sm" />
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setStep((s) => (s === 3 ? 2 : 1))}>
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-body" aria-hidden="true">
                <path
                  d="M12.5 5L7.5 10L12.5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-ink">
              {step === 2 ? "Phases" : "Approvers"}
            </span>
          </div>
        )}
        <div className="ml-auto flex gap-1">
          {[1, 2, 3].map((pip) => (
            <span
              key={pip}
              className={`h-1 w-[22px] rounded-2xs ${pip <= step ? "bg-accent" : "bg-step-empty"}`}
            />
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-[18px] px-[18px] py-[22px]">
        {step === 1 && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
                What kind of organization is this?
              </h1>
              <p className="text-sm text-body">
                This only changes the words we use — hall, sanctuary, prayer room. You can edit it
                later.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-meta font-semibold text-ink">
                Organization name
              </label>
              <input
                type="text"
                placeholder="Masjid Al-Noor"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3.5 py-3.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="flex flex-col gap-3">
              {ORG_TYPES.map((type) => (
                <RadioCard
                  key={type}
                  selected={orgType === type}
                  label={type}
                  onClick={() => setOrgType(type)}
                />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
                Break it into phases
              </h1>
              <p className="text-sm text-body">
                Donors give to a phase, not a general pot. Two is enough to start.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-meta font-semibold text-ink">
                Campaign name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Community hall renovation"
                className="w-full rounded-lg border border-border bg-white px-3.5 py-3.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              {phases.map((phase, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 shrink-0 font-mono text-xs text-muted">{i + 1}</span>
                  <input
                    type="text"
                    value={phase.name}
                    placeholder="Phase name"
                    onChange={(e) => updatePhase(i, "name", e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={phase.budget || ""}
                    placeholder="$"
                    onChange={(e) => updatePhase(i, "budget", e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-[88px] rounded-lg border border-border bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  {phases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhase(i)}
                      className="shrink-0 text-meta text-muted hover:text-danger"
                      aria-label={`Remove phase ${i + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPhase}
                className="flex items-center rounded-lg border border-dashed border-border-strong px-3.5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                + Add a phase
                <span className="ml-auto font-mono text-xs text-muted">
                  total {total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                </span>
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
                Who signs off on spending?
              </h1>
              <p className="text-sm text-body">
                Expenses over your limit need two approvals. Invite someone now, or skip and do it
                later.
              </p>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface-sunken p-3">
              <Avatar initials={(userEmail ?? "?").slice(0, 2).toUpperCase()} size={30} />
              <div className="flex flex-col">
                <span className="text-meta font-semibold text-ink">
                  {userEmail ?? "You"} (you)
                </span>
                <span className="text-micro text-muted">Admin · full access</span>
              </div>
            </div>

            {invites.map((email) => (
              <div
                key={email}
                className="flex items-center gap-2.5 rounded-lg border border-dashed border-pending-border bg-pending-bg p-3"
              >
                <Avatar initials="" size={30} dashed />
                <div className="flex flex-col">
                  <span className="text-meta font-semibold text-ink">{email}</span>
                  <span className="text-micro text-pending-text">
                    Approver · invite sends on next step
                  </span>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-white px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <Button variant="secondary" size="lg" onClick={addInvite}>
                Add
              </Button>
            </div>
          </>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-4">
          {error && <p className="text-meta text-danger">{error}</p>}
          <Button
            size="lg"
            fullWidth
            disabled={
              submitting ||
              (step === 1 && orgName.trim().length === 0) ||
              (step === 2 && !canContinueStep2)
            }
            onClick={async () => {
              if (step !== 3) {
                setStep((s) => (s + 1) as 1 | 2 | 3);
                return;
              }
              await finishOnboarding(invites);
            }}
          >
            {step === 3
              ? submitting
                ? "Creating…"
                : "Send invites & open dashboard"
              : "Continue"}
          </Button>
          {step === 3 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={() => finishOnboarding([])}
            >
              Skip for now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
