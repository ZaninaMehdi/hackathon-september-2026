import type { Metadata } from "next";
import { OrgHomeBody } from "@/components/public/OrgHomeBody";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicPage } from "@/components/public/PublicPage";
import { formatUsd } from "@/lib/mock/project";
import { getStaffNav } from "@/lib/auth/session";
import { getPublicOrgHome } from "@/lib/data/project";
import { getPublicUpcomingEvents } from "@/lib/data/events";
import { getOfficiantsForService, getOpenSlots, getOrgNikahPrice } from "@/lib/data/services";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  const data = await getPublicOrgHome(orgSlug);

  const title = `${data.org.name} — Amanah`;
  const description = `${data.projects.length} active campaign${data.projects.length === 1 ? "" : "s"} · ${formatUsd(data.totalRaised)} raised so far. Every expense is posted with a receipt.`;

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
  const [events, nikahPrice, staff, officiants] = await Promise.all([
    getPublicUpcomingEvents(data.org.id),
    getOrgNikahPrice(data.org.id),
    getStaffNav(),
    getOfficiantsForService(data.org.id, "nikah"),
  ]);
  const slotEntries = await Promise.all(
    officiants.map(async (officiant) => [officiant.id, await getOpenSlots(officiant.id)] as const)
  );
  const slotsByOfficiant = Object.fromEntries(slotEntries);
  const openCount = data.projects.filter((project) => project.status === "active").length;

  return (
    <PublicPage>
      <PublicHeader
        title={data.org.name}
        titleHref={`/${orgSlug}`}
        logoUrl={data.org.logoUrl}
        staffHref={staff.href}
        staffLabel={staff.label}
        showVerified
        backHref="/"
        backLabel="All organizations"
      />

      {data.org.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.org.coverImageUrl}
          alt=""
          className="h-[140px] w-full object-cover min-[900px]:h-[200px]"
        />
      )}

      <section className="flex flex-col gap-5 px-[18px] py-[22px] min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-12 min-[900px]:px-8 min-[900px]:py-10">
        <div className="flex max-w-[62ch] flex-col gap-3">
          <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink min-[900px]:text-display">
            Give to {data.org.name}
          </h1>
          {data.org.description && (
            <p className="line-clamp-3 font-sans text-copy leading-[1.6] text-body">
              {data.org.description}
            </p>
          )}
          <p className="font-sans text-sm leading-[1.6] text-body">
            Pick Campaigns, Events, or Services below. No account needed.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline min-[900px]:w-[340px] min-[900px]:shrink-0">
          <div className="flex flex-col gap-0.5 bg-surface-raised px-4 py-3.5">
            <dt className="order-2 text-micro tracking-[0.02em] text-muted">
              {openCount === 1 ? "Open campaign" : "Open campaigns"}
            </dt>
            <dd className="order-1 font-display text-head font-bold tracking-[-0.02em] text-ink">
              {openCount}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 bg-surface-raised px-4 py-3.5">
            <dt className="order-2 text-micro tracking-[0.02em] text-muted">Raised so far</dt>
            <dd className="order-1 font-display text-head font-bold tracking-[-0.02em] text-ink">
              {formatUsd(data.totalRaised)}
            </dd>
          </div>
        </dl>
      </section>

      <OrgHomeBody
        orgId={data.org.id}
        orgSlug={orgSlug}
        projects={data.projects}
        events={events}
        nikahPrice={nikahPrice}
        officiants={officiants}
        slotsByOfficiant={slotsByOfficiant}
      />
    </PublicPage>
  );
}
