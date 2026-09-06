import { requireMemberContext } from "@/lib/auth/session";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireMemberContext();

  return (
    <AppShell email={context.email} roles={context.roles}>
      {children}
    </AppShell>
  );
}
