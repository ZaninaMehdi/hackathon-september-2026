"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/dashboard/Modal";
import { NewProjectForm } from "@/components/dashboard/NewProjectForm";
import { SubmitExpenseForm } from "@/components/dashboard/SubmitExpenseForm";
import type { ProjectWithPhases } from "@/lib/data/phases";

type DashboardActionBarProps = {
  projects: ProjectWithPhases[];
};

export function DashboardActionBar({ projects }: DashboardActionBarProps) {
  const [openModal, setOpenModal] = useState<"project" | "expense" | null>(null);

  return (
    <>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
        <Link
          href="/dashboard/invite"
          className="rounded-md border border-border bg-white px-3.5 py-[9px] text-[13px] font-semibold text-ink"
        >
          Invite
        </Link>
        <button
          type="button"
          onClick={() => setOpenModal("project")}
          className="rounded-md border border-border bg-white px-3.5 py-[9px] text-[13px] font-semibold text-ink"
        >
          New project
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("expense")}
          className="rounded-md bg-accent px-3.5 py-[9px] text-[13px] font-semibold text-white hover:bg-accent-hover"
        >
          Add expense
        </button>
      </div>

      {openModal === "project" && (
        <Modal title="New project" onClose={() => setOpenModal(null)}>
          <NewProjectForm />
        </Modal>
      )}

      {openModal === "expense" && (
        <Modal title="Log an expense" onClose={() => setOpenModal(null)}>
          <SubmitExpenseForm projects={projects} />
        </Modal>
      )}
    </>
  );
}
