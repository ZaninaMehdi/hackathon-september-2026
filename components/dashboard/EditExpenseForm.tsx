"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RadioCard } from "@/components/ui/RadioCard";
import { ReceiptThumb } from "@/components/ui/ReceiptThumb";
import { updateExpense } from "@/lib/actions/expense";
import type { PhaseOption } from "@/lib/data/phases";
import type { ExpenseDetail } from "@/lib/data/expense";

type EditExpenseFormProps = {
  expense: ExpenseDetail;
  phases: PhaseOption[];
  onSaved: () => void;
};

export function EditExpenseForm({ expense, phases, onSaved }: EditExpenseFormProps) {
  const [description, setDescription] = useState(expense.title);
  const [vendor, setVendor] = useState(expense.vendor);
  const [amount, setAmount] = useState(String(expense.amount));
  const [phaseId, setPhaseId] = useState(expense.phaseId ?? phases[0]?.id ?? "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const numericAmount = Number(amount) || 0;

  const missingReasons = [
    description.trim().length === 0 && "describe what it was for",
    numericAmount <= 0 && "enter an amount",
    !phaseId && "choose a phase",
  ].filter((v): v is string => Boolean(v));

  const canSubmit = missingReasons.length === 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      await updateExpense({
        expenseId: expense.id,
        phaseId,
        description: description.trim(),
        vendor: vendor.trim(),
        amount: numericAmount,
        receiptFile,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col bg-surface">
      <div className="flex flex-col gap-4">
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
            <div className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface-raised p-3">
              {expense.receiptUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={expense.receiptUrl}
                  alt="Current receipt"
                  className="h-[52px] w-[52px] shrink-0 rounded-sm object-cover"
                />
              ) : (
                <ReceiptThumb size={52} radius="rounded-sm" />
              )}
              <div className="flex flex-col gap-1">
                <span className="text-meta font-semibold text-ink">Current receipt</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="self-start"
                >
                  Replace photo
                </Button>
              </div>
            </div>
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
          {submitting ? "Saving…" : "Save changes"}
        </Button>
        {!canSubmit && missingReasons.length > 0 && (
          <p className="text-center text-meta text-muted">
            To save: {missingReasons.join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}
