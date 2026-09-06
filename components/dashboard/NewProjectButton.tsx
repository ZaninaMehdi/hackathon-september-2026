"use client";

import { useState } from "react";
import { Modal } from "@/components/dashboard/Modal";
import { NewProjectForm } from "@/components/dashboard/NewProjectForm";

type NewProjectButtonProps = {
  className?: string;
  children: React.ReactNode;
};

export function NewProjectButton({ className, children }: NewProjectButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <Modal title="New project" onClose={() => setOpen(false)}>
          <NewProjectForm />
        </Modal>
      )}
    </>
  );
}
