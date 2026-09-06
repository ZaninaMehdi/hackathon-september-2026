"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/dashboard/Modal";
import { NewProjectButton } from "@/components/dashboard/NewProjectButton";
import { SubmitExpenseForm } from "@/components/dashboard/SubmitExpenseForm";
import type { ProjectWithPhases } from "@/lib/data/phases";

type DashboardActionBarProps = {
  projects: ProjectWithPhases[];
};

export function DashboardActionBar({ projects }: DashboardActionBarProps) {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  return (
    <>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
        <Link
          href="/dashboard/invite"
          className="rounded-md border border-border bg-white px-3.5 py-[9px] text-[13px] font-semibold text-ink"
        >
          Invite
        </Link>
        <NewProjectButton className="rounded-md border border-border bg-white px-3.5 py-[9px] text-[13px] font-semibold text-ink">
          New project
        </NewProjectButton>
        <button
          type="button"
          onClick={() => setExpenseModalOpen(true)}
          className="rounded-md bg-accent px-3.5 py-[9px] text-[13px] font-semibold text-white hover:bg-accent-hover"
        >
          Add expense
        </button>
      </div>

      {expenseModalOpen && (
        <Modal title="Log an expense" onClose={() => setExpenseModalOpen(false)}>
          <SubmitExpenseForm projects={projects} />
        </Modal>
      )}
    </>
  );
}
