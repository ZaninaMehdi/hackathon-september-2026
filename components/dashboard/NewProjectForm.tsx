"use client";

import { useState } from "react";
import { createProject } from "@/lib/actions/project";

type Phase = { name: string; budget: number };

export function NewProjectForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phases, setPhases] = useState<Phase[]>([{ name: "Phase 1", budget: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updatePhase(index: number, field: keyof Phase, value: string) {
    setPhases((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [field]: field === "budget" ? Number(value) || 0 : value } : p
      )
    );
  }

  function addPhase() {
    setPhases((prev) => [...prev, { name: `Phase ${prev.length + 1}`, budget: 0 }]);
  }

  const total = phases.reduce((sum, p) => sum + p.budget, 0);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await createProject({ title: title.trim(), description: description.trim(), phases });
    } catch (err) {
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw err;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">Project title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[12.5px] font-semibold text-ink">Phases</label>
        {phases.map((phase, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={phase.name}
              onChange={(e) => updatePhase(i, "name", e.target.value)}
              className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink"
            />
            <input
              type="text"
              inputMode="numeric"
              value={phase.budget || ""}
              placeholder="Budget"
              onChange={(e) => updatePhase(i, "budget", e.target.value.replace(/[^0-9]/g, ""))}
              className="w-32 rounded-lg border border-border bg-white px-3 py-2.5 font-mono text-sm text-ink"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addPhase}
          className="flex items-center rounded-lg border border-dashed border-border-strong px-3.5 py-3 text-sm font-semibold text-accent"
        >
          + Add a phase
          <span className="ml-auto font-mono text-xs text-muted">
            total{" "}
            {total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          </span>
        </button>
      </div>

      {error && <p className="text-[12.5px] text-danger">{error}</p>}

      <button
        type="button"
        disabled={submitting || title.trim().length === 0}
        onClick={handleSubmit}
        className="mt-2 w-full rounded-lg bg-accent py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create project"}
      </button>
    </div>
  );
}
