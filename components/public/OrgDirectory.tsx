"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { formatUsd } from "@/lib/mock/project";
import type { PublicOrgDirectoryItem } from "@/lib/data/project";

export function OrgDirectory({ orgs }: { orgs: PublicOrgDirectoryItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orgs;
    return orgs.filter((org) => {
      const haystack = `${org.name} ${org.slug} ${org.orgType ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [orgs, query]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-subhead font-semibold text-ink">Choose an organization</h2>
        <p className="text-meta text-body">No account. Pick a mosque, then pick a campaign.</p>
      </div>

      <label htmlFor="org-search" className="sr-only">
        Search organizations
      </label>
      <input
        id="org-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name"
        className="rounded-md border border-border bg-surface-raised px-3.5 py-2.5 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />

      {filtered.length === 0 && (
        <p className="text-sm text-body">
          {orgs.length === 0
            ? "No organizations have published a public page yet."
            : "No organizations match that search."}
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.map((org) => (
          <Link
            key={org.id}
            href={`/${org.slug}`}
            className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-3.5 shadow-card transition-shadow hover:shadow-lift"
          >
            <div className="flex items-start gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-sans text-copy font-semibold text-ink">{org.name}</span>
                {org.orgType && (
                  <span className="font-mono text-micro uppercase tracking-[0.04em] text-muted">
                    {org.orgType}
                  </span>
                )}
              </div>
              <span className={`${buttonClasses({ size: "sm", variant: "secondary" })} ml-auto shrink-0`}>
                View campaigns
              </span>
            </div>
            <p className="font-mono text-micro text-muted">
              {org.activeCampaigns} open campaign{org.activeCampaigns === 1 ? "" : "s"}
              {org.totalRaised > 0 ? ` · ${formatUsd(org.totalRaised)} raised` : ""}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
