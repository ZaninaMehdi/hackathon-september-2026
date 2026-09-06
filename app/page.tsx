import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { OrgDirectory } from "@/components/public/OrgDirectory";
import { FeaturedCampaignCard } from "@/components/public/FeaturedCampaignCard";
import { Logo } from "@/components/brand/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { getStaffNav } from "@/lib/auth/session";
import {
  getFeaturedPublicCampaign,
  getPublicOrganizations,
  getPublicReceiptCoverage,
} from "@/lib/data/project";
import { formatUsd } from "@/lib/mock/project";

export const metadata: Metadata = {
  title: "Amanah — Donate without an account",
  description:
    "Find an organization, pick a campaign, and give. No signup required.",
};

const LANDING_LINKS = [
  { href: "#organizations", label: "Organizations" },
  { href: "#how-it-works", label: "How it works" },
];

const TRUST_ITEMS = [
  "Secure Stripe checkout",
  "Receipts posted publicly",
  "Every expense published",
];

const STEPS = [
  {
    title: "Pick a campaign",
    body: "Choose your organization, then the phase you want to fund. Budgets and remaining amounts are shown before you give.",
  },
  {
    title: "Check out as a guest",
    body: "No account, no password. Stripe handles the payment and emails your receipt straight away.",
  },
  {
    title: "Watch the phase close",
    body: "Each approved expense appears on the campaign page with its receipt. You get a note when your phase finishes.",
  },
];

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M1.5 5.2L3.8 7.5L8.5 2.5"
        className="stroke-accent"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function Home() {
  const [orgs, staff, featured, receiptCoverage] = await Promise.all([
    getPublicOrganizations(),
    getStaffNav(),
    getFeaturedPublicCampaign(),
    getPublicReceiptCoverage(),
  ]);

  const openCampaigns = orgs.reduce((sum, org) => sum + org.activeCampaigns, 0);
  const totalRaised = orgs.reduce((sum, org) => sum + org.totalRaised, 0);

  const stats = [
    {
      value: String(orgs.length),
      label: orgs.length === 1 ? "Organization" : "Organizations",
    },
    {
      value: String(openCampaigns),
      label: openCampaigns === 1 ? "Open campaign" : "Open campaigns",
    },
    { value: formatUsd(totalRaised), label: "Raised by the community" },
    { value: `${receiptCoverage}%`, label: "Of spending posted with receipts" },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface">
      <div className="mx-auto w-full max-w-[1120px]">
        <PublicHeader
          staffHref={staff.href}
          staffLabel={staff.label}
          links={LANDING_LINKS}
          staffVariant="button"
        />
      </div>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-10 px-[18px] py-10 min-[900px]:grid-cols-[1.05fr_0.95fr] min-[900px]:items-center min-[900px]:gap-14 min-[900px]:px-8 min-[900px]:py-16">
          <div className="flex flex-col gap-5">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-accent-wash px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.08em] text-accent uppercase">
              <CheckIcon />
              Guest giving · no account
            </p>
            <h1 className="max-w-[16ch] font-display text-display font-bold tracking-[-0.03em] text-ink min-[900px]:text-[44px] min-[900px]:leading-[1.08]">
              Donate in two taps. See where it went.
            </h1>
            <p className="max-w-[52ch] font-sans text-copy leading-[1.65] text-body min-[900px]:text-subhead min-[900px]:leading-[1.6]">
              Find your masjid or community center, choose a campaign, and check
              out. Stripe emails the receipt. Every approved expense is
              published back to the campaign — with the receipt attached.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="#organizations"
                className={buttonClasses({ size: "lg" })}
              >
                Browse organizations
              </Link>
              <Link
                href="#how-it-works"
                className={buttonClasses({ size: "lg", variant: "secondary" })}
              >
                How it works
              </Link>
            </div>

            <ul className="grid list-none grid-cols-1 gap-x-6 gap-y-2 min-[480px]:grid-cols-2">
              {TRUST_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 text-meta text-body"
                >
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {featured ? (
            <FeaturedCampaignCard campaign={featured} />
          ) : (
            <div className="flex min-h-[280px] flex-col justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-sunken px-6 py-8">
              <p className="font-sans text-copy font-semibold text-ink">
                No live campaigns yet
              </p>
              <p className="text-meta text-body">
                When an organization publishes a campaign, it will appear here
                with its goal, phases, and posted expenses.
              </p>
            </div>
          )}
        </section>

        <section className="border-y border-hairline bg-surface-sunken">
          <dl className="mx-auto grid w-full max-w-[1120px] grid-cols-2 gap-px min-[900px]:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex min-w-0 flex-col gap-1 px-[18px] py-5 min-[900px]:px-8"
              >
                <dt className="order-2 text-micro tracking-[0.02em] text-muted">
                  {stat.label}
                </dt>
                <dd
                  title={stat.value}
                  className="order-1 truncate font-display text-head font-bold tracking-[-0.02em] text-ink"
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-16 px-[18px] py-14 min-[900px]:px-8 min-[900px]:py-16">
          <section
            id="how-it-works"
            className="flex flex-col gap-6 scroll-mt-8"
          >
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-head font-bold tracking-[-0.02em] text-ink min-[900px]:text-[28px] min-[900px]:leading-[1.2]">
                How it works
              </h2>
              <p className="max-w-[56ch] text-meta text-body">
                Three steps for a donor, and one loop that closes: money in,
                work done, receipt posted.
              </p>
            </div>
            <ol className="grid list-none grid-cols-1 gap-4 min-[720px]:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-2.5 rounded-xl border border-hairline bg-surface-raised p-5"
                >
                  <span className="font-mono text-meta font-medium text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-copy font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="text-meta leading-[1.55] text-body">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <OrgDirectory orgs={orgs} setupHref="/onboarding" />
        </div>
      </main>

      <footer className="border-t border-hairline bg-surface-sunken">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-[18px] py-8 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between min-[900px]:px-8">
          <div className="flex flex-col gap-1.5">
            <Logo size="sm" wordmarkClassName="text-accent" />
            <p className="text-meta text-muted">
              Transparent capital projects for community organizations.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LANDING_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-meta font-semibold text-body transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={staff.href}
              className="text-meta font-semibold text-body transition-colors hover:text-ink"
            >
              {staff.label}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
