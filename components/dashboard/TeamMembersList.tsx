"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { setMemberRole } from "@/lib/actions/organization";
import type { OrgMember } from "@/lib/data/organization";

type TeamMembersListProps = {
  members: OrgMember[];
  currentMemberId: string;
  canManage: boolean;
};

const ROLE_OPTIONS = ["admin", "treasurer", "member"] as const;

export function TeamMembersList({ members, currentMemberId, canManage }: TeamMembersListProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(memberId: string, role: (typeof ROLE_OPTIONS)[number]) {
    setPending(memberId);
    setError(null);
    try {
      await setMemberRole(memberId, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-2">
      {error && <p className="px-2.5 pt-1.5 text-meta text-danger">{error}</p>}
      {members.map((member) => {
        const primaryRole = member.roles[0] ?? "member";
        return (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-md px-2.5 py-2.5 hover:bg-surface-sunken"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-meta font-semibold text-ink">
                {member.fullName || member.email}
                {member.id === currentMemberId && (
                  <span className="ml-1.5 font-normal text-muted">(you)</span>
                )}
              </span>
              {member.fullName && (
                <span className="truncate text-micro text-muted">{member.email}</span>
              )}
            </div>

            {canManage ? (
              <select
                value={primaryRole}
                disabled={pending === member.id}
                onChange={(e) =>
                  handleRoleChange(member.id, e.target.value as (typeof ROLE_OPTIONS)[number])
                }
                className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-micro font-semibold capitalize text-ink outline-none focus:border-accent"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            ) : (
              <Badge variant="draft" compact className="shrink-0 capitalize">
                {primaryRole}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
