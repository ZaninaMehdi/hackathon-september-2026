"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createPhaseTask, setPhaseTaskDone, deletePhaseTask } from "@/lib/actions/phaseTask";
import type { PhaseTask } from "@/lib/data/phases";

type PhaseTaskChecklistProps = {
  phaseId: string;
  tasks: PhaseTask[];
};

export function PhaseTaskChecklist({ phaseId, tasks }: PhaseTaskChecklistProps) {
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    setPending("add");
    setError(null);
    try {
      await createPhaseTask(phaseId, title);
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  async function handleToggle(task: PhaseTask) {
    setPending(task.id);
    setError(null);
    try {
      await setPhaseTaskDone(task.id, !task.done);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  async function handleDelete(taskId: string) {
    setPending(taskId);
    setError(null);
    try {
      await deletePhaseTask(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-3">
      <span className="text-micro font-semibold uppercase tracking-[0.04em] text-muted">
        Internal tasks · not visible to donors
      </span>

      {tasks.length === 0 && (
        <p className="text-meta text-muted">No tasks yet.</p>
      )}

      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={task.done}
            disabled={pending === task.id}
            onChange={() => handleToggle(task)}
            className="h-4 w-4 shrink-0 accent-accent"
          />
          <span
            className={`flex-1 text-meta ${task.done ? "text-muted line-through" : "text-ink"}`}
          >
            {task.title}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending === task.id}
            onClick={() => handleDelete(task.id)}
            aria-label="Delete task"
            className="shrink-0 px-2 text-copy leading-none text-muted hover:bg-danger-wash hover:text-danger"
          >
            ×
          </Button>
        </div>
      ))}

      <div className="mt-1 flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add a task…"
          className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-meta text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <Button
          variant="primary"
          size="sm"
          disabled={pending === "add" || newTitle.trim().length === 0}
          onClick={handleAdd}
          className="shrink-0"
        >
          Add
        </Button>
      </div>

      {error && <p className="text-meta text-danger">{error}</p>}
    </div>
  );
}
