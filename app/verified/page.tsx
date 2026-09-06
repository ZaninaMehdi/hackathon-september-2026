import Link from "next/link";
import { Mark } from "@/components/brand/Mark";
import { buttonClasses } from "@/components/ui/Button";

export default function VerifiedExplainerPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col gap-6 bg-surface px-[18px] py-8">
      <Mark size={32} />

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
          What &quot;Verified books&quot; means
        </h1>
        <p className="text-sm leading-[1.6] text-body">
          Nothing appears on a project&apos;s public page until it has cleared the org&apos;s
          approval process. That&apos;s the whole trust mechanic — a donation shows up the moment
          it&apos;s made, and an expense only shows up once it has been reviewed and signed off.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent">
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1.5 5.2L3.8 7.5L8.5 2.5"
                className="stroke-on-accent"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Every expense needs a receipt</h2>
            <p className="text-meta leading-[1.6] text-body">
              A photo of the receipt is required before anything can be submitted for approval.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="mt-0.5 inline-block h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-pending-border" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Larger expenses need two signatures</h2>
            <p className="text-meta leading-[1.6] text-body">
              Above the org&apos;s threshold, two board members must independently approve before
              it publishes. Below it, one approval is enough.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent">
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1.5 5.2L3.8 7.5L8.5 2.5"
                className="stroke-on-accent"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Numbers are computed, not entered</h2>
            <p className="text-meta leading-[1.6] text-body">
              Raised, spent, and phase progress are derived directly from donation and expense
              records — the public page can never disagree with the ledger.
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className={buttonClasses({
          variant: "ghost",
          size: "sm",
          className: "-ml-3 self-start text-accent",
        })}
      >
        ← Back
      </Link>
    </div>
  );
}
