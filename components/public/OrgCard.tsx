"use client";

import Image from "next/image";
import Link from "next/link";
import { useId } from "react";
import { formatUsd } from "@/lib/mock/project";
import type { PublicOrgDirectoryItem } from "@/lib/data/project";

/** "Masjid-al-sabr" -> "MS", "Amanah" -> "AM". */
function initials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

/* Stands in for a photo the org hasn't uploaded. Arches rather than a flat
   swatch so a card without an image still looks composed next to one with a
   real photo. */
function CoverFallback({ name }: { name: string }) {
  const patternId = useId();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-wash via-accent-tint to-surface-sunken">
      <svg className="absolute inset-0 h-full w-full text-accent/[0.09]" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="30" height="36" patternUnits="userSpaceOnUse">
            <path
              d="M15 4c5.2 0 9.5 4.3 9.5 9.5V33h-19V13.5C5.5 8.3 9.8 4 15 4Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <span className="relative font-display text-[42px] font-bold tracking-[0.02em] text-accent/30">
        {initials(name)}
      </span>
    </div>
  );
}

/* Cards sit in a 1-to-2 column grid inside a 1080px container, so a card is
   roughly full width on phones and just under half the viewport above 720px. */
const COVER_SIZES = "(min-width: 1140px) 520px, (min-width: 720px) 46vw, 92vw";

export function OrgCard({ org }: { org: PublicOrgDirectoryItem }) {
  const hasCampaigns = org.activeCampaigns > 0;

  return (
    <Link
      href={`/${org.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-surface-raised shadow-card outline-none transition duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lift focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-accent-tint">
        {org.coverImageUrl ? (
          <Image
            src={org.coverImageUrl}
            alt=""
            fill
            sizes={COVER_SIZES}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <CoverFallback name={org.name} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4">
        {/* Pulled up over the cover, with a ring in the card colour so the mark
            reads as punched through the photo's bottom edge. */}
        <div className="relative -mt-8 h-16 w-16 overflow-hidden rounded-xl bg-surface-raised ring-4 ring-surface-raised">
          {org.logoUrl ? (
            <Image src={org.logoUrl} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-xl bg-accent-wash font-display text-subhead font-bold text-accent">
              {initials(org.name)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-display text-subhead font-bold tracking-[-0.01em] text-ink">
            {org.name}
          </h3>
          {org.orgType && (
            <span className="rounded-pill bg-accent-wash px-2 py-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-accent">
              {org.orgType}
            </span>
          )}
        </div>

        {org.description && (
          <p className="line-clamp-2 text-meta leading-[1.55] text-body">{org.description}</p>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-hairline-soft pt-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-meta font-semibold text-ink">
              {hasCampaigns
                ? `${org.activeCampaigns} open campaign${org.activeCampaigns === 1 ? "" : "s"}`
                : "No open campaigns"}
            </span>
            {org.totalRaised > 0 && (
              <span className="font-mono text-micro text-muted">
                {formatUsd(org.totalRaised)} raised
              </span>
            )}
          </div>
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
      </div>
    </Link>
  );
}
