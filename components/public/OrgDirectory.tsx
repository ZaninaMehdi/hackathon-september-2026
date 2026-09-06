"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OrgCard } from "@/components/public/OrgCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClasses } from "@/components/ui/Button";
import type { PublicOrgDirectoryItem } from "@/lib/data/project";

export function OrgDirectory({
  orgs,
  setupHref,
}: {
  orgs: PublicOrgDirectoryItem[];
  setupHref: string;
}) {
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
    <section id="organizations" className="flex flex-col gap-6 scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-head font-bold tracking-[-0.02em] text-ink min-[900px]:text-[28px] min-[900px]:leading-[1.2]">
            Choose an organization
          </h2>
          <p className="text-meta text-body">
            Pick a masjid or community center, then pick a campaign.
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
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          >
            <circle cx="7.2" cy="7.2" r="4.6" />
            <path d="m10.6 10.6 3 3" />
          </svg>
          <input
            id="org-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizations"
            className="w-full rounded-pill border border-border bg-surface-raised py-2.5 pr-3.5 pl-9 text-copy text-ink outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {filtered.length === 0 && orgs.length === 0 ? (
        <EmptyState
          icon="projects"
          title="No organizations yet"
          description="No organizations have published a public page yet."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="projects"
          title="No organizations found"
          description="Try a different organization name."
        />
      ) : (
        <ul className="grid w-full list-none grid-cols-1 items-stretch gap-4 min-[720px]:grid-cols-2">
          {filtered.map((org) => (
            <li key={org.id} className="flex w-full min-h-0 min-w-0">
              <OrgCard org={org} />
            </li>
          ))}
          {query.trim() === "" && (
            <li className="flex w-full min-h-0 min-w-0">
              <div className="flex h-full w-full min-w-0 flex-col justify-between gap-4 rounded-xl border border-dashed border-border-strong bg-surface-sunken p-4">
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-sans text-copy font-semibold text-ink">
                    Run a masjid or center?
                  </h3>
                  <p className="text-meta leading-[1.55] text-body">
                    Set up your first project and invite your board in about ten minutes.
                  </p>
                </div>
                <Link href={setupHref} className={`${buttonClasses({ variant: "secondary" })} w-fit`}>
                  Start setup
                </Link>
              </div>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
