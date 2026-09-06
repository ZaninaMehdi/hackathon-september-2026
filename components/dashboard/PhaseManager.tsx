"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PhaseFormModal } from "@/components/dashboard/PhaseFormModal";
import { PhaseTaskChecklist } from "@/components/dashboard/PhaseTaskChecklist";
import { formatUsd } from "@/lib/mock/project";
import type { ProjectPhaseDetail } from "@/lib/data/phases";

type PhaseManagerProps = {
  projectId: string;
  phases: ProjectPhaseDetail[];
  canManage: boolean;
};

export function PhaseManager({ projectId, phases, canManage }: PhaseManagerProps) {
  const [adding, setAdding] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ProjectPhaseDetail | null>(null);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-3">
        <h2 className="text-sm font-bold text-ink">Phases</h2>
        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            className="ml-auto"
          >
            + Add phase
          </Button>
        )}
      </div>

      {phases.length === 0 ? (
        <EmptyState
          icon="phases"
          title="No phases yet"
          description={
            canManage
              ? "Break this project into phases so donors can fund one milestone at a time."
              : "This project hasn't been broken into phases yet."
          }
          compact
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {phases.map((phase, i) => (
            <div
              key={phase.id}
              className="flex flex-col gap-2 rounded-lg border border-hairline p-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-meta font-semibold text-ink">
                  {i + 1} · {phase.title}
                </span>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPhase(phase)}
                    className="ml-auto"
                  >
                    Edit
                  </Button>
                )}
              </div>
              {phase.description && (
                <p className="text-meta leading-[1.5] text-body">{phase.description}</p>
              )}
              <ProgressBar
                raised={phase.raised}
                target={phase.budgetTarget}
                label={`${formatUsd(phase.raised)} of ${formatUsd(phase.budgetTarget)} raised`}
              />
              <div className="flex items-center justify-between font-mono text-[11.5px] text-muted">
                <span>{formatUsd(phase.raised)} raised</span>
                <span>{formatUsd(phase.spent)} spent</span>
                <span>{formatUsd(phase.budgetTarget)} goal</span>
              </div>

              {canManage && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedPhaseId(expandedPhaseId === phase.id ? null : phase.id)
                    }
                    className="self-start"
                  >
                    {phase.tasks.filter((t) => t.status === "done").length}/{phase.tasks.length} tasks{" "}
                    {expandedPhaseId === phase.id ? "▲" : "▼"}
                  </Button>
                  {expandedPhaseId === phase.id && (
                    <PhaseTaskChecklist phaseId={phase.id} tasks={phase.tasks} />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <PhaseFormModal projectId={projectId} onClose={() => setAdding(false)} />
      )}
      {editingPhase && (
        <PhaseFormModal
          projectId={projectId}
          phase={editingPhase}
          onClose={() => setEditingPhase(null)}
        />
      )}
    </div>
  );
}
