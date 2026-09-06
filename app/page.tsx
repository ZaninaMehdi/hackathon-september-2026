import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { OrgDirectory } from "@/components/public/OrgDirectory";
import { getStaffNav } from "@/lib/auth/session";
import { getPublicOrganizations } from "@/lib/data/project";

export const metadata: Metadata = {
  title: "Amanah — Donate without an account",
  description: "Find an organization, pick a campaign, and give. No signup required.",
};

export default async function Home() {
  const [orgs, staff] = await Promise.all([getPublicOrganizations(), getStaffNav()]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-surface min-[900px]:max-w-[560px]">
      <PublicHeader staffHref={staff.href} staffLabel={staff.label} />

      <section className="flex flex-col gap-4 px-[18px] py-[28px]">
        <p className="font-mono text-micro font-medium uppercase tracking-[0.08em] text-accent">
          Guest giving
        </p>
        <h1 className="font-display text-display font-bold tracking-[-0.03em] text-ink">
          Donate in two taps. No account.
        </h1>
        <p className="font-sans text-copy leading-[1.65] text-body">
          Open an organization&apos;s public page, choose the campaign you want to support, and
          check out. Stripe emails you a receipt. Staff sign in separately to keep the books.
        </p>
      </section>

      <div className="px-[18px] pb-12">
        <OrgDirectory orgs={orgs} />

        <p className="mt-8 text-center text-meta text-body">
          Manage an organization?{" "}
          <Link href={staff.href} className="font-semibold text-accent">
            {staff.label}
          </Link>
        </p>
      </div>
    </div>
  );
}
