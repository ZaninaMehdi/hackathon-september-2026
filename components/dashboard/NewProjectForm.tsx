"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createProject } from "@/lib/actions/project";

type Phase = { name: string; budget: number };

export function NewProjectForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isZakatEligible, setIsZakatEligible] = useState(false);
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
      await createProject({
        title: title.trim(),
        description: description.trim(),
        phases,
        isZakatEligible,
      });
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
        <label className="mb-1.5 block text-meta font-semibold text-ink">Project title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-meta font-semibold text-ink">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <label className="flex items-center gap-2.5 rounded-lg border border-hairline bg-white px-3.5 py-3">
        <input
          type="checkbox"
          checked={isZakatEligible}
          onChange={(e) => setIsZakatEligible(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        <span className="text-copy text-ink">Zakat-eligible</span>
      </label>

      <div className="flex flex-col gap-2">
        <label className="text-meta font-semibold text-ink">Phases</label>
        {phases.map((phase, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={phase.name}
              onChange={(e) => updatePhase(i, "name", e.target.value)}
              className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <input
              type="text"
              inputMode="numeric"
              value={phase.budget || ""}
              placeholder="Budget"
              onChange={(e) => updatePhase(i, "budget", e.target.value.replace(/[^0-9]/g, ""))}
              className="w-32 rounded-lg border border-border bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        ))}
        <Button
          variant="secondary"
          onClick={addPhase}
          className="border-dashed border-border-strong text-accent"
        >
          + Add a phase
          <span className="ml-auto font-mono text-xs text-muted">
            total{" "}
            {total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          </span>
        </Button>
      </div>

      {error && <p className="text-meta text-danger">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting || title.trim().length === 0}
        onClick={handleSubmit}
        className="mt-2"
      >
        {submitting ? "Creating…" : "Create project"}
      </Button>
    </div>
  );
}
