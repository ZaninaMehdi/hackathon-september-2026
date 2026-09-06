"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/dashboard/Modal";
import { EditExpenseForm } from "@/components/dashboard/EditExpenseForm";
import { deleteExpense } from "@/lib/actions/expense";
import type { PhaseOption } from "@/lib/data/phases";
import type { ExpenseDetail } from "@/lib/data/expense";

type ExpenseDetailActionsProps = {
  expense: ExpenseDetail;
  phases: PhaseOption[];
};

export function ExpenseDetailActions({ expense, phases }: ExpenseDetailActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm("Delete this expense? This can't be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteExpense(expense.id);
    } catch (err) {
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw err;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" disabled={deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
        {error && <p className="text-meta text-danger">{error}</p>}
      </div>

      {editOpen && (
        <Modal title="Edit expense" onClose={() => setEditOpen(false)}>
          <EditExpenseForm expense={expense} phases={phases} onSaved={() => setEditOpen(false)} />
        </Modal>
      )}
    </>
  );
}
