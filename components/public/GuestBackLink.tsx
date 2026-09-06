"use client";

import type { MouseEvent } from "react";
import Link from "next/link";

type GuestBackLinkProps = {
  href: string;
  label: string;
  preferHistory?: boolean;
};

export function GuestBackLink({ href, label, preferHistory = false }: GuestBackLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!preferHistory || typeof window === "undefined") return;
    const referrer = document.referrer;
    if (!referrer) return;
    try {
      if (new URL(referrer).origin === window.location.origin) {
        event.preventDefault();
        window.history.back();
      }
    } catch {
      // Fall through to href.
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="inline-flex items-center font-sans text-[12.5px] font-semibold text-accent"
    >
      ← {label}
    </Link>
  );
}
