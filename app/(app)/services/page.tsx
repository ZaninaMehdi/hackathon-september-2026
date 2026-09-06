import { requireMemberContext } from "@/lib/auth/session";
import {
  getClaimableJanazaTasks,
  getGuestServiceInquiries,
  getMemberSkills,
  getOfficiantForMember,
  getOfficiantInbox,
  getOfficiantPendingCount,
} from "@/lib/data/services";
import { OfficiantDashboardClient } from "@/components/services/OfficiantDashboardClient";

export default async function ServicesDeskPage() {
  const context = await requireMemberContext();
  const officiant = await getOfficiantForMember(context.memberId);
  const inbox = officiant ? await getOfficiantInbox(officiant) : null;
  const skills = await getMemberSkills(context.memberId);
  const claimableTasks = await getClaimableJanazaTasks(context.memberId, skills, context.orgId);
  const [pendingCount, guestInquiries] = await Promise.all([
    getOfficiantPendingCount(context.memberId),
    getGuestServiceInquiries(context.orgId),
  ]);

  return (
    <OfficiantDashboardClient
      inbox={inbox}
      pendingCount={pendingCount}
      claimableTasks={claimableTasks}
      memberId={context.memberId}
      guestInquiries={guestInquiries}
    />
  );
}
