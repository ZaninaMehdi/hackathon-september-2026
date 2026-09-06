import type { Metadata } from "next";
import { OrgCampaignPicker } from "@/components/public/OrgCampaignPicker";
import { OrgSections } from "@/components/public/OrgSections";
import { PublicHeader } from "@/components/public/PublicHeader";
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
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-surface">
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
        <img src={data.org.coverImageUrl} alt="" className="h-[160px] w-full object-cover" />
      )}

      <section className="flex flex-col gap-4 px-[18px] py-[22px]">
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
          Give to {data.org.name}
        </h1>
        {data.org.description && (
          <p className="font-sans text-copy leading-[1.6] text-body">{data.org.description}</p>
        )}
        <p className="font-sans text-sm leading-[1.6] text-body">
          {openCount} open campaign{openCount === 1 ? "" : "s"} · {formatUsd(data.totalRaised)}{" "}
          raised so far. Select a campaign below to donate — no account needed.
        </p>
      </section>

      <OrgCampaignPicker orgSlug={orgSlug} projects={data.projects} />

      <OrgSections
        orgId={data.org.id}
        orgSlug={orgSlug}
        events={events}
        nikahPrice={nikahPrice}
        officiants={officiants}
        slotsByOfficiant={slotsByOfficiant}
      />
    </div>
  );
}
