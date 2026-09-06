"use client";

import { useState } from "react";
import { Modal } from "@/components/dashboard/Modal";
import { SubmitExpenseForm } from "@/components/dashboard/SubmitExpenseForm";
import { Button } from "@/components/ui/Button";
import type { ProjectWithPhases } from "@/lib/data/phases";

type AddExpenseButtonProps = {
  projects: ProjectWithPhases[];
  className?: string;
};

export function AddExpenseButton({ projects, className }: AddExpenseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className}>
        Add expense
      </Button>

      {open && (
        <Modal title="Log an expense" onClose={() => setOpen(false)}>
          <SubmitExpenseForm projects={projects} />
        </Modal>
      )}
    </>
  );
}
