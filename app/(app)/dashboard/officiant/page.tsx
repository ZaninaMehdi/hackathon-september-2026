import { requireMemberContext } from "@/lib/auth/session";
import {
  getMemberSkills,
  getOfficiantForMember,
  getOfficiantInbox,
  getOrgMembersForDesignate,
  getOrgNikahPrice,
} from "@/lib/data/services";
import { OfficiantSettingsClient } from "@/components/services/OfficiantSettingsClient";

export default async function OfficiantSettingsPage() {
  const context = await requireMemberContext();
  const canManage = context.roles.some((role) => role === "admin" || role === "treasurer");
  const officiant = await getOfficiantForMember(context.memberId);
  const inbox = officiant ? await getOfficiantInbox(officiant) : null;
  const members = canManage ? await getOrgMembersForDesignate(context.orgId) : [];
  const [skills, nikahPrice] = await Promise.all([
    getMemberSkills(context.memberId),
    getOrgNikahPrice(context.orgId),
  ]);

  return (
    <OfficiantSettingsClient
      inbox={inbox}
      recurring={inbox?.recurring ?? []}
      canManage={canManage}
      members={members}
      skills={skills}
      nikahPrice={nikahPrice}
    />
  );
}
