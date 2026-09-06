import { requireMemberContext } from "@/lib/auth/session";
import { getMemberSkills, getRequesterRequests } from "@/lib/data/services";
import { JanazaRequestForm } from "@/components/services/JanazaRequestForm";

export default async function JanazaPage() {
  const context = await requireMemberContext();
  const [ownRequests, skills] = await Promise.all([
    getRequesterRequests(context.memberId),
    getMemberSkills(context.memberId),
  ]);
  return <JanazaRequestForm ownRequests={ownRequests} skills={skills} />;
}
