import { requireMemberContext } from "@/lib/auth/session";
import {
  getOfficiantsForService,
  getOpenSlots,
  getOrgNikahPrice,
  getRequesterRequests,
} from "@/lib/data/services";
import { NikahRequestClient } from "@/components/services/NikahRequestClient";

export default async function NikahPage({
  searchParams,
}: {
  searchParams: Promise<{ officiantId?: string }>;
}) {
  const context = await requireMemberContext();
  const { officiantId } = await searchParams;
  const officiants = await getOfficiantsForService(context.orgId, "nikah");
  const selectedOfficiantId =
    officiants.find((item) => item.id === officiantId)?.id ?? officiants[0]?.id ?? null;
  const [slots, ownRequests, nikahPrice] = await Promise.all([
    selectedOfficiantId ? getOpenSlots(selectedOfficiantId) : Promise.resolve([]),
    getRequesterRequests(context.memberId),
    getOrgNikahPrice(context.orgId),
  ]);

  return (
    <NikahRequestClient
      officiants={officiants}
      selectedOfficiantId={selectedOfficiantId}
      slots={slots}
      ownRequests={ownRequests}
      nikahPrice={nikahPrice}
    />
  );
}
