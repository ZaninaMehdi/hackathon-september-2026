"use client";

import { useMemo, useState } from "react";
import { OrgCard } from "@/components/public/OrgCard";
import type { PublicOrgDirectoryItem } from "@/lib/data/project";

export function OrgDirectory({ orgs }: { orgs: PublicOrgDirectoryItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orgs;
    return orgs.filter((org) => {
      const haystack =
        `${org.name} ${org.slug} ${org.orgType ?? ""} ${org.description ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [orgs, query]);

  return (
    <section id="organizations" className="flex flex-col gap-5 scroll-mt-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
            Choose an organization
          </h2>
          <p className="text-meta text-body">
            Pick a masjid or community center, then pick a campaign. No account needed.
          </p>
        </div>

        <div className="relative w-full min-[560px]:w-[260px]">
          <label htmlFor="org-search" className="sr-only">
            Search organizations
          </label>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          >
            <circle cx="7.2" cy="7.2" r="4.6" />
            <path d="m10.6 10.6 3 3" />
          </svg>
          <input
            id="org-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            className="w-full rounded-md border border-border bg-surface-raised py-2.5 pr-3 pl-9 text-copy text-ink outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border bg-surface-sunken px-6 py-10 text-center">
          <p className="text-copy font-semibold text-ink">
            {orgs.length === 0 ? "No organizations yet" : "No matches"}
          </p>
          <p className="text-meta text-body">
            {orgs.length === 0
              ? "No organizations have published a public page yet."
              : `Nothing matches “${query.trim()}”. Try a different name.`}
          </p>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 min-[720px]:grid-cols-2">
          {filtered.map((org) => (
            <li key={org.id} className="flex">
              <OrgCard org={org} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
