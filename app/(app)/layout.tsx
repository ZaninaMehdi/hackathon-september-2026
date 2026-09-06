import { requireMemberContext } from "@/lib/auth/session";
import { getOfficiantPendingCount } from "@/lib/data/services";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireMemberContext();
  const pendingCount = await getOfficiantPendingCount(context.memberId);

  return (
    <AppShell email={context.email} roles={context.roles} pendingCount={pendingCount}>
      {children}
    </AppShell>
  );
}
