"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { setProjectStatus, deleteProject, type ProjectStatus } from "@/lib/actions/project";

type ProjectManageMenuProps = {
  projectId: string;
  status: ProjectStatus;
  hasFinancialActivity: boolean;
};

export function ProjectManageMenu({ projectId, status, hasFinancialActivity }: ProjectManageMenuProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSetStatus(next: ProjectStatus, confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setPending(next);
    setError(null);
    setOpen(false);
    try {
      await setProjectStatus(projectId, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Permanently delete this project? This can't be undone. Only allowed because it has no donations or expenses yet."
      )
    ) {
      return;
    }
    setPending("delete");
    setError(null);
    setOpen(false);
    try {
      await deleteProject(projectId);
    } catch (err) {
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw err;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(null);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending !== null}
        onClick={() => setOpen((v) => !v)}
        aria-label="Manage project"
        className="w-8 px-0"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="3" cy="8" r="1.4" fill="currentColor" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" />
          <circle cx="13" cy="8" r="1.4" fill="currentColor" />
        </svg>
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 flex w-[220px] flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-lg">
            {status === "active" && (
              <MenuItem
                danger
                onClick={() =>
                  handleSetStatus(
                    "closed",
                    "Close this project? It will stop accepting new donations, but stays fully visible."
                  )
                }
              >
                Close project
              </MenuItem>
            )}

            {status === "closed" && (
              <MenuItem onClick={() => handleSetStatus("active")}>Reopen project</MenuItem>
            )}

            {status === "archived" ? (
              <MenuItem onClick={() => handleSetStatus("active")}>Unarchive</MenuItem>
            ) : hasFinancialActivity ? (
              <MenuItem
                onClick={() =>
                  handleSetStatus(
                    "archived",
                    "Archive this project? It will disappear from your dashboard lists, but its public page and ledger stay intact."
                  )
                }
              >
                Archive project
              </MenuItem>
            ) : (
              <MenuItem danger onClick={handleDelete}>
                Delete project
              </MenuItem>
            )}
          </div>
        </>
      )}

      {error && (
        <p className="absolute right-0 top-[calc(100%+6px)] z-50 w-[220px] rounded-lg border border-hairline bg-surface p-3 text-meta text-danger shadow-lg">
          {error}
        </p>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 text-left text-meta font-semibold hover:bg-surface-sunken ${
        danger ? "text-danger" : "text-ink"
      }`}
    >
      {children}
    </button>
  );
}
