"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { setPhaseTaskStatus, deletePhaseTask } from "@/lib/actions/phaseTask";
import { nextTaskStatus } from "@/lib/utils/taskStatus";
import type { OrgTask, TaskStatus } from "@/lib/data/tasks";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

type TasksBoardProps = {
  tasks: OrgTask[];
  canManage: boolean;
};

export function TasksBoard({ tasks, canManage }: TasksBoardProps) {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.projectId, t.projectTitle);
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [tasks]);

  const filteredTasks = useMemo(
    () => (projectFilter === "all" ? tasks : tasks.filter((t) => t.projectId === projectFilter)),
    [tasks, projectFilter]
  );

  async function handleAdvance(task: OrgTask) {
    setPending(task.id);
    setError(null);
    try {
      await setPhaseTaskStatus(task.id, nextTaskStatus(task.status));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  async function handleRevert(task: OrgTask) {
    setPending(task.id);
    setError(null);
    try {
      await setPhaseTaskStatus(task.id, "todo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  async function handleDelete(task: OrgTask) {
    setPending(task.id);
    setError(null);
    try {
      await deletePhaseTask(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="tasks"
        title="No tasks yet"
        description="Add tasks from a phase's card on its project page — they'll show up here across every project."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {projects.length > 1 && (
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-full max-w-[280px] rounded-md border border-border bg-surface-raised px-3 py-2 text-meta text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      )}

      {error && <p className="text-meta text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnTasks = filteredTasks.filter((t) => t.status === column.status);
          return (
            <div key={column.status} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-subhead font-semibold text-ink">{column.label}</h2>
                <span className="font-mono text-micro text-muted">{columnTasks.length}</span>
              </div>

              <div className="flex flex-col gap-2">
                {columnTasks.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border bg-surface-sunken px-3 py-4 text-center text-meta text-muted">
                    Nothing here
                  </p>
                )}

                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-3 shadow-card"
                  >
                    <span
                      className={`text-meta font-semibold ${
                        task.status === "done" ? "text-muted line-through" : "text-ink"
                      }`}
                    >
                      {task.title}
                    </span>
                    <Link
                      href={`/dashboard/projects/${task.projectId}`}
                      className="truncate text-micro text-accent hover:underline"
                    >
                      {task.phaseTitle} · {task.projectTitle}
                    </Link>

                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        {task.status !== "done" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={pending === task.id}
                            onClick={() => handleAdvance(task)}
                            className="flex-1"
                          >
                            {task.status === "todo" ? "Start →" : "Finish →"}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={pending === task.id}
                            onClick={() => handleRevert(task)}
                            className="flex-1"
                          >
                            ↺ Reopen
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending === task.id}
                          onClick={() => handleDelete(task)}
                          aria-label="Delete task"
                          className="px-2 text-copy leading-none text-muted hover:bg-danger-wash hover:text-danger"
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
