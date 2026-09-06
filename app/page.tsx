import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { OrgDirectory } from "@/components/public/OrgDirectory";
import { buttonClasses } from "@/components/ui/Button";
import { getStaffNav } from "@/lib/auth/session";
import { getPublicOrganizations } from "@/lib/data/project";
import { formatUsd } from "@/lib/mock/project";

export const metadata: Metadata = {
  title: "Amanah — Donate without an account",
  description: "Find an organization, pick a campaign, and give. No signup required.",
};

const STEPS = [
  {
    title: "Pick an organization",
    body: "Browse masjids and community centers with a public page.",
  },
  {
    title: "Choose a campaign",
    body: "Every campaign shows its goal, its phases, and what it has raised.",
  },
  {
    title: "Give and get a receipt",
    body: "Check out with Stripe. No account, no password, receipt by email.",
  },
];

export default async function Home() {
  const [orgs, staff] = await Promise.all([getPublicOrganizations(), getStaffNav()]);

  const openCampaigns = orgs.reduce((sum, org) => sum + org.activeCampaigns, 0);
  const totalRaised = orgs.reduce((sum, org) => sum + org.totalRaised, 0);

  const stats = [
    { value: String(orgs.length), label: orgs.length === 1 ? "Organization" : "Organizations" },
    { value: String(openCampaigns), label: openCampaigns === 1 ? "Open campaign" : "Open campaigns" },
    { value: formatUsd(totalRaised), label: "Raised so far" },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1080px] flex-col bg-surface">
      <PublicHeader staffHref={staff.href} staffLabel={staff.label} />

      <main className="flex flex-1 flex-col gap-14 px-[18px] pb-16 min-[900px]:px-8">
        <section className="flex flex-col gap-5 pt-10 min-[900px]:pt-16">
          <p className="font-mono text-micro font-medium tracking-[0.08em] text-accent uppercase">
            Guest giving
          </p>
          <h1 className="max-w-[16ch] font-display text-display font-bold tracking-[-0.03em] text-ink min-[900px]:text-[44px] min-[900px]:leading-[1.08]">
            Donate in two taps. No account.
          </h1>
          <p className="max-w-[62ch] font-sans text-copy leading-[1.65] text-body min-[900px]:text-subhead min-[900px]:leading-[1.6]">
            Find your masjid or community center, choose the campaign you want to support, and
            check out. Stripe emails the receipt. Every approved expense is published back to the
            campaign, so you can see where the money went.
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <Link href="#organizations" className={buttonClasses({ size: "lg" })}>
              Browse organizations
            </Link>
            <Link
              href={staff.href}
              className={buttonClasses({ size: "lg", variant: "secondary" })}
            >
              {staff.label}
            </Link>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5 bg-surface-raised px-4 py-3.5">
                <dt className="order-2 text-micro tracking-[0.02em] text-muted">{stat.label}</dt>
                <dd className="order-1 font-display text-head font-bold tracking-[-0.02em] text-ink">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <OrgDirectory orgs={orgs} />

        <section className="flex flex-col gap-5">
          <h2 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
            How it works
          </h2>
          <ol className="grid list-none grid-cols-1 gap-4 min-[720px]:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-4 shadow-card"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-wash font-mono text-meta font-medium text-accent">
                  {index + 1}
                </span>
                <h3 className="text-copy font-semibold text-ink">{step.title}</h3>
                <p className="text-meta leading-[1.55] text-body">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-hairline px-[18px] py-6 min-[900px]:px-8">
        <p className="text-center text-meta text-body">
          Manage an organization?{" "}
          <Link href={staff.href} className="font-semibold text-accent hover:underline">
            {staff.label}
          </Link>
        </p>
      </footer>
    </div>
  );
}
