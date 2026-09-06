import { requireMemberContext } from "@/lib/auth/session";
import {
  getClaimableJanazaTasks,
  getMemberSkills,
  getOfficiantForMember,
  getOfficiantInbox,
  getOfficiantPendingCount,
  getOrgMembersForDesignate,
  getOrgNikahPrice,
} from "@/lib/data/services";
import { OfficiantDashboardClient } from "@/components/services/OfficiantDashboardClient";

export default async function OfficiantDashboardPage() {
  const context = await requireMemberContext();
  const canManage = context.roles.some((role) => role === "admin" || role === "treasurer");
  const officiant = await getOfficiantForMember(context.memberId);
  const inbox = officiant ? await getOfficiantInbox(officiant) : null;
  const members = canManage ? await getOrgMembersForDesignate(context.orgId) : [];
  const skills = await getMemberSkills(context.memberId);
  const claimableTasks = await getClaimableJanazaTasks(context.memberId, skills, context.orgId);
  const [pendingCount, nikahPrice] = await Promise.all([
    getOfficiantPendingCount(context.memberId),
    getOrgNikahPrice(context.orgId),
  ]);

  return (
    <OfficiantDashboardClient
      inbox={inbox}
      recurring={inbox?.recurring ?? []}
      canManage={canManage}
      members={members}
      pendingCount={pendingCount}
      skills={skills}
      claimableTasks={claimableTasks}
      memberId={context.memberId}
      nikahPrice={nikahPrice}
    />
  );
}
