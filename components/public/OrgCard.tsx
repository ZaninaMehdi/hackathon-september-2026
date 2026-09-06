"use client";

import Image from "next/image";
import Link from "next/link";
import { formatUsd } from "@/lib/mock/project";
import type { PublicOrgDirectoryItem } from "@/lib/data/project";

/** "Masjid-al-sabr" -> "MS", "Amanah" -> "AM". */
function initials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function OrgCard({ org }: { org: PublicOrgDirectoryItem }) {
  const avatarUrl = org.logoUrl ?? org.coverImageUrl ?? null;
  const meta = org.orgType;

  return (
    <Link
      href={`/${org.slug}`}
      aria-label={`View campaigns for ${org.name}`}
      className="group flex h-full w-full min-w-0 flex-col gap-3 rounded-xl border border-hairline bg-surface-raised p-4 shadow-card outline-none transition duration-150 hover:border-border hover:shadow-lift focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-accent-wash">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center font-sans text-meta font-bold text-accent"
            >
              {initials(org.name)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-copy font-semibold text-ink">{org.name}</h3>
          {meta && (
            <p className="truncate font-mono text-[10px] font-medium tracking-[0.06em] text-muted uppercase">
              {meta}
            </p>
          )}
        </div>
      </div>

      {/* Always two lines so a missing description doesn't shrink the card
          relative to its neighbor. */}
      <p className="line-clamp-2 h-[3.1em] text-meta leading-[1.55] text-body">
        {org.description || "\u00a0"}
      </p>

      <div className="mt-auto flex items-center gap-2 border-t border-hairline-soft pt-3">
        <span className="min-w-0 truncate text-meta text-body">
          {org.totalRaised > 0 ? `${formatUsd(org.totalRaised)} raised` : "No donations yet"}
          {org.activeCampaigns > 0
            ? ` · ${org.activeCampaigns} campaign${org.activeCampaigns === 1 ? "" : "s"}`
            : ""}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-meta font-semibold text-accent">
          View
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
