"use client";

import { DonateForm } from "@/components/public/DonateForm";
import type { DonatablePhase } from "@/lib/data/project";

type DonateFooterProps = {
  orgSlug: string;
  projectId: string;
  projectSlug: string;
  phaseId: string | null;
  phaseLabel: string;
  isAcceptingDonations: boolean;
  /** "bar" pins to the viewport bottom (mobile); "card" sits in the desktop sidebar. */
  variant?: "bar" | "card";
  className?: string;
  phases?: DonatablePhase[];
};

export function DonateFooter({
  orgSlug,
  projectId,
  projectSlug,
  phaseId,
  phaseLabel,
  isAcceptingDonations,
  variant = "bar",
  className = "",
  phases,
}: DonateFooterProps) {
  const body = (
    <>
      {variant === "card" && (
        <span className="mb-3 block font-mono text-micro font-medium uppercase tracking-[0.07em] text-muted">
          Support this campaign
        </span>
      )}

      <DonateForm
        orgSlug={orgSlug}
        projectId={projectId}
        projectSlug={projectSlug}
        phaseId={phaseId}
        phaseLabel={phaseLabel}
        isAcceptingDonations={isAcceptingDonations}
        phases={phases}
      />

      <p className="mt-2.5 text-center text-micro leading-[1.5] text-body">
        No account needed. Funds are held per phase. You&apos;ll get an emailed receipt.
      </p>
    </>
  );

  if (variant === "card") {
    return (
      <aside
        className={`sticky top-6 rounded-xl border border-hairline bg-surface-raised p-5 shadow-lift ${className}`}
      >
        {body}
      </aside>
    );
  }

  return (
    <footer
      className={`fixed bottom-0 left-1/2 w-full max-w-[440px] -translate-x-1/2 border-t border-hairline bg-surface px-[18px] pb-[18px] pt-3.5 ${className}`}
      style={{ paddingBottom: "calc(18px + env(safe-area-inset-bottom))" }}
    >
      {body}
    </footer>
  );
}
