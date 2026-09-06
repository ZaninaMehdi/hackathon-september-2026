"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RadioCard } from "@/components/ui/RadioCard";
import { ReceiptThumb } from "@/components/ui/ReceiptThumb";
import { submitExpense } from "@/lib/actions/expense";
import type { ProjectWithPhases } from "@/lib/data/phases";

type SubmitExpenseFormProps = {
  projects: ProjectWithPhases[];
};

export function SubmitExpenseForm({ projects }: SubmitExpenseFormProps) {
  const [projectId, setProjectId] = useState(projects[0]?.projectId ?? "");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const currentProject = projects.find((p) => p.projectId === projectId);
  const [phaseId, setPhaseId] = useState(currentProject?.phases[0]?.id ?? "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const phases = currentProject?.phases ?? [];
  const numericAmount = Number(amount) || 0;

  const missingReasons = [
    !receiptFile && "attach a receipt photo",
    description.trim().length === 0 && "describe what it was for",
    numericAmount <= 0 && "enter an amount",
    !phaseId && "choose a phase",
  ].filter((v): v is string => Boolean(v));

  const canSubmit = missingReasons.length === 0;

  function handleProjectChange(nextProjectId: string) {
    setProjectId(nextProjectId);
    const next = projects.find((p) => p.projectId === nextProjectId);
    setPhaseId(next?.phases[0]?.id ?? "");
  }

  async function handleSubmit() {
    if (!receiptFile) return;
    setSubmitting(true);
    setError(null);

    try {
      await submitExpense({
        projectId,
        phaseId,
        description: description.trim(),
        vendor: vendor.trim(),
        amount: numericAmount,
        receiptFile,
      });
    } catch (err) {
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw err;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (projects.length === 0) {
    return <p className="text-sm text-body">Create a campaign before submitting expenses.</p>;
  }

  return (
    <div className="flex flex-col bg-surface">
      <div className="flex flex-col gap-4">
        {projects.length > 1 && (
          <div>
            <label className="mb-1.5 block text-meta font-semibold text-ink">Campaign</label>
            <select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-3.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectTitle}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">
            Receipt photo
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          />
          {receiptFile ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface-raised p-3">
              <ReceiptThumb size={68} radius="rounded-sm" />
              <div className="flex flex-col gap-1">
                <span className="text-meta font-semibold text-ink">{receiptFile.name}</span>
                <span className="font-mono text-micro text-muted">
                  {(receiptFile.size / 1024 / 1024).toFixed(1)} MB · attached
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="self-start"
                >
                  Retake photo
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              className="h-auto border-dashed border-border-strong py-6 text-accent"
            >
              + Attach receipt photo
            </Button>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">
            What was it for?
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-3.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">Vendor</label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-3.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">Amount</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-3.5 font-mono text-[15px] text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">
            Charge to phase
          </label>
          {phases.length === 0 ? (
            <p className="text-meta text-body">This campaign has no phases yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {phases.map((phase) => (
                <RadioCard
                  key={phase.id}
                  selected={phaseId === phase.id}
                  label={phase.label}
                  meta={`${phase.remaining.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} left`}
                  onClick={() => setPhaseId(phase.id)}
                />
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-meta text-danger">{error}</p>}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Logging…" : "Log expense"}
        </Button>
        {!canSubmit && missingReasons.length > 0 && (
          <p className="text-center text-meta text-muted">
            To submit: {missingReasons.join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}
