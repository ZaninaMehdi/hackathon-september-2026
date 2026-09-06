"use client";

import { useState } from "react";
import { updateMyPreferences } from "@/lib/actions/organization";

type MemberPreferencesFormProps = {
  emailNotificationsEnabled: boolean;
};

export function MemberPreferencesForm({ emailNotificationsEnabled }: MemberPreferencesFormProps) {
  const [enabled, setEnabled] = useState(emailNotificationsEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    setError(null);
    try {
      await updateMyPreferences({ emailNotificationsEnabled: next });
    } catch (err) {
      setEnabled(!next);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-4">
      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={handleToggle}
          className="h-4 w-4 accent-accent"
        />
        <span className="text-copy text-ink">
          Email me about new donations and expenses in this organization
        </span>
      </label>
      {error && <p className="text-meta text-danger">{error}</p>}
    </div>
  );
}
