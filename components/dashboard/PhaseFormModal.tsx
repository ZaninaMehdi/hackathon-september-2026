"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/dashboard/Modal";
import { createPhase, updatePhase, deletePhase } from "@/lib/actions/phase";
import type { ProjectPhaseDetail } from "@/lib/data/phases";

type PhaseFormModalProps = {
  projectId: string;
  phase?: ProjectPhaseDetail;
  onClose: () => void;
};

export function PhaseFormModal({ projectId, phase, onClose }: PhaseFormModalProps) {
  const [title, setTitle] = useState(phase?.title ?? "");
  const [description, setDescription] = useState(phase?.description ?? "");
  const [budget, setBudget] = useState(phase ? String(phase.budgetTarget) : "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericBudget = Number(budget) || 0;
  const canSubmit = title.trim().length > 0 && numericBudget > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (phase) {
        await updatePhase({
          phaseId: phase.id,
          title: title.trim(),
          description: description.trim(),
          budgetTarget: numericBudget,
        });
      } else {
        await createPhase({
          projectId,
          title: title.trim(),
          description: description.trim(),
          budgetTarget: numericBudget,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!phase) return;
    if (!window.confirm(`Delete "${phase.title}"? This can't be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePhase(phase.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <Modal title={phase ? "Edit phase" : "Add phase"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">Phase name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-3.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">
            Description <span className="font-normal text-muted">(shown to donors)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does this phase cover?"
            className="w-full resize-none rounded-lg border border-border bg-surface-raised px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">Budget target</label>
          <input
            type="text"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-3.5 font-mono text-[15px] text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {phase?.hasActivity && (
          <p className="text-meta text-muted">
            This phase has donations or expenses recorded, so it can&apos;t be deleted — you can
            still rename it or adjust its budget.
          </p>
        )}

        {error && <p className="text-meta text-danger">{error}</p>}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit || submitting || deleting}
          onClick={handleSubmit}
        >
          {submitting ? "Saving…" : phase ? "Save changes" : "Add phase"}
        </Button>

        {phase && !phase.hasActivity && (
          <Button
            variant="danger"
            fullWidth
            disabled={submitting || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Delete phase"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
