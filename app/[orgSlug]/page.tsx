import Link from "next/link";
import type { Metadata } from "next";
import { Mark } from "@/components/brand/Mark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { OrgSections } from "@/components/public/OrgSections";
import { formatUsd } from "@/lib/mock/project";
import { getPublicOrgHome } from "@/lib/data/project";
import { getPublicUpcomingEvents } from "@/lib/data/events";
import { getOrgNikahPrice } from "@/lib/data/services";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  const data = await getPublicOrgHome(orgSlug);

  const title = `${data.org.name} — Amanah`;
  const description = `${data.projects.length} active project${data.projects.length === 1 ? "" : "s"} · ${formatUsd(data.totalRaised)} raised so far. Every expense is posted with a receipt.`;

  return {
    title,
    description,
    openGraph: { title, description, siteName: "Amanah", type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const data = await getPublicOrgHome(orgSlug);
  const [events, nikahPrice] = await Promise.all([
    getPublicUpcomingEvents(data.org.id),
    getOrgNikahPrice(data.org.id),
  ]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-surface">
      <header className="flex items-center gap-2.5 border-b border-hairline px-[18px] py-3.5">
        <Mark size={26} />
        <div className="flex flex-col">
          <span className="font-display text-[15px] font-semibold tracking-[0.01em] text-ink">
            {data.org.name}
          </span>
        </div>
        <Link
          href="/verified"
          className="ml-auto inline-flex items-center rounded-pill bg-accent-wash px-2 py-[5px] font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-accent"
        >
          Verified books
        </Link>
        <ThemeToggle className="-mr-1 shrink-0" />
      </header>

      <section className="flex flex-col gap-4 px-[18px] py-[22px]">
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
          What&apos;s happening at {data.org.name}
        </h1>
        <p className="font-sans text-sm leading-[1.6] text-body">
          Browse projects to donate to, upcoming events, and services you can request — all in one
          place.
        </p>
      </section>

      <OrgSections
        orgId={data.org.id}
        orgSlug={orgSlug}
        projects={data.projects}
        totalRaised={data.totalRaised}
        totalGoal={data.totalGoal}
        events={events}
        nikahPrice={nikahPrice}
      />
    </div>
  );
}
