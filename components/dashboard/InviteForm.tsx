"use client";

import { useState } from "react";
import { inviteMember } from "@/lib/actions/invite";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"treasurer" | "admin" | "member">("treasurer");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await inviteMember(email.trim(), role);
      setMessage(`Invite sent to ${email.trim()}.`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col gap-4 bg-surface px-[18px] py-8">
      <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Invite a board member</h1>
      <p className="text-sm text-body">
        They&apos;ll get an email to sign in. Their org membership and role are already reserved.
      </p>

      <div className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
        >
          <option value="treasurer">Treasurer / approver</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </div>

      {message && <p className="text-[12.5px] text-accent">{message}</p>}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}

      <button
        type="button"
        disabled={submitting || email.trim().length === 0}
        onClick={handleSubmit}
        className="rounded-lg bg-accent py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send invite"}
      </button>
    </div>
  );
}
