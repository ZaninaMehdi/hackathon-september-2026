import Link from "next/link";
import { requireMemberContext } from "@/lib/auth/session";
import { JANAZA_PRICE } from "@/lib/data/service-prices";
import { getOfficiantForMember, getOfficiantPendingCount, getOrgNikahPrice } from "@/lib/data/services";
import { PendingCountBadge } from "@/components/services/PendingCountBadge";
import { NikahFee, ServicePrice } from "@/components/services/ServicePrice";

export default async function ServicesHubPage() {
  const context = await requireMemberContext();
  const officiant = await getOfficiantForMember(context.memberId);
  const [pendingCount, nikahPrice] = await Promise.all([
    officiant ? getOfficiantPendingCount(context.memberId) : Promise.resolve(0),
    getOrgNikahPrice(context.orgId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 p-4 min-[900px]:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">Bookings</h1>
        <p className="text-meta text-body">
          Book a nikah or janaza, or jump to community events.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 min-[700px]:grid-cols-2">
        <Link
          href="/services/nikah"
          className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-4"
        >
          <span className="text-copy font-semibold text-ink">Nikah</span>
          <NikahFee amount={nikahPrice} compact />
          <span className="text-meta text-body">
            Browse open slots and hold one for confirmation.
          </span>
        </Link>
        <Link
          href="/services/janaza"
          className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface-raised p-4"
        >
          <span className="text-copy font-semibold text-ink">Janaza</span>
          <ServicePrice price={JANAZA_PRICE} compact />
          <span className="text-meta text-body">
            Send an urgent request. Salat and ghusl are claimed; transport and cemetery are coordinated.
          </span>
        </Link>
      </div>

      <Link
        href="/events"
        className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface-raised px-4 py-3.5"
      >
        <span className="text-copy font-semibold text-ink">Events</span>
        <span className="text-meta text-body">
          Community calendar — classes, fundraisers, and gatherings.
        </span>
      </Link>

      <Link
        href="/dashboard/officiant"
        className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-raised px-4 py-3.5"
      >
        <div className="flex flex-col">
          <span className="text-copy font-semibold text-ink">Officiant desk</span>
          <span className="text-meta text-body">
            {officiant ? "Confirm holds, claim broadcasts, and set weekly hours." : "Register as an officiant."}
          </span>
        </div>
        <span className="ml-auto">
          <PendingCountBadge count={pendingCount} />
        </span>
      </Link>
    </div>
  );
}
