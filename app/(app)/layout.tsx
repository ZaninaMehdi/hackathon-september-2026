import { requireMemberContext } from "@/lib/auth/session";
import { getOfficiantPendingCount } from "@/lib/data/services";
import { getOrgProfile } from "@/lib/data/organization";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireMemberContext();
  const [pendingCount, profile] = await Promise.all([
    getOfficiantPendingCount(context.memberId),
    getOrgProfile(context.orgId),
  ]);

  return (
    <AppShell
      orgName={context.orgName}
      orgLogoUrl={profile?.logoUrl ?? null}
      email={context.email}
      roles={context.roles}
      pendingCount={pendingCount}
    >
      {children}
    </AppShell>
  );
}
