"use client";

import { useState } from "react";
import { saveMemberSkills } from "@/lib/actions/janaza";
import type { JanazaSkill } from "@/lib/data/services";

const SKILL_OPTIONS: { id: JanazaSkill; label: string; hint: string }[] = [
  { id: "salat", label: "Salat", hint: "Lead or join the funeral prayer" },
  { id: "ghusl", label: "Ghusl", hint: "Wash and prepare the deceased" },
];

export function MemberSkillsForm({ initialSkills }: { initialSkills: JanazaSkill[] }) {
  const [skills, setSkills] = useState<JanazaSkill[]>(initialSkills);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-white p-4">
      <div>
        <h2 className="text-sm font-bold text-ink">Your janaza skills</h2>
        <p className="text-[12.5px] text-body">
          Salat and ghusl broadcasts go to members who list the matching skill.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {SKILL_OPTIONS.map((option) => {
          const checked = skills.includes(option.id);
          return (
            <label key={option.id} className="flex items-start gap-2 text-[13.5px] text-ink">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  setSkills((current) =>
                    checked ? current.filter((skill) => skill !== option.id) : [...current, option.id]
                  );
                }}
                className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
              />
              <span>
                <span className="font-medium">{option.label}</span>
                <span className="block text-[12px] text-body">{option.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
      {message && <p className="text-[12.5px] text-accent">{message}</p>}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <button
        type="button"
        disabled={submitting}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          setMessage(null);
          try {
            await saveMemberSkills(skills);
            setMessage("Skills saved.");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save skills.");
          } finally {
            setSubmitting(false);
          }
        }}
        className="rounded-lg border border-border bg-white py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save skills"}
      </button>
    </div>
  );
}
