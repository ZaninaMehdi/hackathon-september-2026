import { notFound, redirect } from "next/navigation";
import { requireMemberContext } from "@/lib/auth/session";
import { getJanazaOverview, getMemberSkills } from "@/lib/data/services";
import { JanazaOverviewClient } from "@/components/services/JanazaOverview";

export default async function JanazaOverviewPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const context = await requireMemberContext();
  const { requestId } = await params;
  const overview = await getJanazaOverview(requestId);

  if (!overview) {
    notFound();
  }

  if (overview.request.orgId !== context.orgId) {
    redirect("/services/janaza");
  }

  const canManage = context.roles.some((role) => role === "admin" || role === "treasurer");
  const skills = await getMemberSkills(context.memberId);

  return (
    <JanazaOverviewClient
      overview={overview}
      skills={skills}
      memberId={context.memberId}
      canManage={canManage}
    />
  );
}
