"use client";

import Link from "next/link";
import { NewProjectButton } from "@/components/dashboard/NewProjectButton";
import { AddExpenseButton } from "@/components/dashboard/AddExpenseButton";
import { buttonClasses } from "@/components/ui/Button";
import type { ProjectWithPhases } from "@/lib/data/phases";

type DashboardActionBarProps = {
  projects: ProjectWithPhases[];
};

export function DashboardActionBar({ projects }: DashboardActionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <Link href="/dashboard/invite" className={buttonClasses({ variant: "ghost" })}>
        Invite
      </Link>
      <NewProjectButton className={buttonClasses({ variant: "secondary" })}>
        New project
      </NewProjectButton>
      <AddExpenseButton projects={projects} />
    </div>
  );
}
